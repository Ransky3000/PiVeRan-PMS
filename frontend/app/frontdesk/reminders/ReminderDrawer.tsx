"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Calendar,
  Gauge,
  Wrench,
  User,
  Phone,
  CheckCircle2,
  Edit3,
  Trash2,
  Bell,
  CheckSquare
} from "lucide-react";
import { ReminderItem } from "./ReminderTable";
import { apiService } from "@/app/apiService";

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
  const [associatedJobOrder, setAssociatedJobOrder] = useState<any | null>(null);
  const [loadingJo, setLoadingJo] = useState(false);

  useEffect(() => {
    if (!reminder || !reminder.joId) {
      setAssociatedJobOrder(null);
      return;
    }
    let isMounted = true;
    setLoadingJo(true);
    apiService.getJobOrders()
      .then((jobs) => {
        if (!isMounted) return;
        const matched = (jobs || []).find((j: any) => j.id === reminder.joId || j.joId === reminder.joId);
        setAssociatedJobOrder(matched || null);
      })
      .catch((e) => {
        console.warn("Failed to fetch linked job order for reminder drawer", e);
      })
      .finally(() => {
        if (isMounted) setLoadingJo(false);
      });

    return () => {
      isMounted = false;
    };
  }, [reminder?.joId]);

  if (!reminder) return null;

  // Format numbers with spaces (e.g. 20 000 Km)
  const formatNumberWithSpaces = (numVal?: number | string) => {
    if (numVal === undefined || numVal === null || numVal === "") return "0";
    const num = typeof numVal === "number" ? numVal : parseInt(String(numVal).replace(/[^\d]/g, "")) || 0;
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const formatKm = (kmVal?: number | string) => {
    return `${formatNumberWithSpaces(kmVal)} Km`;
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

  // Progress Calculation
  const getProgress = () => {
    if (!reminder.targetDate) return 0;
    const start = reminder.startDate ? new Date(reminder.startDate).getTime() : Date.now();
    const target = new Date(reminder.targetDate).getTime();
    const now = Date.now();
    if (now >= target) return 100;
    if (now <= start) return 0;
    const total = target - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  };

  const progressPct = getProgress();
  const getStatusBadge = () => {
    switch (reminder.status) {
      case "Due":
        return <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">Due Soon</span>;
      case "Overdue":
        return <span className="px-2.5 py-1 text-xs font-semibold bg-rose-100 text-rose-800 rounded-full">Overdue</span>;
      case "Done":
        return <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">Completed</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-800 rounded-full">Pending</span>;
    }
  };

  return (
    <>
      {/* BACKDROP */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-950/40"
      />

      {/* DRAWER PANEL */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[480px] bg-white border-l border-slate-200 shadow-2xl flex flex-col"
      >
        {/* HEADER */}
        <div className="shrink-0 px-5 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900 truncate">
                {reminder.vehicleName}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                {getStatusBadge()}
                <span className="text-xs text-slate-500 font-medium">Plate: {reminder.plateNumber}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto">

          {/* SECTION 1: VEHICLE & OWNER INFO */}
          <div className="px-5 py-4 border-b border-slate-100 space-y-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] tracking-wide uppercase mb-1">
              <User className="w-3.5 h-3.5 text-slate-400" /> Owner Details
            </div>
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
              <div>
                <span className="text-slate-500 text-[11px] block">Owner Name</span>
                <div className="font-semibold text-slate-900 text-sm mt-0.5">{reminder.ownerName}</div>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Contact Number</span>
                <div className="font-semibold text-slate-900 text-sm mt-0.5">{reminder.ownerPhone || "N/A"}</div>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Plate Number</span>
                <div className="font-semibold text-slate-900 text-sm mt-0.5">{reminder.plateNumber}</div>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Status</span>
                <div className="font-semibold text-slate-900 text-sm mt-0.5">{reminder.status}</div>
              </div>
            </div>
          </div>

          {/* SECTION 2: METRICS & SCHEDULE */}
          <div className="px-5 py-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] tracking-wide uppercase mb-1">
              <Bell className="w-3.5 h-3.5 text-slate-400" /> Service Schedule & Metrics
            </div>

            <div className="grid grid-cols-2 gap-3 py-1">
              {/* Last Service */}
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <Wrench className="w-5 h-5 text-slate-700 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[11px] font-semibold text-slate-500 leading-tight">
                    Last Service
                  </span>
                  <span className="block text-xs font-bold text-slate-900 truncate mt-0.5">
                    {formatSocialDate(reminder.startDate)}
                  </span>
                </div>
              </div>

              {/* Last Odometer */}
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <Gauge className="w-5 h-5 text-slate-700 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[11px] font-semibold text-slate-500 leading-tight">
                    Last Odometer
                  </span>
                  <span className="block text-xs font-bold text-slate-900 truncate mt-0.5">
                    {formatKm(reminder.startOdometer)}
                  </span>
                </div>
              </div>
            </div>

            {/* DUE METRICS */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-slate-400" /> Due Odometer
                </span>
                <span className="font-bold text-slate-900 text-sm">{formatKm(reminder.targetOdometer)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Next Schedule
                </span>
                <span className="font-bold text-slate-900 text-sm">{formatDateFriendly(reminder.targetDate)}</span>
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                <span>Timeline Progress</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    progressPct >= 100
                      ? "bg-rose-500"
                      : progressPct >= 80
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: ASSOCIATED JOB ORDER DETAILS (IF LINKED) */}
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px] tracking-wide uppercase">
                <CheckSquare className="w-3.5 h-3.5 text-slate-400" /> Service Details
              </div>
              {associatedJobOrder && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  JO #{associatedJobOrder.id}
                </span>
              )}
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Service Package:</span>
                <span className="font-bold text-slate-900">{associatedJobOrder?.serviceType || "Basic PMS"}</span>
              </div>
              <p className="text-slate-600 text-xs italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {associatedJobOrder?.serviceDescription || "Every 10,000 KM or 6 Months"}
              </p>

              {associatedJobOrder?.inspectionItems && associatedJobOrder.inspectionItems.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 block">Checklist Items:</span>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {associatedJobOrder.inspectionItems.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{item.name || item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ACTION FOOTER */}
        <div className="shrink-0 px-5 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between gap-2">
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
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Call Owner</span>
              </a>
            )}

            {reminder.status !== "Done" && (
              <button
                onClick={() => {
                  onMarkCompleted(reminder);
                  onClose();
                }}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Completed</span>
              </button>
            )}

            <button
              onClick={() => {
                onEdit(reminder);
                onClose();
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
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
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-xs rounded-xl border border-rose-200 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};
