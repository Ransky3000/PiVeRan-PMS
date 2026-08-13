#!/usr/bin/env python
"""Extract a transcript and periodic screenshots from a YouTube video.

Usage:
    python extract_youtube.py VIDEO_ID_OR_URL [--output-dir DIR] [--interval SECONDS]
                               [--no-screenshots] [--no-transcript]

Writes:
    <output-dir>/transcripts/transcript_<id>.txt
    <output-dir>/screenshots/screenshots_<id>/frame_MM_SS.jpg
"""
import argparse
import os
import re
import sys

import cv2
import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi


def parse_video_id(value: str) -> str:
    match = re.search(r"(?:v=|youtu\.be/|shorts/)([A-Za-z0-9_-]{11})", value)
    if match:
        return match.group(1)
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", value):
        return value
    raise ValueError(f"Could not parse a video ID from: {value}")


def download_transcript(video_id: str, output_path: str) -> None:
    print(f"Downloading transcript for {video_id}...")
    try:
        api = YouTubeTranscriptApi()
        transcript_list = api.list(video_id)
        try:
            transcript = transcript_list.find_transcript(["en", "fil", "tl"])
        except Exception:
            transcript = next(iter(transcript_list))

        data = transcript.fetch()
        lines = []
        for x in data:
            minutes = int(x.start // 60)
            seconds = int(x.start % 60)
            lines.append(f"[{minutes:02d}:{seconds:02d}] {x.text}")

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
        print(f"Transcript saved to {output_path}. Total lines: {len(lines)}")
    except Exception as e:
        print(f"Error downloading transcript: {e}")


def download_video(video_id: str, output_filename: str) -> bool:
    print(f"Downloading video {video_id} in low quality...")
    try:
        ydl_opts = {
            "format": "worst",
            "outtmpl": output_filename,
            "extractor_args": {"youtube": {"player_client": ["android"]}},
            "quiet": True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([f"https://youtu.be/{video_id}"])
        print("Video download complete!")
        return True
    except Exception as e:
        print(f"Error downloading video: {e}")
        return False


def extract_frames(video_path: str, output_dir: str, interval_seconds: int = 30) -> None:
    print(f"Extracting frames from {video_path} to {output_dir} every {interval_seconds}s...")
    try:
        os.makedirs(output_dir, exist_ok=True)

        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps == 0:
            print("Error: FPS is 0 or could not read video properties.")
            return

        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration_seconds = frame_count / fps
        print(f"FPS: {fps}, Total frames: {frame_count}, Duration: {duration_seconds:.2f}s")

        interval_frames = max(int(fps * interval_seconds), 1)
        count = 0
        saved_count = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if count % interval_frames == 0:
                current_sec = count / fps
                minutes = int(current_sec // 60)
                seconds = int(current_sec % 60)
                filename = os.path.join(output_dir, f"frame_{minutes:02d}_{seconds:02d}.jpg")
                cv2.imwrite(filename, frame)
                saved_count += 1

            count += 1

        cap.release()
        print(f"Extracted {saved_count} frames successfully!")
    except Exception as e:
        print(f"Error extracting frames: {e}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", help="YouTube video ID or URL")
    parser.add_argument(
        "--output-dir",
        default=os.path.join("Career Strategy", "Market Research"),
        help="Base output directory (default: Career Strategy/Market Research)",
    )
    parser.add_argument("--interval", type=int, default=30, help="Screenshot interval in seconds (default: 30)")
    parser.add_argument("--no-screenshots", action="store_true", help="Skip video download and frame extraction")
    parser.add_argument("--no-transcript", action="store_true", help="Skip transcript download")
    args = parser.parse_args()

    video_id = parse_video_id(args.video)

    transcript_path = os.path.join(args.output_dir, "transcripts", f"transcript_{video_id}.txt")
    screenshots_dir = os.path.join(args.output_dir, "screenshots", f"screenshots_{video_id}")
    tmp_video_path = f"_tmp_video_{video_id}.mp4"

    if not args.no_transcript:
        download_transcript(video_id, transcript_path)

    if not args.no_screenshots:
        if download_video(video_id, tmp_video_path):
            extract_frames(tmp_video_path, screenshots_dir, interval_seconds=args.interval)
            if os.path.exists(tmp_video_path):
                os.remove(tmp_video_path)
                print("Temporary video file removed.")


if __name__ == "__main__":
    sys.exit(main())
