"use client";

import React from "react";
import { TailAdminLayout } from "@/components/TailAdminLayout";

export default function VehiclesPage() {
  return (
    <TailAdminLayout userRole="FrontDesk" userName="Sir Cedrick" userEmail="cedrick@piveran.com">
      <div className="space-y-4">
        <div className="border-b border-slate-200/80 pb-3">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Garage Vehicles
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Registered Vehicle Database
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 font-medium text-xs shadow-2xs">
          Empty View — Vehicle Database.
        </div>
      </div>
    </TailAdminLayout>
  );
}
