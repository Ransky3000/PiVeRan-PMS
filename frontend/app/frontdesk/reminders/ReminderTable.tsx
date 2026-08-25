"use client";

import React, { useState } from "react";
import { Phone, Edit3, Trash2, Gauge, Wrench, MoreVertical, CheckCircle2 } from "lucide-react";

export interface ReminderItem {
  id: string;
  joId?: string;
  vehicleId: string;
  ownerId: string;
  startDate: string;
  targetDate: string;
  startOdometer: number;
  targetOdometer: number;
  status: "Pending" | "Due" | "Overdue" | "Done";
  notes?: string;
  vehicleName?: string;
  plateNumber?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerFb?: string;
}

interface ReminderTableProps {
  reminders: ReminderItem[];
  onEdit: (reminder: ReminderItem) => void;
  onDelete: (id: string) => void;
  onSelectReminder?: (reminder: ReminderItem) => void;
  isLoading?: boolean;
}

export const ReminderTable: React.FC<ReminderTableProps> = ({
  reminders,
  onEdit,
  onDelete,
  onSelectReminder,
  isLoading
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const formatSocialDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      // Parse directly — handles both ISO and pre-formatted strings from backend
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch (e) {
      return dateStr;
    }
  };

  const formatKm = (kmVal?: number | string) => {
    if (kmVal === undefined || kmVal === null || kmVal === "") return "0 Km";
    const num = typeof kmVal === "number" ? kmVal : parseInt(String(kmVal).replace(/[^\d]/g, "")) || 0;
    return `${num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} Km`;
  };

  // Progress percentage calculation
  const getProgressPercentage = (r: ReminderItem) => {
    if (!r.startDate || !r.targetDate) return 0;
    const start = new Date(r.startDate).getTime();
    const target = new Date(r.targetDate).getTime();
    const now = Date.now();

    if (isNaN(start) || isNaN(target) || target <= start) return 0;
    if (now <= start) return 0;
    if (now >= target) return 100;

    const pct = ((now - start) / (target - start)) * 100;
    return Math.min(Math.max(pct, 0), 100);
  };

  const getProgressColor = (pct: number, status: string) => {
    if (status === "Overdue" || pct >= 100) return "bg-rose-500";
    if (status === "Due" || pct >= 75) return "bg-amber-500";
    if (status === "Done") return "bg-emerald-600";
    return "bg-emerald-500";
  };

  if (isLoading) {
    return (
      <div className="py-16 bg-white rounded-3xl border border-slate-200 text-center shadow-xs">
        <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2" />
        <span className="text-sm text-slate-500 font-medium">Loading reminders...</span>
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="py-16 px-4 bg-white rounded-3xl border border-slate-200 text-center space-y-2 shadow-xs">
        <Wrench className="w-10 h-10 text-slate-300 mx-auto" />
        <h4 className="text-base font-bold text-slate-800">No maintenance reminders found</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Completed job orders will automatically populate service reminders here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {reminders.map((r) => {
        const progressPct = getProgressPercentage(r);
        const progressColor = getProgressColor(progressPct, r.status);
        const isMenuOpen = activeMenuId === r.id;

        return (
          <div
            key={r.id}
            onClick={() => onSelectReminder && onSelectReminder(r)}
            className="bg-white rounded-3xl border-2 border-slate-800 p-5 shadow-xs flex flex-col justify-between relative hover:shadow-md hover:border-emerald-600 transition-all cursor-pointer group"
          >
            <div>
              {/* HEADER: Vehicle Title & 3-Dot Actions */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight line-clamp-1 group-hover:text-emerald-700 transition-colors">
                  {r.vehicleName || "Unknown Vehicle"}
                </h3>

                {/* 3-Dot Action Menu */}
                <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(isMenuOpen ? null : r.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    aria-label="Actions menu"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setActiveMenuId(null)}
                      />
                      <div className="absolute right-0 top-8 z-20 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 text-xs font-semibold text-slate-700">
                        {r.status !== "Done" && (
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onEdit({ ...r, status: "Done" });
                            }}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Mark Completed</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onDelete(r.id);
                          }}
                          className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* SUBTITLE: Owner & Plate */}
              <p className="text-xs text-slate-600 font-medium mb-4">
                Owner: <span className="font-semibold text-slate-800">{r.ownerName || "Unknown Owner"}</span>
                {" | "}
                Plate no. <span className="font-semibold text-slate-800">{r.plateNumber || "N/A"}</span>
              </p>

              {/* TWO METRIC BOXES: Last Service & Last Odometer */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Last Service */}
                <div className="flex items-center gap-3 py-1">
                  <Wrench className="w-6 h-6 text-slate-800 shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-[11px] font-semibold text-slate-500 leading-tight">
                      Last Service
                    </span>
                    <span className="block text-sm font-bold text-slate-900 truncate">
                      {formatSocialDate(r.startDate)}
                    </span>
                  </div>
                </div>

                {/* Last Odometer */}
                <div className="flex items-center gap-3 py-1">
                  <Gauge className="w-6 h-6 text-slate-800 shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-[11px] font-semibold text-slate-500 leading-tight">
                      Last Odometer
                    </span>
                    <span className="block text-sm font-bold text-slate-900 truncate">
                      {formatKm(r.startOdometer)}
                    </span>
                  </div>
                </div>
              </div>

              {/* DIVIDER */}
              <hr className="border-t border-slate-300 mb-3" />

              {/* DUE ODOMETER & NEXT SCHEDULE ROWS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-xs font-semibold text-slate-600">Due Odometer</span>
                  <span className="font-bold text-slate-900 text-base">
                    {formatKm(r.targetOdometer)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-xs font-semibold text-slate-600">Next Schedule</span>
                  <span className="font-bold text-slate-900 text-base">
                    {formatDate(r.targetDate)}
                  </span>
                </div>
              </div>
            </div>

            {/* TIMELINE PROGRESS BAR */}
            <div className="mt-2.5">
              <div className="h-2 w-full bg-slate-100 rounded-full relative overflow-hidden border border-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
