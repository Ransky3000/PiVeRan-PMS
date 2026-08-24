import React from "react";
import { motion } from "framer-motion";
import { X, Search, Filter, GripVertical, CheckSquare, Square } from "lucide-react";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import { Reorder } from "framer-motion";
import { LaborItem, calculateStandaloneSum } from "./bundleHelpers";

interface ReorderMaterialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectableItems: LaborItem[];
  selectedLaborIds: string[];
  onToggleLaborSelection: (id: string) => void;
  onReorder: (newIds: string[]) => void;
  subModalCategoryOptions: SelectOption[];
  pkgSearchLaborQuery: string;
  setPkgSearchLaborQuery: (val: string) => void;
  pkgSubModalCategoryFilter: string;
  setPkgSubModalCategoryFilter: (val: string) => void;
}

export const ReorderMaterialsModal: React.FC<ReorderMaterialsModalProps> = ({
  isOpen,
  onClose,
  selectableItems,
  selectedLaborIds,
  onToggleLaborSelection,
  onReorder,
  subModalCategoryOptions,
  pkgSearchLaborQuery,
  setPkgSearchLaborQuery,
  pkgSubModalCategoryFilter,
  setPkgSubModalCategoryFilter
}) => {
  if (!isOpen) return null;

  const standaloneSum = calculateStandaloneSum(selectedLaborIds, selectableItems);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 border border-slate-100 text-slate-900 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-950">Add labors & base packages</h2>
            <p className="text-[11px] text-slate-400 font-medium">Drag items in the right pane to smoothly reorder sequence</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Pane Body Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">
          {/* Left Pane: Search + Category Filter Dropdown + Item List (7 Cols) */}
          <div className="md:col-span-7 flex flex-col min-h-0 border-r border-slate-100 pr-3">
            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={pkgSearchLaborQuery}
                  onChange={(e) => setPkgSearchLaborQuery(e.target.value)}
                  placeholder="Search labors or existing packages..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-slate-900 font-normal"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <CustomSelect
                  value={pkgSubModalCategoryFilter}
                  onChange={setPkgSubModalCategoryFilter}
                  options={subModalCategoryOptions}
                  className="w-full"
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {selectableItems
                .filter((l) => {
                  const matchesQuery =
                    l.name.toLowerCase().includes(pkgSearchLaborQuery.toLowerCase()) ||
                    l.category.toLowerCase().includes(pkgSearchLaborQuery.toLowerCase());
                  const matchesCat = pkgSubModalCategoryFilter === "ALL" || l.category === pkgSubModalCategoryFilter;
                  return matchesQuery && matchesCat;
                })
                .map((item) => {
                  const isChecked = selectedLaborIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => onToggleLaborSelection(item.id)}
                      className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked
                          ? item.isPackageItem
                            ? "bg-emerald-50 border border-emerald-300"
                            : "bg-slate-100/90"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        {isChecked ? (
                          <CheckSquare className={`w-4 h-4 shrink-0 ${item.isPackageItem ? "text-emerald-700" : "text-slate-900"}`} />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <div className="truncate">
                          <div className={`font-bold text-xs truncate ${item.isPackageItem ? "text-emerald-950" : "text-slate-900"}`}>
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium truncate">{item.category}</div>
                        </div>
                      </div>

                      <span className="font-extrabold text-xs text-emerald-800 shrink-0">{item.price}</span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Right Pane: Framer Motion Reorder Column (5 Cols) */}
          <div className="md:col-span-5 flex flex-col min-h-0 pl-1 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Items to add ({selectedLaborIds.length})</span>
              <span className="text-xs font-extrabold text-emerald-800">₱{standaloneSum.toLocaleString()}.00</span>
            </div>

            {selectedLaborIds.length === 0 ? (
              <div className="flex-1 overflow-y-auto p-4 text-center text-xs text-slate-400 bg-slate-50/60 rounded-2xl border border-slate-200/60">
                No items selected yet. Select labors or packages from the left.
              </div>
            ) : (
              <Reorder.Group
                axis="y"
                values={selectedLaborIds}
                onReorder={onReorder}
                layoutScroll
                className="flex-1 overflow-y-auto space-y-1.5 pr-1 bg-slate-50/60 p-2.5 rounded-2xl border border-slate-200/60"
              >
                {selectedLaborIds.map((id) => {
                  const item = selectableItems.find((l) => l.id === id);
                  if (!item) return null;
                  return (
                    <Reorder.Item
                      key={id}
                      value={id}
                      whileDrag={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 50 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className={`p-2.5 rounded-xl border shadow-2xs flex items-center justify-between text-xs cursor-grab active:cursor-grabbing select-none ${
                        item.isPackageItem
                          ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold"
                          : "bg-white border-slate-200/80 text-slate-900 font-semibold"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <span title="Drag to reorder" className="cursor-grab">
                          <GripVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </span>
                        <span className="truncate">{item.name}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLaborSelection(id);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                          title="Remove item"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-full transition-all shadow-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
