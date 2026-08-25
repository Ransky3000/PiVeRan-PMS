"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Bell,
  ClipboardCheck,
  ChevronRight,
  Check,
  Edit3,
  Trash2,
  Phone
} from "lucide-react";
import { ReminderItem } from "./ReminderTable";
import { apiService } from "@/app/apiService";
import { getServiceDescription, INSPECTION_STATUS_ICON, getItemNote, getItemPhotos } from "../job-orders/jobOrderHelpers";

interface ReminderDrawerProps {
  reminder: ReminderItem | null;
  onClose: () => void;
  onEdit: (reminder: ReminderItem) => void;
  onDelete: (id: string) => void;
  onMarkCompleted: (reminder: ReminderItem) => void;
}

export const ReminderDrawer: React.FC<ReminderDrawerProps> = ({
  reminder,
  onClose,
  onEdit,
  onDelete,
  onMarkCompleted
}) => {
  const [drawerJobOrder, setDrawerJobOrder] = useState<any | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!reminder || !reminder.joId) {
      setDrawerJobOrder(null);
      return;
    }
    let isMounted = true;
    apiService.getJobOrders()
      .then((jobs) => {
        if (!isMounted) return;
        const matched = (jobs || []).find((j: any) => j.id === reminder.joId || j.joId === reminder.joId);
        setDrawerJobOrder(matched || null);
      })
      .catch((e) => {
        console.warn("Failed to fetch linked job order for reminder drawer", e);
      });

    return () => { isMounted = false; };
  }, [reminder?.joId]);

  if (!reminder) return null;

  // Format numbers with spaces (e.g. 20 000 Km)
  const formatNumberWithSpaces = (numVal?: number | string) => {
    if (numVal === undefined || numVal === null || numVal === "") return "0";
    const num = typeof numVal === "number" ? numVal : parseInt(String(numVal).replace(/[^\d]/g, "")) || 0;
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const formatKm = (kmVal?: number | string) => {
    return `${formatNumberWithSpaces(kmVal)} KM`;
  };

  const formatDateFriendly = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch (e) {
      return dateStr;
    }
  };

  const formatSocialDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;

      const currentYear = new Date().getFullYear();
      const dateYear = d.getFullYear();
      const datePart = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const timePart = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

      if (dateYear === currentYear) {
        return `${datePart} | ${timePart}`;
      } else {
        return `${datePart}, ${dateYear} | ${timePart}`;
      }
    } catch (e) {
      return dateStr;
    }
  };

  const serviceCategory = drawerJobOrder?.serviceType || "Basic PMS";
  const serviceDesc = getServiceDescription(serviceCategory, drawerJobOrder?.serviceDescription);

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
              <h2 className="text-base font-bold text-slate-900 truncate">
                {reminder.vehicleName}
              </h2>
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

          {/* SECTION 1: Vehicle Info */}
          <div className="px-5 py-4 border-b border-slate-100 space-y-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] tracking-wide uppercase mb-1">
              <FileText className="w-3.5 h-3.5" /> Vehicle Info
            </div>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
              <div><span className="text-slate-500">Owner</span><div className="font-medium text-slate-900">{reminder.ownerName}</div></div>
              <div><span className="text-slate-500">Phone</span><div className="font-medium text-slate-900">{reminder.ownerPhone || "N/A"}</div></div>
              <div><span className="text-slate-500">Plate</span><div className="font-medium text-slate-900">{reminder.plateNumber}</div></div>
              <div><span className="text-slate-500">Odometer</span><div className="font-medium text-slate-900">{formatKm(reminder.startOdometer)}</div></div>
              <div><span className="text-slate-500">Service Category</span><div className="font-medium text-slate-900">{serviceCategory}</div></div>
            </div>

            <div className="pt-2 border-t border-slate-100/80">
              <span className="text-slate-500 font-medium text-xs block">Service Description</span>
              <div className="font-semibold text-slate-800 text-xs mt-0.5">
                {serviceDesc}
              </div>
            </div>
          </div>

          {/* SECTION 2: Maintenance Schedule */}
          <div className="px-5 py-4 border-b border-slate-100 space-y-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] tracking-wide uppercase mb-1">
              <Bell className="w-3.5 h-3.5" /> Maintenance Schedule
            </div>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
              <div><span className="text-slate-500">Last Service</span><div className="font-medium text-slate-900">{formatSocialDate(reminder.startDate)}</div></div>
              <div><span className="text-slate-500">Last Odometer</span><div className="font-medium text-slate-900">{formatKm(reminder.startOdometer)}</div></div>
              <div><span className="text-slate-500">Due Odometer</span><div className="font-medium text-slate-900">{formatKm(reminder.targetOdometer)}</div></div>
              <div><span className="text-slate-500">Next Schedule</span><div className="font-medium text-slate-900">{formatDateFriendly(reminder.targetDate)}</div></div>
            </div>
          </div>

          {/* SECTION 3: Inspection Checklist Results */}
          {drawerJobOrder?.inspectionItems && drawerJobOrder.inspectionItems.length > 0 && (
            <div className="px-5 py-4 border-b border-slate-100 space-y-3 text-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] tracking-wide uppercase">
                  <ClipboardCheck className="w-3.5 h-3.5" /> Inspection Checklist
                </div>
              </div>

              {/* ACCORDION CHECKLIST STACK */}
              <div className="space-y-2.5">
                {drawerJobOrder.inspectionItems.map((item: any, idx: number) => {
                  const itemId = item.id || item.name || `item-${idx}`;
                  const effectiveStatus = item.status || "PENDING";
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
                        isExpanded ? "border-slate-300 shadow-xs" : "border-slate-200"
                      }`}
                    >
                      <div
                        onClick={() => setExpandedItemId(isExpanded ? null : itemId)}
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
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  STATUS
                                </div>
                                <div className={`text-sm font-bold ${statusColorClass}`}>
                                  {statusLabel}
                                </div>
                              </div>

                              {currentNote && (
                                <div>
                                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                    NOTES
                                  </div>
                                  <p className="text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    {currentNote}
                                  </p>
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

        </div>

        {/* ── DRAWER FOOTER ── */}
        <div className="shrink-0 px-5 py-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
          <div className="flex items-center gap-2">
            {reminder.ownerPhone && (
              <a
                href={`tel:${reminder.ownerPhone}`}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Call</span>
              </a>
            )}

            {reminder.status !== "Done" && (
              <button
                onClick={() => {
                  onMarkCompleted(reminder);
                  onClose();
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Complete</span>
              </button>
            )}

            <button
              onClick={() => {
                onEdit(reminder);
                onClose();
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete reminder for ${reminder.vehicleName}?`)) {
                  onDelete(reminder.id);
                  onClose();
                }
              }}
              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition-all cursor-pointer"
              title="Delete Reminder"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};
