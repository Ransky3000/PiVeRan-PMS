"use client";

import React from "react";
import { Phone, Edit3, Car, Calendar, Gauge, Trash2 } from "lucide-react";

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
}

interface ReminderTableProps {
  reminders: ReminderItem[];
  onEdit: (reminder: ReminderItem) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export const ReminderTable: React.FC<ReminderTableProps> = ({
  reminders,
  onEdit,
  onDelete,
  isLoading
}) => {
  const getBadgeStyle = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100/80 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900/60";
      case "Due":
        return "bg-blue-100/80 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900/60";
      case "Overdue":
        return "bg-rose-100/80 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900/60";
      case "Done":
        return "bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="w-6 h-6 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin mr-3" />
        <span className="text-sm text-slate-500 font-medium">Loading service reminders...</span>
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
        <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-3">
          <Car className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Reminders Found</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Completed job orders will automatically create next service reminders here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4">Vehicle & Owner</th>
              <th className="py-3.5 px-4">Last Service Odometer</th>
              <th className="py-3.5 px-4">Target Due Date</th>
              <th className="py-3.5 px-4">Target Odometer</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
            {reminders.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-slate-400 shrink-0" />
                      {r.vehicleName || "Vehicle"}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-300">
                        {r.plateNumber}
                      </span>
                      <span>•</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{r.ownerName}</span>
                    </div>
                  </div>
                </td>

                <td className="py-4 px-4">
                  <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300">
                    <Gauge className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{r.startOdometer?.toLocaleString()} KM</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono block mt-0.5">
                    Completed {formatDate(r.startDate)}
                  </span>
                </td>

                <td className="py-4 px-4 font-mono">
                  <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{formatDate(r.targetDate)}</span>
                  </div>
                </td>

                <td className="py-4 px-4 font-mono font-medium text-slate-800 dark:text-slate-200">
                  {r.targetOdometer?.toLocaleString()} KM
                </td>

                <td className="py-4 px-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getBadgeStyle(r.status)}`}>
                    {r.status}
                  </span>
                </td>

                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {r.ownerPhone && (
                      <a
                        href={`tel:${r.ownerPhone}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title={`Call ${r.ownerName} (${r.ownerPhone})`}
                      >
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>Call</span>
                      </a>
                    )}
                    <button
                      onClick={() => onEdit(r)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Reminder"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(r.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete Reminder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
