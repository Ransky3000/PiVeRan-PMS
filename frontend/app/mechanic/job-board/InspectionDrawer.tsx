import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  ClipboardCheck,
  ChevronRight,
  ChevronLeft,
  Check,
  Camera,
  Maximize2,
  Plus,
  ArrowRight
} from "lucide-react";
import { SelectOption } from "@/components/CustomSelect";
import { JobOrder, InspectionItem } from "@/app/types";
import {
  getServiceDescription,
  INSPECTION_STATUS_ICON,
  getInspectionProgress,
  getItemNote,
  getItemPhotos
} from "./mechanicHelpers";

interface InspectionDrawerProps {
  drawerJobOrder: JobOrder | null;
  onClose: () => void;
  updateInspectionItemStatus: (idx: number, status: InspectionItem["status"]) => void;
  updateInspectionItemNote: (idx: number, note: string) => void;
  handleAddPhotoToItem: (idx: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemovePhotoFromItem: (idx: number, photoIdx: number) => void;
  updateMaterialQty: (itemIdx: number, matName: string, newQty: number) => void;
  removeMaterialItem: (itemIdx: number, matName: string) => void;
  confirmAddMaterial: (itemIdx: number) => void;
  materialsList: SelectOption[];
  laborMaterialsMap: Record<string, string[]>;
  activeAddMaterialItemIdx: number | null;
  setActiveAddMaterialItemIdx: (idx: number | null) => void;
  addMaterialStep: "SELECT_PART" | "SET_QUANTITY";
  setAddMaterialStep: (step: "SELECT_PART" | "SET_QUANTITY") => void;
  selectedPartName: string | null;
  setSelectedPartName: (name: string | null) => void;
  addMaterialQtyInput: number;
  setAddMaterialQtyInput: React.Dispatch<React.SetStateAction<number>>;
  materialSearchQuery: string;
  setMaterialSearchQuery: (query: string) => void;
  setLightboxData: (data: { itemIdx: number; photoIdx: number } | null) => void;
  onStartInspection: () => void;
}

export const InspectionDrawer: React.FC<InspectionDrawerProps> = ({
  drawerJobOrder,
  onClose,
  updateInspectionItemStatus,
  updateInspectionItemNote,
  handleAddPhotoToItem,
  handleRemovePhotoFromItem,
  updateMaterialQty,
  removeMaterialItem,
  confirmAddMaterial,
  materialsList,
  laborMaterialsMap,
  activeAddMaterialItemIdx,
  setActiveAddMaterialItemIdx,
  addMaterialStep,
  setAddMaterialStep,
  selectedPartName,
  setSelectedPartName,
  addMaterialQtyInput,
  setAddMaterialQtyInput,
  materialSearchQuery,
  setMaterialSearchQuery,
  setLightboxData,
  onStartInspection
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!drawerJobOrder) return null;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-950/40"
      />

      {/* Drawer Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[480px] bg-white border-l border-slate-200 shadow-2xl flex flex-col"
      >
        {/* FIXED DRAWER HEADER */}
        <div className="shrink-0 px-5 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <h2 className="text-base font-bold text-slate-900 truncate">{drawerJobOrder.vehicleModel}</h2>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE DRAWER BODY */}
        <div className="flex-1 overflow-y-auto">
          {/* SECTION 1: Summary Stats */}
          <div className="px-5 py-4 border-b border-slate-100 space-y-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] tracking-wide uppercase mb-1">
              <FileText className="w-3.5 h-3.5" /> Vehicle Info
            </div>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
              <div><span className="text-slate-500">Owner</span><div className="font-medium text-slate-900">{drawerJobOrder.ownerName}</div></div>
              <div><span className="text-slate-500">Contact Number</span><div className="font-medium text-slate-900">{drawerJobOrder.ownerPhone}</div></div>
              <div><span className="text-slate-500">Plate Number</span><div className="font-medium text-slate-900">{drawerJobOrder.plateNumber}</div></div>
              <div><span className="text-slate-500">Odometer Reading</span><div className="font-medium text-slate-900">{drawerJobOrder.odometer}</div></div>
              <div><span className="text-slate-500">Service Category</span><div className="font-medium text-slate-900">{drawerJobOrder.serviceType}</div></div>
            </div>

            <div className="pt-2 border-t border-slate-100/80">
              <span className="text-slate-500 font-medium text-xs block">Service Description</span>
              <div className="font-semibold text-slate-800 text-xs mt-0.5">
                {getServiceDescription(drawerJobOrder.serviceType, drawerJobOrder.serviceDescription)}
              </div>
            </div>
          </div>

          {/* SECTION 2: DVI Checklist */}
          {drawerJobOrder.inspectionItems && drawerJobOrder.inspectionItems.length > 0 && (
            <div className="px-5 py-4 border-b border-slate-100 space-y-3 text-xs">
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] tracking-wide uppercase">
                    <ClipboardCheck className="w-3.5 h-3.5" /> Inspection checklist
                  </div>
                  <span className="font-bold text-purple-600 text-xs">
                    {getInspectionProgress(drawerJobOrder).completed}/{getInspectionProgress(drawerJobOrder).total} Completed
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (getInspectionProgress(drawerJobOrder).completed /
                          (getInspectionProgress(drawerJobOrder).total || 1)) *
                        100
                      }%`
                    }}
                  />
                </div>
              </div>

              {drawerJobOrder.status !== "Job completed" ? (
                /* INTERACTIVE CHECKLIST FOR MECHANICS */
                <div className="space-y-2.5">
                  {drawerJobOrder.inspectionItems.map((item: InspectionItem, idx: number) => {
                    const isExpanded = expandedIndex === idx;
                    return (
                      <div key={idx} className={`bg-slate-50 border rounded-2xl transition-all overflow-hidden relative ${isExpanded ? "border-slate-300 shadow-xs z-10" : "border-slate-200 z-0"}`}>
                        <div
                          onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                          className={`px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition-colors select-none ${
                            isExpanded
                              ? "bg-slate-100"
                              : "hover:bg-slate-100/70"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="shrink-0">{INSPECTION_STATUS_ICON[item.status || "PENDING"]}</div>
                            <span className="font-bold text-slate-800 text-xs truncate">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          </div>
                        </div>

                        <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                          <div className="px-4 pb-4 pt-3 bg-white space-y-3.5 rounded-b-2xl">
                            {/* Status Buttons */}
                            <div>
                              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status</div>
                              <div className="flex flex-wrap gap-1.5">
                                {(["GOOD", "ISSUE", "MONITOR", "PENDING"] as const).map((st) => {
                                  const isSel = item.status === st;
                                  const label = st === "GOOD" ? "Good" : st === "ISSUE" ? "Issue" : st === "MONITOR" ? "Monitor" : "Pending";
                                  const activeStyles =
                                    st === "GOOD" ? "bg-emerald-700 text-white shadow-2xs border-emerald-700 font-semibold" :
                                    st === "ISSUE" ? "bg-red-600 text-white shadow-2xs border-red-600 font-semibold" :
                                    st === "MONITOR" ? "bg-amber-500 text-white shadow-2xs border-amber-500 font-semibold" :
                                    "bg-slate-700 text-white shadow-2xs border-slate-700 font-semibold";
                                  const inactiveStyles = "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 font-normal";

                                  return (
                                    <button
                                      key={st}
                                      type="button"
                                      onClick={() => updateInspectionItemStatus(idx, st)}
                                      className={`px-3 py-1 text-[10px] rounded-lg border transition-all cursor-pointer ${
                                        isSel ? activeStyles : inactiveStyles
                                      }`}
                                    >
                                      {label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Materials Section */}
                            {(item.status === "ISSUE" || (item.status === "GOOD" && (item.requiredMaterials || []).length > 0)) && (
                              <div className="space-y-2 pt-1">
                                {(item.requiredMaterials || []).length > 0 && activeAddMaterialItemIdx !== idx && (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 pb-0.5">
                                      <span>{item.status === "GOOD" ? "Materials Applied" : "Materials"}</span>
                                      {item.status !== "GOOD" && <span className="pr-4">Quantity</span>}
                                    </div>

                                    <div className="space-y-1">
                                      {(item.requiredMaterials || []).map((m: any) => {
                                        const name = typeof m === "object" ? m.name : m;
                                        const qty = typeof m === "object" ? m.qty : 1;

                                        if (item.status === "GOOD") {
                                          return (
                                            <div key={name} className="flex items-center gap-2.5 py-1 px-1 text-xs">
                                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                              <span className="font-normal text-slate-700 truncate">{name}</span>
                                            </div>
                                          );
                                        }

                                        return (
                                          <div key={name} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-red-50/80 bg-white border border-slate-100 transition-all text-xs group">
                                            <div className="flex items-center gap-2 min-w-0">
                                              <span className="font-normal text-slate-700 truncate pr-2">{name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                              <span className="font-normal text-slate-700 text-xs min-w-[20px] text-right group-hover:hidden pr-1">
                                                {qty}
                                              </span>
                                              <input
                                                type="number"
                                                min="1"
                                                value={qty}
                                                onChange={(e) => {
                                                  const val = Math.max(1, parseInt(e.target.value) || 1);
                                                  updateMaterialQty(idx, name, val);
                                                }}
                                                className="hidden group-hover:block w-12 bg-white border border-red-300 rounded-md py-0.5 px-1 text-center text-xs font-semibold text-slate-900 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-500/20 shadow-2xs"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => removeMaterialItem(idx, name)}
                                                className="text-slate-400 hover:text-red-600 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                              >
                                                <X className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {(item.requiredMaterials || []).length === 0 && activeAddMaterialItemIdx !== idx && (
                                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                    Materials
                                  </div>
                                )}

                                {activeAddMaterialItemIdx === idx ? (
                                  <div className="space-y-2.5">
                                    <div className="flex items-center justify-between pb-0.5">
                                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Select Material</span>
                                      <button
                                        type="button"
                                        onClick={() => setActiveAddMaterialItemIdx(null)}
                                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {/* Search Input */}
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={materialSearchQuery}
                                        onChange={(e) => setMaterialSearchQuery(e.target.value)}
                                        placeholder="Search"
                                        className="w-full bg-white border border-slate-200 rounded-xl pl-3 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-red-500 shadow-2xs"
                                      />
                                    </div>

                                    {addMaterialStep === "SELECT_PART" ? (
                                      <div className="space-y-2.5">
                                        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                                          {(() => {
                                            const recommended = laborMaterialsMap[item.name] || [];
                                            const filteredList = materialsList.filter((opt) =>
                                              opt.label.toLowerCase().includes(materialSearchQuery.toLowerCase())
                                            );
                                            const recommendedOptions = filteredList.filter((opt) =>
                                              recommended.includes(opt.value)
                                            );
                                            const otherOptions = filteredList.filter((opt) =>
                                              !recommended.includes(opt.value)
                                            );

                                            return (
                                              <>
                                                {recommendedOptions.length > 0 && (
                                                  <div className="space-y-1">
                                                    <div className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md uppercase tracking-wider border border-emerald-200/50">
                                                      Recommended for {item.name}
                                                    </div>
                                                    {recommendedOptions.map((opt) => {
                                                      const match = opt.label.match(/^(.*)\s+\((₱[\d,.]+)\)$/);
                                                      return (
                                                        <label
                                                          key={opt.value}
                                                          onClick={() => {
                                                            setSelectedPartName(opt.value);
                                                            setAddMaterialStep("SET_QUANTITY");
                                                          }}
                                                          className="flex items-center justify-between gap-2.5 py-2 px-3 hover:bg-emerald-50 bg-white rounded-xl cursor-pointer transition-colors border border-emerald-100/50 group/item"
                                                        >
                                                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                                              selectedPartName === opt.value
                                                                ? "border-emerald-600 bg-emerald-600"
                                                                : "border-slate-300 bg-white group-hover/item:border-emerald-400"
                                                            }`}>
                                                              {selectedPartName === opt.value ? (
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                              ) : (
                                                                <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover/item:bg-emerald-200/50" />
                                                              )}
                                                            </div>
                                                            <span className="text-xs font-semibold text-slate-800 group-hover/item:text-emerald-950 truncate">
                                                              {match ? match[1] : opt.label}
                                                            </span>
                                                          </div>
                                                          {match && (
                                                            <span className="text-xs font-bold text-slate-600 group-hover/item:text-emerald-900 shrink-0 ml-auto">
                                                              {match[2]}
                                                            </span>
                                                          )}
                                                        </label>
                                                      );
                                                    })}
                                                  </div>
                                                )}

                                                {otherOptions.length > 0 && (
                                                  <div className="space-y-1 pt-1.5">
                                                    {recommendedOptions.length > 0 && (
                                                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-0.5">
                                                        Other Materials
                                                      </div>
                                                    )}
                                                    {otherOptions.map((opt) => {
                                                      const match = opt.label.match(/^(.*)\s+\((₱[\d,.]+)\)$/);
                                                      return (
                                                        <label
                                                          key={opt.value}
                                                          onClick={() => {
                                                            setSelectedPartName(opt.value);
                                                            setAddMaterialStep("SET_QUANTITY");
                                                          }}
                                                          className="flex items-center justify-between gap-2.5 py-2 px-3 hover:bg-red-50/80 bg-white rounded-xl cursor-pointer transition-colors border border-slate-100/80 hover:border-red-200 group/item"
                                                        >
                                                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                                              selectedPartName === opt.value
                                                                ? "border-red-600 bg-red-600"
                                                                : "border-slate-300 bg-white group-hover/item:border-red-400"
                                                            }`}>
                                                              {selectedPartName === opt.value ? (
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                                              ) : (
                                                                <div className="w-1.5 h-1.5 rounded-full bg-transparent group-hover/item:bg-red-200/50" />
                                                              )}
                                                            </div>
                                                            <span className="text-xs font-semibold text-slate-800 group-hover/item:text-red-950 truncate">
                                                              {match ? match[1] : opt.label}
                                                            </span>
                                                          </div>
                                                          {match && (
                                                            <span className="text-xs font-bold text-slate-600 group-hover/item:text-red-900 shrink-0 ml-auto">
                                                              {match[2]}
                                                            </span>
                                                          )}
                                                        </label>
                                                      );
                                                    })}
                                                  </div>
                                                )}
                                              </>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                          <button
                                            type="button"
                                            onClick={() => setAddMaterialStep("SELECT_PART")}
                                            className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                                          >
                                            <ChevronLeft className="w-3.5 h-3.5" /> Back
                                          </button>
                                          <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]">{selectedPartName}</span>
                                          <button
                                            type="button"
                                            onClick={() => setActiveAddMaterialItemIdx(null)}
                                            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 cursor-pointer"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>

                                        <div className="space-y-1.5 text-center py-1">
                                          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                                            Quantity
                                          </label>
                                          <div className="flex items-center justify-center gap-3">
                                            <button
                                              type="button"
                                              onClick={() => setAddMaterialQtyInput(Math.max(1, addMaterialQtyInput - 1))}
                                              className="w-9 h-9 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-base hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                                            >
                                              -
                                            </button>
                                            <input
                                              type="number"
                                              min="1"
                                              value={addMaterialQtyInput}
                                              onChange={(e) => setAddMaterialQtyInput(Math.max(1, parseInt(e.target.value) || 1))}
                                              className="w-24 bg-white border border-slate-300 rounded-xl py-2 px-3 text-center text-sm font-bold text-slate-900 outline-none focus:border-red-500 shadow-2xs"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => setAddMaterialQtyInput(addMaterialQtyInput + 1)}
                                              className="w-9 h-9 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold text-base hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                                            >
                                              +
                                            </button>
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => confirmAddMaterial(idx)}
                                          className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                                        >
                                          Add Material
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ) : item.status !== "GOOD" ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveAddMaterialItemIdx(idx);
                                      setAddMaterialStep("SELECT_PART");
                                      setSelectedPartName(null);
                                      setAddMaterialQtyInput(1);
                                      setMaterialSearchQuery("");
                                    }}
                                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 border-dashed border-slate-300 text-slate-600 font-semibold rounded-xl text-xs text-center flex items-center justify-center gap-1 cursor-pointer transition-colors"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>add</span>
                                  </button>
                                ) : null}
                              </div>
                            )}

                            {/* Visual Proof & Notes Section */}
                            {item.status !== "PENDING" && (
                              <>
                                {(() => {
                                  const dropStyle =
                                    item.status === "ISSUE"
                                      ? { bg: "hover:bg-red-50/80", border: "hover:border-red-500/80", iconBg: "group-hover:bg-red-100", iconText: "group-hover:text-red-700", text: "group-hover:text-red-700", imgHoverBorder: "hover:border-red-500 hover:ring-2 hover:ring-red-200/80" }
                                      : item.status === "GOOD"
                                      ? { bg: "hover:bg-emerald-50/80", border: "hover:border-emerald-500/80", iconBg: "group-hover:bg-emerald-100", iconText: "group-hover:text-emerald-700", text: "group-hover:text-emerald-700", imgHoverBorder: "hover:border-emerald-500 hover:ring-2 hover:ring-emerald-200/80" }
                                      : { bg: "hover:bg-amber-50/80", border: "hover:border-amber-500/80", iconBg: "group-hover:bg-amber-100", iconText: "group-hover:text-amber-700", text: "group-hover:text-amber-700", imgHoverBorder: "hover:border-amber-500 hover:ring-2 hover:ring-amber-200/80" };

                                  const itemPhotos = getItemPhotos(item);

                                  return (
                                    <div>
                                      <div className="flex items-center justify-between mb-1.5">
                                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                          Visual Proof {itemPhotos.length > 0 && `(${itemPhotos.length})`}
                                        </div>
                                        {itemPhotos.length > 0 && (
                                          <button
                                            type="button"
                                            onClick={() => setLightboxData({ itemIdx: idx, photoIdx: 0 })}
                                            className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                                            title="Expand full screen"
                                          >
                                            <Maximize2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>

                                      {itemPhotos.length === 0 ? (
                                        <label className={`bg-slate-50/80 ${dropStyle.bg} border-2 border-dashed border-slate-300 ${dropStyle.border} rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 min-h-[90px] shadow-2xs group`}>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={(e) => handleAddPhotoToItem(idx, e)}
                                            className="hidden"
                                          />
                                          <div className={`w-9 h-9 rounded-full bg-slate-200/70 ${dropStyle.iconBg} group-hover:scale-110 flex items-center justify-center text-slate-600 ${dropStyle.iconText} transition-all duration-200 mb-1`}>
                                            <Camera className="w-4.5 h-4.5" />
                                          </div>
                                          <span className={`text-[11px] text-slate-400 ${dropStyle.text} font-normal transition-colors`}>
                                            Click to open camera or browse image
                                          </span>
                                        </label>
                                      ) : (
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                            {itemPhotos.map((photo: string, pIdx: number) => (
                                              <div
                                                key={pIdx}
                                                className={`relative w-24 h-24 rounded-2xl border-2 border-slate-200 ${dropStyle.imgHoverBorder} overflow-hidden bg-slate-100 shadow-2xs shrink-0 group/img cursor-pointer transition-all duration-200`}
                                                onClick={() => setLightboxData({ itemIdx: idx, photoIdx: pIdx })}
                                              >
                                                <img src={photo} alt={`Proof ${pIdx + 1}`} className="w-full h-full object-cover" />
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemovePhotoFromItem(idx, pIdx);
                                                  }}
                                                  className="absolute top-1.5 right-1.5 p-1 bg-slate-900/75 hover:bg-red-600 text-white rounded-full transition-all cursor-pointer shadow-md z-10"
                                                >
                                                  <X className="w-3 h-3" />
                                                </button>
                                              </div>
                                            ))}
                                          </div>

                                          <label className={`bg-slate-50/80 ${dropStyle.bg} border-2 border-dashed border-slate-300 ${dropStyle.border} rounded-xl py-2 px-3 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 text-xs font-medium group`}>
                                            <input
                                              type="file"
                                              accept="image/*"
                                              capture="environment"
                                              onChange={(e) => handleAddPhotoToItem(idx, e)}
                                              className="hidden"
                                            />
                                            <Camera className={`w-4 h-4 text-slate-500 ${dropStyle.iconText} transition-colors`} />
                                            <span className={`text-[11px] text-slate-500 ${dropStyle.text} transition-colors`}>Add another photo</span>
                                          </label>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}

                                <div>
                                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Diagnostic Notes</div>
                                  <input
                                    type="text"
                                    value={getItemNote(item)}
                                    onChange={(e) => updateInspectionItemNote(idx, e.target.value)}
                                    placeholder="Add diagnostic comments or wear levels..."
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-normal text-slate-800 outline-none focus:border-emerald-600 transition-all"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                          </motion.div>
                        )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* READ-ONLY CHECKLIST */
                <div className="space-y-2.5">
                  {drawerJobOrder.inspectionItems.map((item: InspectionItem, idx: number) => {
                    const effectiveStatus = item.status || "PENDING";
                    const isExpanded = expandedIndex === idx;
                    const photos = getItemPhotos(item, effectiveStatus);
                    const currentNote = getItemNote(item, effectiveStatus);

                    const statusLabel =
                      effectiveStatus === "GOOD" ? "Good" :
                      effectiveStatus === "ISSUE" ? "Issue" :
                      effectiveStatus === "MONITOR" ? "Monitor" : "Pending";

                    const statusColorClass =
                      effectiveStatus === "GOOD" ? "text-emerald-600" :
                      effectiveStatus === "ISSUE" ? "text-red-600" :
                      effectiveStatus === "MONITOR" ? "text-amber-600" : "text-slate-500";

                    return (
                      <div
                        key={idx}
                        className={`border rounded-2xl transition-all overflow-hidden bg-white ${
                          isExpanded ? "border-slate-300 shadow-xs" : "border-slate-200"
                        }`}
                      >
                        <div
                          onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                          className={`px-4 py-3 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                            isExpanded ? "bg-slate-100" : "bg-slate-50/70 hover:bg-slate-100/80"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="shrink-0">{INSPECTION_STATUS_ICON[effectiveStatus || "PENDING"]}</div>
                            <span className="font-bold text-slate-800 text-xs truncate">{item.name}</span>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        </div>

                        <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                          <div className="px-4 pb-4 pt-3 bg-white space-y-4 text-xs rounded-b-2xl">
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">STATUS</div>
                              <div className={`text-sm font-bold ${statusColorClass}`}>{statusLabel}</div>
                            </div>

                            {effectiveStatus !== "PENDING" && (
                              <>
                                <div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">DIAGNOSTIC NOTES</div>
                                  <div className="text-xs text-slate-800 font-medium leading-relaxed">
                                    {currentNote || <span className="text-slate-400 italic font-normal">No diagnostic notes recorded.</span>}
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">VISUAL PROOF</span>
                                    {photos.length > 0 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setLightboxData({ itemIdx: idx, photoIdx: 0 });
                                        }}
                                        className="text-slate-500 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                      >
                                        <Maximize2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>

                                  {photos.length > 0 ? (
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                      {photos.map((photoUrl: string, pIdx: number) => (
                                        <div
                                          key={pIdx}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setLightboxData({ itemIdx: idx, photoIdx: pIdx });
                                          }}
                                          className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 cursor-pointer group hover:border-purple-500 transition-all shadow-2xs"
                                        >
                                          <img src={photoUrl} alt={`Proof ${pIdx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-[11px] text-slate-400 italic py-1">No visual proof attached.</div>
                                  )}
                                </div>
                              </>
                            )}

                            {item.requiredMaterials && item.requiredMaterials.length > 0 && (effectiveStatus === "ISSUE" || effectiveStatus === "GOOD") && (
                              <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">
                                  {effectiveStatus === "ISSUE" ? "MATERIALS NEEDED" : "MATERIALS APPLIED"}
                                </div>
                                <div className="space-y-1">
                                  {item.requiredMaterials.map((m: any, mIdx: number) => {
                                    const name = typeof m === "object" ? m.name : m;
                                    const qty = typeof m === "object" ? m.qty : 1;
                                    return (
                                      <div key={mIdx} className="flex items-center justify-between py-1 px-0.5 text-xs font-normal text-slate-700">
                                        <span>{name}</span>
                                        <span className="font-normal text-slate-700 text-xs">{qty}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                          </motion.div>
                        )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FIXED DRAWER FOOTER */}
        <div className="shrink-0 px-5 py-3.5 border-t border-slate-200 bg-white flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>

          {drawerJobOrder.status === "New" && (
            <button
              onClick={onStartInspection}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>Start Inspection</span>
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
};
