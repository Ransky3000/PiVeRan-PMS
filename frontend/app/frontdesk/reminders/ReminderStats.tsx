"use client";

import React from "react";
import { Bell, Clock, AlertTriangle, CheckCircle2, ListFilter } from "lucide-react";

interface ReminderStatsProps {
  total: number;
  pending: number;
  due: number;
  overdue: number;
  done: number;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export const ReminderStats: React.FC<ReminderStatsProps> = ({
  total,
  pending,
  due,
  overdue,
  done,
  activeFilter,
  onFilterChange
}) => {
  const cards = [
    { id: "ALL", label: "Total Reminders", count: total, icon: ListFilter, color: "text-slate-700 dark:text-slate-200", bg: "bg-slate-100 dark:bg-slate-800/60" },
    { id: "PENDING", label: "Pending", count: pending, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40" },
    { id: "DUE", label: "Due Soon", count: due, icon: Bell, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
    { id: "OVERDUE", label: "Overdue", count: overdue, icon: AlertTriangle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/40" },
    { id: "DONE", label: "Completed (Done)", count: done, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      {cards.map((c) => {
        const Icon = c.icon;
        const isActive = activeFilter.toUpperCase() === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onFilterChange(c.id)}
            className={`flex flex-col p-4 rounded-2xl border text-left transition-all duration-200 ${
              isActive
                ? "border-slate-900 dark:border-slate-100 shadow-md ring-2 ring-slate-900/10 dark:ring-white/10"
                : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            } bg-white dark:bg-slate-900/80`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {c.label}
              </span>
              <div className={`p-2 rounded-xl ${c.bg}`}>
                <Icon className={`w-4 h-4 ${c.color}`} />
              </div>
            </div>
            <span className={`text-2xl font-bold font-mono tracking-tight ${c.color}`}>
              {c.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
