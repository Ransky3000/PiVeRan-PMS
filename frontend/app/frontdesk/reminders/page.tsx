"use client";

import React from "react";
import { TailAdminLayout } from "@/components/TailAdminLayout";

export default function FrontDeskRemindersPage() {
  return (
    <TailAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            View F6: Reminders Queue & Follow-ups
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track and dispatch reminders for deferred service items and 6-month routine PMS maintenance.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 font-bold text-lg flex items-center justify-center mx-auto">
            F6
          </div>
          <h3 className="text-base font-bold text-slate-900">Reminders Queue Placeholder</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Placeholder view for View F6.
          </p>
        </div>
      </div>
    </TailAdminLayout>
  );
}
