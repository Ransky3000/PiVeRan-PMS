"use client";

import React from "react";
import { TailAdminLayout } from "@/components/TailAdminLayout";

export default function AdminAnalyticsPage() {
  return (
    <TailAdminLayout userRole="Admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            High-level operational metrics and real-time shop performance monitoring for Rey Auto Repair Shop.
          </p>
        </div>

        {/* CLEAN EMPTY PLACEHOLDER AREA */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 font-bold text-lg flex items-center justify-center mx-auto">
            📊
          </div>
          <h3 className="text-base font-bold text-slate-900">Analytics Dashboard Placeholder</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            This space is reserved for Sir Keith&apos;s custom metrics, revenue charts, and operational reports.
          </p>
        </div>
      </div>
    </TailAdminLayout>
  );
}
