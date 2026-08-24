"use client";

import React from "react";
import { Phone, Edit3, Trash2, Car, Calendar, Gauge } from "lucide-react";

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
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Due":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Overdue":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "Done":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
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
      <div className="py-12 bg-white rounded-b-2xl border border-slate-200 border-t-0 text-center">
        <div className="inline-block w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mr-2" />
        <span className="text-xs text-slate-500 font-medium">Loading reminders...</span>
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className="py-12 px-4 bg-white rounded-b-2xl border border-slate-200 border-t-0 text-center space-y-2">
        <Car className="w-8 h-8 text-slate-300 mx-auto" />
        <h4 className="text-sm font-semibold text-slate-800">No maintenance reminders found</h4>
        <p className="text-xs text-slate-400">Completed job orders will automatically create service reminders here.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-b-2xl border border-slate-200 border-t-0 shadow-2xs divide-y divide-slate-100 text-xs">
      {reminders.map((r) => (
        <div
          key={r.id}
          className="grid grid-cols-12 py-3.5 px-5 items-center hover:bg-emerald-50/40 transition-colors group"
        >
          {/* VEHICLE & OWNER */}
          <div className="col-span-3 flex flex-col justify-center pr-2">
            <span className="font-extrabold text-slate-900 text-xs truncate">
              {r.vehicleName || "Vehicle"}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 font-medium">
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">
                {r.plateNumber || "No Plate"}
              </span>
              <span>•</span>
              <span className="truncate">{r.ownerName || "Unknown Owner"}</span>
            </div>
          </div>

          {/* LAST SERVICE ODOMETER */}
          <div className="col-span-2 flex flex-col justify-center text-slate-700 font-medium">
            <span className="font-mono font-bold text-slate-900 text-xs">
              {r.startOdometer ? `${r.startOdometer.toLocaleString()} KM` : "0 KM"}
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
              Completed {formatDate(r.startDate)}
            </span>
          </div>

          {/* TARGET DUE DATE */}
          <div className="col-span-2 flex items-center gap-1.5 font-mono text-slate-800 font-bold">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{formatDate(r.targetDate)}</span>
          </div>

          {/* TARGET ODOMETER */}
          <div className="col-span-2 font-mono font-bold text-slate-800">
            {r.targetOdometer ? `${r.targetOdometer.toLocaleString()} KM` : "N/A"}
          </div>

          {/* STATUS */}
          <div className="col-span-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${getBadgeStyle(r.status)}`}>
              {r.status}
            </span>
          </div>

          {/* ACTIONS */}
          <div className="col-span-1 flex items-center justify-end gap-1">
            {r.ownerPhone && (
              <a
                href={`tel:${r.ownerPhone}`}
                className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                title={`Call ${r.ownerName} (${r.ownerPhone})`}
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={() => onEdit(r)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Edit Reminder"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(r.id)}
              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
              title="Delete Reminder"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
