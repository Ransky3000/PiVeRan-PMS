---
name: youtube-extractor
description: Extract a YouTube video's transcript and periodic screenshots for competitor/market research. Use when the user wants to pull a video's transcript, analyze a YouTube video's content, or study a creator's video (e.g. for AI automation market research).
---

# YouTube Extractor

## When to Use This Skill

Use this skill when the user wants to:
- Pull the transcript of a YouTube video
- Grab periodic screenshots/frames from a YouTube video (e.g. to study slide content, on-screen UI, thumbnails/pacing)
- Research a competitor or creator's YouTube content for `Career Strategy/Market Research/`
- Mentions: "get the transcript for this video", "extract this YouTube video", "pull screenshots from this video", "analyze this YouTuber's content"

## How It Works

Runs [scripts/extract_youtube.py](scripts/extract_youtube.py), which:
1. Parses a video ID out of a raw ID or any YouTube URL (watch, youtu.be, shorts)
2. Downloads the transcript via `youtube_transcript_api`, timestamped `[MM:SS]` per line
3. Downloads the video in lowest quality via `yt_dlp`, extracts one frame every N seconds with `opencv-python`, then deletes the temporary video file

Output goes to `Career Strategy/Market Research/` by default, matching the existing pipeline:
- `transcripts/transcript_<video_id>.txt`
- `screenshots/screenshots_<video_id>/frame_MM_SS.jpg`

## Usage

```bash
python .claude/skills/youtube-extractor/scripts/extract_youtube.py <video_id_or_url> [options]
```

Options:
- `--output-dir DIR` — base output directory (default: `Career Strategy/Market Research`)
- `--interval SECONDS` — screenshot interval in seconds (default: 30)
- `--no-screenshots` — transcript only, skip video download entirely (fast, no disk-heavy download)
- `--no-transcript` — screenshots only

### Examples

Transcript + screenshots, default location:
```bash
python .claude/skills/youtube-extractor/scripts/extract_youtube.py https://youtu.be/dQw4w9WgXcQ
```

Transcript only (quick competitor-content skim, no video download):
```bash
python .claude/skills/youtube-extractor/scripts/extract_youtube.py dQw4w9WgXcQ --no-screenshots
```

Denser screenshots for a slide-heavy video:
```bash
python .claude/skills/youtube-extractor/scripts/extract_youtube.py dQw4w9WgXcQ --interval 10
```

## Requirements

Python packages: `yt-dlp`, `opencv-python` (`cv2`), `youtube-transcript-api`. Already installed in this environment — if missing elsewhere: `pip install yt-dlp opencv-python youtube-transcript-api`.

## Notes

- If a video has no English transcript, the script falls back to the first available transcript language.
- If a video has no captions at all, or screenshot extraction is not needed, prefer `--no-screenshots` to avoid an unnecessary video download.
- Video download is intentionally lowest-quality (`format: worst`) since screenshots are the only thing extracted from it — the file itself is deleted afterward.

## Limitations

- Use this skill only for research/analysis purposes (transcripts, screenshots) — it is not a general-purpose video downloader/saver.
- Some videos may be region-locked, age-restricted, or otherwise blocked from `yt_dlp`/transcript access; the script will print an error rather than fail silently, but won't retry with alternate methods.
- Respect YouTube's Terms of Service and applicable copyright law when reusing extracted content.
