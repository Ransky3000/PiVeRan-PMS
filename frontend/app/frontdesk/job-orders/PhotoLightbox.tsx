import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { JobOrder } from "@/app/types";
import { getItemPhotos } from "./jobOrderHelpers";

interface PhotoLightboxProps {
  lightboxData: { itemIdx: number; photoIdx: number } | null;
  drawerJobOrder: JobOrder | null;
  onClose: () => void;
  onSelectPhoto: (photoIdx: number) => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  lightboxData,
  drawerJobOrder,
  onClose,
  onSelectPhoto
}) => {
  if (!lightboxData || !drawerJobOrder) return null;

  const currentItem = drawerJobOrder.inspectionItems?.[lightboxData.itemIdx];
  const photos = currentItem ? getItemPhotos(currentItem) : [];
  const activePhoto = photos[lightboxData.photoIdx];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] bg-slate-950/95 flex flex-col p-6 text-white">
        {/* Lightbox Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div>
            <h3 className="text-base font-bold text-white">
              {currentItem?.name}
            </h3>
            <p className="text-xs text-slate-400">
              Visual Proof — Photo {lightboxData.photoIdx + 1} of {photos.length}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>close</span>
          </button>
        </div>

        {/* Lightbox Body */}
        <div className="flex-1 flex gap-6 pt-6 overflow-hidden min-h-0">
          {/* Left Column: Vertical Thumbnails List */}
          <div className="w-28 shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
            {photos.map((photo, pIdx) => {
              const isActive = pIdx === lightboxData.photoIdx;
              return (
                <div
                  key={pIdx}
                  onClick={() => onSelectPhoto(pIdx)}
                  className={`relative w-24 h-24 rounded-2xl border-2 overflow-hidden bg-slate-900 cursor-pointer transition-all shrink-0 group ${
                    isActive ? "border-purple-500 ring-2 ring-purple-500/50 scale-102" : "border-slate-800 hover:border-slate-600"
                  }`}
                >
                  <img src={photo} alt={`Thumbnail ${pIdx + 1}`} className="w-full h-full object-cover" />
                </div>
              );
            })}
          </div>

          {/* Main Center Area: Large Photo Display */}
          <div className="flex-1 bg-slate-900/80 rounded-3xl border border-slate-800/80 flex items-center justify-center p-4 relative overflow-hidden">
            {activePhoto ? (
              <img
                src={activePhoto}
                alt="Fullscreen proof preview"
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              />
            ) : (
              <div className="text-slate-500 italic text-sm">No photo available</div>
            )}
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};
