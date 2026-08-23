import React from "react";
import { Camera, ChevronRight } from "lucide-react";
import { JobOrder } from "@/app/types";
import { getJobBadgeConfig, getInspectionProgress } from "./mechanicHelpers";

interface MechanicJobCardProps {
  jo: JobOrder;
  onClick: () => void;
}

export const MechanicJobCard: React.FC<MechanicJobCardProps> = ({ jo, onClick }) => {
  const sc = getJobBadgeConfig(jo);
  const progress = getInspectionProgress(jo);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group max-w-xs w-full cursor-pointer"
    >
      <div className="h-40 bg-slate-100 relative flex items-center justify-center border-b border-slate-200 overflow-hidden shrink-0">
        {jo.vehiclePhotoUrl ? (
          <img
            src={jo.vehiclePhotoUrl}
            alt={jo.vehicleModel}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-center space-y-1 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-200/70 flex items-center justify-center mx-auto text-slate-500">
              <Camera className="w-6 h-6" />
            </div>
            <div className="text-sm font-medium">Photo</div>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4 flex-1">
        <div>
          <h3 className="text-base font-bold text-slate-900 leading-tight mt-0.5">{jo.vehicleModel}</h3>
          <p className="text-xs font-normal text-slate-500 mt-1">
            Owner: <span className="text-slate-800 font-medium">{jo.ownerName}</span>
          </p>
        </div>

        <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-normal">Service Type:</span>
            <span className="font-semibold text-slate-900">{jo.serviceType}</span>
          </div>

          {/* Status / Progress indicators */}
          {jo.status === "New" && (
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Inspection Status</span>
                <span className="font-semibold text-amber-700">0/{progress.total} Completed</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div className="h-full bg-amber-400 w-0" />
              </div>
            </div>
          )}

          {jo.status === "Work in progress" && (
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Inspection Checklist</span>
                <span className="font-semibold text-violet-700">{progress.completed}/{progress.total} Completed</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${(progress.completed / (progress.total || 1)) * 100}%` }}
                />
              </div>
            </div>
          )}

          {jo.status === "Job completed" && (
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>Inspection Checklist</span>
                <span className="font-semibold text-emerald-600 font-bold">{progress.completed}/{progress.total} Completed</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                <div className="h-full bg-emerald-600 w-full rounded-full" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
        <span className="text-[11px] text-slate-400 font-normal">{jo.createdAt}</span>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </div>
    </div>
  );
};
