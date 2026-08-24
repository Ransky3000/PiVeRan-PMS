import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wrench, X, Trash2, Save, Plus } from "lucide-react";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import { LaborItem, categoryDisplayNames } from "./bundleHelpers";

interface CreateEditLaborModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLaborDetail: LaborItem | null;
  categoriesList: string[];
  onSaveNewLabor: (data: { name: string; price: string; category: string; description: string }) => void;
  onUpdateLabor: (data: { id: string; name: string; price: string; category: string; description: string }) => void;
  onDeleteLabor: (id: string, name: string) => void;
}

export const CreateEditLaborModal: React.FC<CreateEditLaborModalProps> = ({
  isOpen,
  onClose,
  selectedLaborDetail,
  categoriesList,
  onSaveNewLabor,
  onUpdateLabor,
  onDeleteLabor
}) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("PMS");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedLaborDetail) {
      setName(selectedLaborDetail.name);
      setPrice(selectedLaborDetail.price.replace(/[^\d.]/g, ""));
      setCategory(selectedLaborDetail.category);
      setDescription(selectedLaborDetail.description);
    } else {
      setName("");
      setPrice("");
      setCategory("PMS");
      setDescription("");
    }
  }, [selectedLaborDetail, isOpen]);

  const isFormDirty =
    selectedLaborDetail &&
    (name !== selectedLaborDetail.name ||
      price !== selectedLaborDetail.price.replace(/[^\d.]/g, "") ||
      category !== selectedLaborDetail.category ||
      description !== selectedLaborDetail.description);

  const categoryOptions: SelectOption[] = categoriesList.map((cat) => ({
    value: cat,
    label: categoryDisplayNames[cat] || cat
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (selectedLaborDetail) {
        onUpdateLabor({
          id: selectedLaborDetail.id,
          name,
          price,
          category,
          description
        });
      } else {
        onSaveNewLabor({
          name,
          price,
          category,
          description
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
            <Wrench className="w-5 h-5 text-emerald-700" />
            <span>{selectedLaborDetail ? "Labor Service Details" : "Add New Labor Service"}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {selectedLaborDetail && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono uppercase">ID: {selectedLaborDetail.id}</span>
              {isFormDirty && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">
                  Unsaved Changes
                </span>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Labor Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Change Oil"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600 focus:bg-white transition-all font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₱)</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="650"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-emerald-800 font-extrabold outline-none focus:border-emerald-600 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <CustomSelect
                value={category}
                onChange={setCategory}
                options={categoryOptions}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of labor work..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-700 outline-none focus:border-emerald-600 focus:bg-white transition-all"
            />
          </div>



          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            {selectedLaborDetail ? (
              <>
                <button
                  type="button"
                  onClick={() => onDeleteLabor(selectedLaborDetail.id, selectedLaborDetail.name)}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Labor</span>
                </button>

                <div className="flex items-center gap-2">
                  {isFormDirty && (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-end gap-2 w-full">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? "Saving..." : "Save Labor"}</span>
                </button>
              </div>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};
