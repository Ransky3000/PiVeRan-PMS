import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Wrench,
  ClipboardCheck,
  ChevronRight,
  Maximize2,
  Check,
  Bell
} from "lucide-react";
import { apiService } from "@/app/apiService";
import { JobOrder, InspectionItem, EstimateLineItem } from "@/app/types";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";
import {
  getServiceDescription,
  getEffectiveEstimateItems,
  getEstimateCalculations,
  INSPECTION_STATUS_ICON,
  getItemNote,
  getItemPhotos,
  getInspectionProgress
} from "./jobOrderHelpers";

interface JobOrderDrawerProps {
  drawerJobOrder: JobOrder | null;
  onClose: () => void;
  isEditingDrawer: boolean;
  setIsEditingDrawer: (editing: boolean) => void;
  editOdometer: string;
  setEditOdometer: (val: string) => void;
  editServiceType: string;
  setEditServiceType: (val: string) => void;
  editMechanics: string[];
  setEditMechanics: (val: string[]) => void;
  serviceTypeOptions: SelectOption[];
  mechanicOptions: SelectOption[];
  handleSaveEditDrawer: () => void;
  handleDeleteDrawer: () => void;
  handleStartEditDrawer: () => void;
  updateEstimateLine: (lineId: string, updates: Partial<EstimateLineItem>) => void;
  onBuyAllToggle?: (isAllBuy: boolean) => void;
  updateDrawerJO: (updates: Partial<JobOrder>) => void;
  setLightboxData: (data: { itemIdx: number; photoIdx: number } | null) => void;
  onMarkCompleted: () => void;
}

export const JobOrderDrawer: React.FC<JobOrderDrawerProps> = ({
  drawerJobOrder,
  onClose,
  isEditingDrawer,
  setIsEditingDrawer,
  editOdometer,
  setEditOdometer,
  editServiceType,
  setEditServiceType,
  editMechanics,
  setEditMechanics,
  serviceTypeOptions,
  mechanicOptions,
  handleSaveEditDrawer,
  handleDeleteDrawer,
  handleStartEditDrawer,
  updateEstimateLine,
  onBuyAllToggle,
  updateDrawerJO,
  setLightboxData,
  onMarkCompleted
}) => {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [hasReminder, setHasReminder] = useState(false);
  const [checkingReminder, setCheckingReminder] = useState(false);

  React.useEffect(() => {
    if (!drawerJobOrder || drawerJobOrder.status !== "Job completed") return;
    let isMounted = true;
    setCheckingReminder(true);
    apiService.getReminders().then((reminders) => {
      if (!isMounted) return;
      const exists = (reminders || []).some((r: any) => r.joId === drawerJobOrder.id);
      setHasReminder(exists);
      setCheckingReminder(false);
    }).catch(() => {
      if (!isMounted) return;
      setCheckingReminder(false);
    });
    return () => { isMounted = false; };
  }, [drawerJobOrder?.id, drawerJobOrder?.status]);

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
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[500px] bg-white border-l border-slate-200 shadow-2xl flex flex-col"
      >
        {/* ── DRAWER HEADER ── */}
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

        {/* ── DRAWER BODY (SCROLLABLE) ── */}
        <div className="flex-1 overflow-y-auto">

          {/* SECTION 1: Vehicle Info & Incharge Mechanics */}
          <div className="px-5 py-4 border-b border-slate-100 space-y-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] tracking-wide uppercase mb-1">
              <FileText className="w-3.5 h-3.5" /> Vehicle Info
            </div>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
              <div><span className="text-slate-500">Owner</span><div className="font-medium text-slate-900">{drawerJobOrder.ownerName}</div></div>
              <div><span className="text-slate-500">Phone</span><div className="font-medium text-slate-900">{drawerJobOrder.ownerPhone}</div></div>
              <div><span className="text-slate-500">Plate</span><div className="font-medium text-slate-900">{drawerJobOrder.plateNumber}</div></div>
              <div>
                <span className="text-slate-500">Odometer</span>
                {isEditingDrawer ? (
                  <input
                    type="number"
                    value={editOdometer}
                    onChange={(e) => setEditOdometer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs outline-none focus:border-slate-400 mt-0.5"
                  />
                ) : (
                  <div className="font-medium text-slate-900">{drawerJobOrder.odometer}</div>
                )}
              </div>
              <div>
                <span className="text-slate-500">Service Category</span>
                {isEditingDrawer ? (
                  <CustomSelect
                    value={editServiceType}
                    onChange={setEditServiceType}
                    options={serviceTypeOptions}
                    className="w-full mt-0.5"
                  />
                ) : (
                  <div className="font-medium text-slate-900">{drawerJobOrder.serviceType}</div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100/80">
              <span className="text-slate-500 font-medium text-xs block">Service Description</span>
              <div className="font-semibold text-slate-800 text-xs mt-0.5">
                {getServiceDescription(isEditingDrawer ? editServiceType : drawerJobOrder.serviceType, drawerJobOrder.serviceDescription)}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100/80">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] tracking-wide uppercase mb-1.5">
                <Wrench className="w-3.5 h-3.5 text-slate-400" /> Incharge Mechanics
              </div>
              {isEditingDrawer ? (
                <CustomSelect
                  value={editMechanics}
                  onChange={setEditMechanics}
                  options={mechanicOptions}
                  isMultiSelect={true}
                  className="w-full mt-0.5"
                />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {drawerJobOrder.inchargeMechanics && drawerJobOrder.inchargeMechanics.length > 0 ? (
                    drawerJobOrder.inchargeMechanics.map((m: string, i: number) => (
                      <span
                        key={i}
                        className="bg-slate-100 text-slate-800 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        {m}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: Inspection Checklist Results */}
          {drawerJobOrder.inspectionItems && drawerJobOrder.inspectionItems.length > 0 && (
            <div className="px-5 py-4 border-b border-slate-100 space-y-3 text-xs">
              <div className="space-y-1.5 mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] tracking-wide uppercase">
                    <ClipboardCheck className="w-3.5 h-3.5" /> Inspection Checklist
                  </div>
                  {drawerJobOrder.status !== "New" && (
                    <span className="font-bold text-purple-600 text-xs">
                      {getInspectionProgress(drawerJobOrder).completed}/{getInspectionProgress(drawerJobOrder).total} Completed
                    </span>
                  )}
                </div>
                {drawerJobOrder.status !== "New" && (
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${getInspectionProgress(drawerJobOrder).percent}%` }}
                    />
                  </div>
                )}
              </div>

              {/* ACCORDION CHECKLIST STACK */}
              <div className="space-y-2.5">
                {drawerJobOrder.inspectionItems.map((item: InspectionItem, idx: number) => {
                  const itemId = item.id || item.name || `item-${idx}`;
                  const isNewJob = drawerJobOrder.status === "New";
                  const effectiveStatus = isNewJob ? "PENDING" : item.status;
                  const isExpanded = expandedItemId === itemId;
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
                      key={itemId}
                      className={`border rounded-2xl transition-all overflow-hidden bg-white ${
                        isExpanded
                          ? "border-slate-300 shadow-xs"
                          : "border-slate-200"
                      }`}
                    >
                      <div
                        onClick={() => setExpandedItemId(isExpanded ? null : itemId)}
                        className={`px-4 py-3 flex items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                          isExpanded
                            ? "bg-slate-100"
                            : "bg-slate-50/70 hover:bg-slate-100/80"
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
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              STATUS
                            </div>
                            <div className={`text-sm font-bold ${statusColorClass}`}>
                              {statusLabel}
                            </div>
                          </div>

                          {effectiveStatus !== "PENDING" && (
                            <>
                              <div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  DIAGNOSTIC NOTES
                                </div>
                                <div className="text-xs text-slate-800 font-medium leading-relaxed">
                                  {currentNote ? (
                                    currentNote
                                  ) : (
                                    <span className="text-slate-400 italic font-normal">No diagnostic notes recorded.</span>
                                  )}
                                </div>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    VISUAL PROOF
                                  </span>
                                  {photos.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setLightboxData({ itemIdx: idx, photoIdx: 0 });
                                      }}
                                      className="text-slate-500 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                      title="Expand Fullscreen Lightbox"
                                    >
                                      <Maximize2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                {photos.length > 0 ? (
                                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                    {photos.map((photoUrl, pIdx) => (
                                      <div
                                        key={pIdx}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setLightboxData({ itemIdx: idx, photoIdx: pIdx });
                                        }}
                                        className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 cursor-pointer group hover:border-purple-500 transition-all shadow-2xs"
                                      >
                                        <img src={photoUrl} alt={`Proof ${pIdx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
                                        </div>
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
                              {effectiveStatus === "ISSUE" ? (
                                <>
                                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">
                                    <span>MATERIALS NEEDED</span>
                                    <span>QUANTITY</span>
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
                                </>
                              ) : (
                                <>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-0.5">
                                    MATERIALS APPLIED
                                  </div>
                                  <div className="space-y-1">
                                    {item.requiredMaterials.map((m: any, mIdx: number) => {
                                      const name = typeof m === "object" ? m.name : m;
                                      return (
                                        <div key={mIdx} className="flex items-center gap-2 py-1 px-0.5 text-xs font-normal text-slate-700">
                                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                          <span>{name}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </>
                              )}
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
            </div>
          )}

          {/* SECTION 3: ESTIMATE */}
          {drawerJobOrder && drawerJobOrder.status !== "New" && (
            <div className="px-5 py-4 border-b border-slate-100 space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] tracking-wide uppercase">
                  <FileText className="w-3.5 h-3.5" /> Estimate
                </div>

                {(() => {
                  const items = getEffectiveEstimateItems(drawerJobOrder);
                  const isAllBuy = items.length > 0 && items.every((i) => i.customerApproved !== false);
                  return (
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 font-semibold select-none">
                      <span>Buy all</span>
                      <input
                        type="checkbox"
                        checked={isAllBuy}
                        onChange={(e) => {
                          const nextVal = e.target.checked;
                          if (onBuyAllToggle) {
                            onBuyAllToggle(nextVal);
                          } else {
                            const current = getEffectiveEstimateItems(drawerJobOrder);
                            current.forEach((i) => {
                              updateEstimateLine(i.id, { customerApproved: nextVal });
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                    </label>
                  );
                })()}
              </div>

              <div className="space-y-2.5">
                {getEffectiveEstimateItems(drawerJobOrder).map((item) => {
                  const isBuy = item.customerApproved !== false;
                  const lineTotal = item.qty * item.unitPrice;
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isBuy
                          ? "bg-white border-slate-200/90 shadow-2xs"
                          : "bg-slate-50/80 border-slate-200/60 opacity-80"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="font-normal text-slate-700 text-xs truncate">{item.description}</span>

                        <div className="inline-flex items-center bg-slate-900 p-0.5 rounded-full shadow-2xs shrink-0">
                          <button
                            type="button"
                            onClick={() => updateEstimateLine(item.id, { customerApproved: true })}
                            className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full transition-all cursor-pointer select-none ${
                              isBuy
                                ? "bg-white text-slate-900 shadow-xs font-semibold"
                                : "text-white/90 hover:text-white font-medium"
                            }`}
                          >
                            Buy
                          </button>
                          <button
                            type="button"
                            onClick={() => updateEstimateLine(item.id, { customerApproved: false })}
                            className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full transition-all cursor-pointer select-none ${
                              !isBuy
                                ? "bg-white text-slate-900 shadow-xs font-semibold"
                                : "text-white/90 hover:text-white font-medium"
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-slate-500 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-400 font-normal">Quantity</span>
                            <input
                              type="number"
                              min="1"
                              value={item.qty || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                const parsed = val === "" ? 0 : parseInt(val);
                                updateEstimateLine(item.id, { qty: isNaN(parsed) ? 0 : parsed });
                              }}
                              onBlur={() => {
                                if (!item.qty || item.qty < 1) {
                                  updateEstimateLine(item.id, { qty: 1 });
                                }
                              }}
                              className="w-12 bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-center font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400/20 text-xs"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-slate-400 font-mono">₱</span>
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                const parsed = val === "" ? 0 : parseInt(val);
                                updateEstimateLine(item.id, { unitPrice: isNaN(parsed) ? 0 : parsed });
                              }}
                              className="w-16 bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-center font-mono font-medium text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400/20 text-xs"
                            />
                          </div>
                        </div>
                        <span className="font-mono font-bold text-slate-900 text-xs">
                          ₱{lineTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {(() => {
                const calc = getEstimateCalculations(drawerJobOrder);
                return (
                  <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 space-y-2 mt-3 text-xs">
                    <div className="flex items-center justify-between font-normal text-slate-600">
                      <span>{calc.materialsLabel}</span>
                      <span className="font-mono font-bold text-slate-900">₱{calc.materialsSubtotal.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between font-normal text-slate-600">
                      <span>{drawerJobOrder.serviceType}</span>
                      <span className="font-mono font-bold text-slate-900">₱{calc.laborFee.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between font-normal text-slate-600">
                      <span>Discount</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-mono">₱</span>
                        <input
                          type="number"
                          min="0"
                          value={drawerJobOrder.discount || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const parsed = val === "" ? 0 : parseInt(val);
                            updateDrawerJO({ discount: isNaN(parsed) ? 0 : Math.max(0, parsed) });
                          }}
                          className="w-16 bg-white border border-slate-200 rounded-md px-1.5 py-0.5 text-right font-mono font-medium text-slate-900 outline-none focus:border-emerald-500 text-xs"
                        />
                      </div>
                    </div>

                    <div className="border-t border-dashed border-slate-300/80 pt-2 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span className="shrink-0 font-normal text-slate-600">Comment</span>
                        <input
                          type="text"
                          value={drawerJobOrder.estimateComment !== undefined ? drawerJobOrder.estimateComment : calc.commentText}
                          onChange={(e) => updateDrawerJO({ estimateComment: e.target.value })}
                          placeholder={calc.commentText}
                          className="w-full max-w-[260px] bg-white border border-slate-200 rounded-md px-2 py-0.5 text-right font-normal text-slate-700 outline-none focus:border-emerald-500 text-xs"
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900 pt-1">
                        <span>Grand Total</span>
                        <span className="text-emerald-700 font-mono font-bold text-sm">₱{calc.grandTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

        </div>

        {/* ── DRAWER FOOTER ── */}
        <div className="shrink-0 px-5 py-3.5 border-t border-slate-200 bg-white flex items-center justify-end gap-2">
          {drawerJobOrder.status === "New" ? (
            isEditingDrawer ? (
              <>
                <button
                  onClick={() => setIsEditingDrawer(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditDrawer}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleDeleteDrawer}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium text-xs rounded-xl transition-all cursor-pointer mr-auto"
                >
                  Delete Job Order
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handleStartEditDrawer}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Edit Job Order
                </button>
              </>
            )
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
              {drawerJobOrder.status === "Job completed" && (
                hasReminder ? (
                  <button
                    disabled
                    className="px-4 py-2 bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-not-allowed opacity-90 border border-emerald-300"
                  >
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>✓ Reminder Added</span>
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      if (isAddingReminder || checkingReminder) return;
                      setIsAddingReminder(true);
                      try {
                        const startOdo = parseInt(String(drawerJobOrder.odometer || "0").replace(/[^\d]/g, "")) || 0;
                        const targetOdo = startOdo + 10000;
                        const targetDt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
                        await apiService.createReminder({
                          joId: drawerJobOrder.id,
                          startDate: new Date().toISOString(),
                          targetDate: targetDt,
                          startOdometer: startOdo,
                          targetOdometer: targetOdo,
                          status: "Pending"
                        });
                        setHasReminder(true);
                        alert("Service reminder created successfully!");
                      } catch (e) {
                        console.error("Failed to create reminder from drawer", e);
                        alert("Failed to create service reminder.");
                      } finally {
                        setIsAddingReminder(false);
                      }
                    }}
                    disabled={isAddingReminder || checkingReminder}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Bell className="w-4 h-4" />
                    <span>{checkingReminder ? "Checking..." : isAddingReminder ? "Adding..." : "+ Add Reminder"}</span>
                  </button>
                )
              )}
              {drawerJobOrder.status !== "Job completed" && (
                (() => {
                  const progress = getInspectionProgress(drawerJobOrder);
                  const isCompleted = (progress.total > 0 && progress.completed === progress.total);
                  return isCompleted ? (
                    <button
                      onClick={onMarkCompleted}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Complete</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 bg-slate-200 text-slate-400 font-medium text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-not-allowed opacity-70"
                      title="Unlocks once mechanics complete the inspection checklist items (100% completed)"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Complete</span>
                    </button>
                  );
                })()
              )}
            </>
          )}
        </div>
      </motion.div>
    </>
  );
};
