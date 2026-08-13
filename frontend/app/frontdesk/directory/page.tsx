"use client";

import React from "react";
import { TailAdminLayout } from "@/components/TailAdminLayout";

export default function FrontDeskDirectoryPage() {
  return (
    <TailAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            View F3: Directory & Maintenance History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search customer profiles, vehicle timelines, and skipped service liability logs.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 font-bold text-lg flex items-center justify-center mx-auto">
            F3
          </div>
          <h3 className="text-base font-bold text-slate-900">Directory & History Placeholder</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Placeholder view for View F3.
          </p>
        </div>
      </div>
    </TailAdminLayout>
  );
}
