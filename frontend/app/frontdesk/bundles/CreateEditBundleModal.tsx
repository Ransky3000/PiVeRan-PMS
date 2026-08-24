import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Trash2 } from "lucide-react";
import { PackageBundle, LaborItem, calculateStandaloneSum } from "./bundleHelpers";

interface CreateEditBundleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackageDetail: PackageBundle | null;
  pkgTitle: string;
  setPkgTitle: (val: string) => void;
  pkgDescription: string;
  setPkgDescription: (val: string) => void;
  pkgInterval: string;
  setPkgInterval: (val: string) => void;
  pkgFlatPrice: string;
  setPkgFlatPrice: (val: string) => void;
  selectedLaborIdsForPkg: string[];
  selectableItemsForPackagePicker: LaborItem[];
  onOpenSubModal: () => void;
  onToggleLaborSelection: (id: string) => void;
  onSavePackage: (e: React.FormEvent) => void;
  onDeletePackage: (id: string, name: string) => void;
}

export const CreateEditBundleModal: React.FC<CreateEditBundleModalProps> = ({
  isOpen,
  onClose,
  selectedPackageDetail,
  pkgTitle,
  setPkgTitle,
  pkgDescription,
  setPkgDescription,
  pkgInterval,
  setPkgInterval,
  pkgFlatPrice,
  setPkgFlatPrice,
  selectedLaborIdsForPkg,
  selectableItemsForPackagePicker,
  onOpenSubModal,
  onToggleLaborSelection,
  onSavePackage,
  onDeletePackage
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const standaloneSum = calculateStandaloneSum(selectedLaborIdsForPkg, selectableItemsForPackagePicker);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !pkgTitle.trim()) return;
    setIsSubmitting(true);
    try {
      onSavePackage(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 border border-slate-100 text-slate-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-950">
            {selectedPackageDetail ? "Package details" : "Create new bundle"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">Title (required)</label>
            <input
              type="text"
              required
              value={pkgTitle}
              onChange={(e) => setPkgTitle(e.target.value)}
              placeholder="Add title"
              className="w-full bg-white border border-slate-300 focus:border-slate-900 rounded-xl p-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 font-bold"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-600">Description</label>
            <textarea
              rows={3}
              value={pkgDescription}
              onChange={(e) => setPkgDescription(e.target.value)}
              placeholder="Add description"
              className="w-full bg-white border border-slate-300 focus:border-slate-900 rounded-xl p-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 font-normal"
            />
          </div>

          {/* Target Interval & Flat Package Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Service Interval</label>
              <input
                type="text"
                value={pkgInterval}
                onChange={(e) => setPkgInterval(e.target.value)}
                placeholder="e.g. Every 10,000 KM"
                className="w-full bg-white border border-slate-300 focus:border-slate-900 rounded-xl p-2.5 text-xs text-slate-900 outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Package Rate (₱)</label>
              <input
                type="number"
                value={pkgFlatPrice}
                onChange={(e) => setPkgFlatPrice(e.target.value)}
                placeholder={`Default: ₱${standaloneSum}`}
                className="w-full bg-white border border-slate-300 focus:border-slate-900 rounded-xl p-2.5 text-xs font-extrabold text-emerald-800 outline-none"
              />
            </div>
          </div>

          {/* Labors Pill Button */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-slate-600">
              Labors & Base Packages ({selectedLaborIdsForPkg.length} selected — Standalone: ₱{standaloneSum.toLocaleString()}.00)
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenSubModal}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-full transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add labors & packages</span>
              </button>

              {selectedLaborIdsForPkg.map((id) => {
                const item = selectableItemsForPackagePicker.find((l) => l.id === id);
                if (!item) return null;
                return (
                  <span
                    key={id}
                    className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 max-w-[220px] truncate ${
                      item.isPackageItem
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    <span className="truncate">{item.name}</span>
                    <button
                      type="button"
                      onClick={() => onToggleLaborSelection(id)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded-full cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {selectedPackageDetail ? (
              <button
                type="button"
                onClick={() => onDeletePackage(selectedPackageDetail.id, selectedPackageDetail.packageName)}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-full border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!pkgTitle.trim() || isSubmitting}
                className={`px-6 py-2.5 font-bold text-xs rounded-full transition-all shadow-xs ${
                  pkgTitle.trim() && !isSubmitting
                    ? "bg-slate-950 hover:bg-slate-800 text-white cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? "Saving..." : selectedPackageDetail ? "Save changes" : "Create"}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
