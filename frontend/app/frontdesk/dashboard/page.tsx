"use client";

import React from "react";
import { TailAdminLayout } from "@/components/TailAdminLayout";

export default function FrontDeskDashboardPage() {
  return (
    <TailAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              View F1: Live Operations Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Front Desk active vehicle tracking and garage bay throughput board.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 font-bold text-lg flex items-center justify-center mx-auto">
            F1
          </div>
          <h3 className="text-base font-bold text-slate-900">Live Dashboard Placeholder</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            This view will be implemented after completing View F2: Vehicle Intake & Check-in.
          </p>
        </div>
      </div>
    </TailAdminLayout>
  );
}
