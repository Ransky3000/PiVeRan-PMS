"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Gauge,
  Wrench,
  ChevronRight,
  Package
} from "lucide-react";
import { JobOrder } from "@/app/types";
import { JobOrderDrawer } from "@/app/frontdesk/job-orders/JobOrderDrawer";
import { getEstimateCalculations } from "@/app/frontdesk/job-orders/jobOrderHelpers";

interface VehicleHistoryTimelineProps {
  vehicle: any;
  jobOrders: JobOrder[];
  isLoading?: boolean;
  hideFinancials?: boolean;
  onSelectJobOrderForDetails?: (jo: JobOrder | null) => void;
  selectedJobOrderId?: string | null;
}

export const VehicleHistoryTimeline: React.FC<VehicleHistoryTimelineProps> = ({
  vehicle,
  jobOrders,
  isLoading = false,
  hideFinancials = false,
  onSelectJobOrderForDetails,
  selectedJobOrderId
}) => {
  const [selectedJoForDrawer, setSelectedJoForDrawer] = useState<JobOrder | null>(null);

  const totalVisits = jobOrders.length;

  const sortedJobs = [...jobOrders].sort((a, b) => {
    const timeA = new Date(a.completedAt || a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.completedAt || b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  // Auto-select latest visit on load when callback provided
  useEffect(() => {
    if (sortedJobs.length > 0 && onSelectJobOrderForDetails && !selectedJobOrderId) {
      onSelectJobOrderForDetails(sortedJobs[0]);
    }
  }, [sortedJobs.length]);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-slate-400 space-y-2">
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold">Loading vehicle service history...</p>
      </div>
    );
  }

  const maxOdoJob = sortedJobs.reduce((prev, curr) => {
    const prevOdo = parseInt(String(prev?.odometer || "0").replace(/[^\d]/g, "")) || 0;
    const currOdo = parseInt(String(curr?.odometer || "0").replace(/[^\d]/g, "")) || 0;
    return currOdo >= prevOdo ? curr : prev;
  }, sortedJobs[0]);

  const latestOdometer = maxOdoJob ? maxOdoJob.odometer : (sortedJobs[0]?.odometer || vehicle.odometer || "0");

  const totalSpend = sortedJobs.reduce((acc, jo) => {
    if (jo.status === "Job completed" || jo.status === "Work in progress") {
      const calc = getEstimateCalculations(jo);
      return acc + (calc.grandTotal || 0);
    }
    return acc;
  }, 0);

  const formatKmDisplay = (val: string | number) => {
    const raw = String(val || "").replace(/[^\d]/g, "");
    if (!raw) return "0 Km";
    return `${raw.replace(/\B(?=(\d{3})+(?!\d))/g, " ")} Km`;
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const datePart = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const timePart = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
      return `${datePart} | ${timePart}`;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-5 text-slate-900">
      {/* ── LIFETIME STATS SUMMARY CARDS ── */}
      <div className={`grid ${hideFinancials ? "grid-cols-2" : "grid-cols-3"} gap-2`}>
        <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-2xs">
          <span className="block text-[10px] font-bold text-slate-400 uppercase">Visits</span>
          <span className="text-base font-black text-slate-900">{totalVisits}</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-2xs">
          <span className="block text-[10px] font-bold text-slate-400 uppercase">Latest Mileage</span>
          <span className="text-xs font-black text-slate-900 truncate block mt-0.5">
            {formatKmDisplay(latestOdometer)}
          </span>
        </div>

        {!hideFinancials && (
          <div className="bg-white border border-slate-200 rounded-2xl p-3 text-center shadow-2xs">
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Total Spend</span>
            <span className="text-xs font-black text-emerald-700 truncate block mt-0.5">
              ₱{totalSpend.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>

      {/* ── TIMELINE STREAM ── */}
      {sortedJobs.length === 0 ? (
        <div className="py-12 px-4 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Wrench className="w-8 h-8 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900">No Maintenance History Found</h4>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              This vehicle has not had any recorded job orders or maintenance service visits yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative pl-7 space-y-3.5 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-900">
          {sortedJobs.map((jo) => {
            const isSelected = selectedJobOrderId ? jo.id === selectedJobOrderId : selectedJoForDrawer?.id === jo.id;

            return (
              <div key={jo.id} className="relative group">
                {/* Perfectly Centered Solid Dark Timeline Point Node */}
                <div
                  className={`absolute rounded-full bg-slate-900 transition-all ${
                    isSelected
                      ? "w-[18px] h-[18px] -left-[24px] top-3.5 ring-4 ring-slate-900/15 shadow-xs"
                      : "w-[14px] h-[14px] -left-[22px] top-4 opacity-90"
                  }`}
                />

                {/* Excalidraw-Style Timeline Card */}
                <div
                  onClick={() => {
                    if (onSelectJobOrderForDetails) {
                      onSelectJobOrderForDetails(jo);
                    } else {
                      setSelectedJoForDrawer(jo);
                    }
                  }}
                  className={`rounded-2xl border-2 p-4 shadow-2xs transition-all cursor-pointer group select-none space-y-1.5 ${
                    isSelected
                      ? "bg-slate-50/90 border-slate-900 ring-2 ring-slate-900/15 shadow-md"
                      : "bg-white border-slate-900/80 hover:border-slate-900 hover:shadow-md"
                  }`}
                >
                  {/* Large Text for Service Type */}
                  <span className="font-black text-slate-900 text-base block group-hover:text-slate-950 transition-colors">
                    {jo.serviceType}
                  </span>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                    <span className="font-bold text-slate-700">{formatKmDisplay(jo.odometer)}</span>
                    <span className="font-semibold text-slate-500">{formatDateDisplay(jo.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fallback Overlay Drawer when callback not provided */}
      {!onSelectJobOrderForDetails && selectedJoForDrawer && (
        <JobOrderDrawer
          drawerJobOrder={selectedJoForDrawer}
          onClose={() => setSelectedJoForDrawer(null)}
          readOnly={true}
        />
      )}
    </div>
  );
};
