"use client";

import React from "react";
import { Camera, ChevronRight, ShieldCheck } from "lucide-react";

interface CompletedVehicleCardProps {
  vehicleModel: string;
  plateNumber: string;
  ownerName: string;
  vehiclePhotoUrl?: string;
  completedJobsCount: number;
  latestCompletedDate?: string;
  latestServiceType?: string;
  onClick: () => void;
}

export const CompletedVehicleCard: React.FC<CompletedVehicleCardProps> = ({
  vehicleModel,
  plateNumber,
  ownerName,
  vehiclePhotoUrl,
  completedJobsCount,
  latestCompletedDate,
  latestServiceType,
  onClick
}) => {
  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group max-w-xs w-full cursor-pointer"
      onClick={onClick}
    >
      {/* Vehicle Top Photo Banner (Matching JobOrderCard) */}
      <div className="h-40 bg-slate-100 relative flex items-center justify-center border-b border-slate-200 overflow-hidden">
        {vehiclePhotoUrl ? (
          <img
            src={vehiclePhotoUrl}
            alt={vehicleModel}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-center space-y-1 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-200/70 flex items-center justify-center mx-auto text-slate-500">
              <Camera className="w-6 h-6" />
            </div>
            <div className="text-sm font-medium text-slate-400">Photo</div>
          </div>
        )}
      </div>

      {/* Card Content (Matching JobOrderCard Structure) */}
      <div className="p-5 space-y-4 flex-1">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              {vehicleModel || "Vehicle"}
            </h3>
            {plateNumber && (
              <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200/80 shrink-0">
                {plateNumber}
              </span>
            )}
          </div>
          <p className="text-xs font-normal text-slate-500 mt-1">
            Owner: <span className="text-slate-800 font-medium">{ownerName || "Unknown"}</span>
          </p>
        </div>

        <div className="space-y-3 text-xs border-t border-slate-100 pt-3">
          {latestServiceType && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-normal">Latest Service:</span>
              <span className="font-bold text-slate-900">{latestServiceType}</span>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{completedJobsCount} {completedJobsCount === 1 ? "Visit Completed" : "Visits Completed"}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer (Matching JobOrderCard Footer) */}
      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
        <span className="text-[11px] text-slate-400 font-normal">{latestCompletedDate || ""}</span>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </div>
  );
};
