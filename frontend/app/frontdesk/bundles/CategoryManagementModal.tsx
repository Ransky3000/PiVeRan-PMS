import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Tag, Plus } from "lucide-react";
import { categoryDisplayNames } from "./bundleHelpers";

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoriesList: string[];
  onAddCategory: (newCategory: string) => void;
}

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  onClose,
  categoriesList,
  onAddCategory
}) => {
  const [newCatInput, setNewCatInput] = useState("");

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatInput.trim()) return;
    onAddCategory(newCatInput.trim().toUpperCase());
    setNewCatInput("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Tag className="w-5 h-5 text-emerald-700" />
            <span>Manage Labor Categories</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newCatInput}
            onChange={(e) => setNewCatInput(e.target.value)}
            placeholder="New category name..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600 font-semibold uppercase"
          />
          <button
            type="submit"
            disabled={!newCatInput.trim()}
            className={`px-4 py-2.5 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 ${
              newCatInput.trim()
                ? "bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>

        <div className="space-y-2 pt-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Active Categories ({categoriesList.length}):
          </label>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
            {categoriesList.map((cat) => (
              <span
                key={cat}
                className="bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200"
              >
                {categoryDisplayNames[cat] || cat}
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
