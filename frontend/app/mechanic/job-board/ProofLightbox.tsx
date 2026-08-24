import React from "react";
import { X, Camera } from "lucide-react";
import { JobOrder } from "@/app/types";
import { getItemPhotos } from "./mechanicHelpers";

interface ProofLightboxProps {
  lightboxData: { itemIdx: number; photoIdx: number } | null;
  drawerJobOrder: JobOrder | null;
  onClose: () => void;
  onSelectPhoto: (photoIdx: number) => void;
  onRemovePhoto: (itemIdx: number, photoIdx: number) => void;
  onAddPhoto: (itemIdx: number, e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProofLightbox: React.FC<ProofLightboxProps> = ({
  lightboxData,
  drawerJobOrder,
  onClose,
  onSelectPhoto,
  onRemovePhoto,
  onAddPhoto
}) => {
  if (!lightboxData || !drawerJobOrder) return null;

  const currentItem = drawerJobOrder.inspectionItems?.[lightboxData.itemIdx];
  const photos = currentItem ? getItemPhotos(currentItem) : [];

  const isIssue = currentItem?.status === "ISSUE";
  const isMonitor = currentItem?.status === "MONITOR";

  const lightboxStyle = isIssue
    ? {
        border: "border-red-600/40",
        bgBadge: "bg-red-500/20 text-red-300 border-red-500/40",
        activeBorder: "border-red-500 shadow-red-900/40",
        addHoverBorder: "hover:border-red-500",
        addHoverText: "hover:text-red-400"
      }
    : isMonitor
    ? {
        border: "border-amber-600/40",
        bgBadge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        activeBorder: "border-amber-500 shadow-amber-900/40",
        addHoverBorder: "hover:border-amber-500",
        addHoverText: "hover:text-amber-400"
      }
    : {
        border: "border-emerald-600/40",
        bgBadge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        activeBorder: "border-emerald-500 shadow-emerald-900/40",
        addHoverBorder: "hover:border-emerald-500",
        addHoverText: "hover:text-emerald-400"
      };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col p-4 sm:p-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border uppercase tracking-wider ${lightboxStyle.bgBadge}`}>
            {currentItem?.status || "PROOF"}
          </span>
          <div>
            <h3 className="text-base font-bold text-white leading-tight">{currentItem?.name}</h3>
            <p className="text-xs text-slate-400">
              Visual Proof Documentation ({photos.length} Photo{photos.length !== 1 ? "s" : ""})
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 pt-4 min-h-0 overflow-hidden">
        {/* Left Thumbnails List */}
        <div className="md:w-32 flex md:flex-col gap-2.5 overflow-x-auto md:overflow-y-auto pr-1 shrink-0">
          {photos.map((photo, pIdx) => {
            const isActive = pIdx === lightboxData.photoIdx;
            return (
              <div
                key={pIdx}
                onClick={() => onSelectPhoto(pIdx)}
                className={`relative w-24 h-24 rounded-2xl border-2 overflow-hidden bg-slate-900 cursor-pointer transition-all shrink-0 group ${
                  isActive ? lightboxStyle.activeBorder : "border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100"
                }`}
              >
                <img src={photo} alt={`Thumbnail ${pIdx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePhoto(lightboxData.itemIdx, pIdx);
                  }}
                  className="absolute top-1 right-1 p-1 bg-slate-950/80 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer shadow-md"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          <label className={`w-24 h-20 rounded-2xl border-2 border-dashed border-slate-700 ${lightboxStyle.addHoverBorder} bg-slate-900/50 hover:bg-slate-800 flex flex-col items-center justify-center cursor-pointer transition-all text-slate-400 ${lightboxStyle.addHoverText} text-xs gap-1 shrink-0`}>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => onAddPhoto(lightboxData.itemIdx, e)}
              className="hidden"
            />
            <Camera className="w-4 h-4" />
            <span className="text-[10px] font-semibold">+ Photo</span>
          </label>
        </div>

        {/* Center Main High-Res Preview */}
        <div className="flex-1 flex items-center justify-center bg-slate-900/60 rounded-3xl border border-slate-800/80 p-4 relative overflow-hidden">
          {(() => {
            const activePhoto = photos[lightboxData.photoIdx];
            if (!activePhoto) return null;
            return (
              <img
                src={activePhoto}
                alt="Full preview"
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              />
            );
          })()}
        </div>
      </div>
    </div>
  );
};
