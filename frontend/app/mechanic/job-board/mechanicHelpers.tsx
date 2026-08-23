import React from "react";
import { Check, XCircle, AlertTriangle } from "lucide-react";
import { JobOrder, InspectionItem } from "@/app/types";

export const getServiceDescription = (serviceType?: string, customDesc?: string): string => {
  return customDesc || "";
};

export const getJobBadgeConfig = (jo: JobOrder) => {
  if (jo.status === "New") {
    return { label: "New", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" };
  }
  if (jo.status === "Work in progress") {
    return { label: "Work in progress", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" };
  }
  if (jo.status === "Job completed") {
    return { label: "Job completed", color: "text-emerald-800", bg: "bg-emerald-50", border: "border-emerald-200" };
  }
  return { label: jo.status, color: "text-slate-700", bg: "bg-slate-100", border: "border-slate-200" };
};

export const INSPECTION_STATUS_ICON: Record<string, React.ReactNode> = {
  GOOD: <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
  ISSUE: <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />,
  MONITOR: <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
  PENDING: <span className="w-3.5 h-3.5 rounded border border-slate-300 bg-white block shrink-0 mt-0.5" />
};

export const getInspectionProgress = (jo: JobOrder | null) => {
  if (!jo) return { completed: 0, total: 0, isAllCompleted: false, text: "0/0 Completed" };
  const items = jo.inspectionItems || [];
  const total = items.length;
  const completed = items.filter((i: InspectionItem) => i.status === "GOOD" || i.status === "MONITOR").length;
  const isAllCompleted = total > 0 && completed === total;
  return {
    completed,
    total,
    isAllCompleted,
    text: `${completed}/${total} Completed`
  };
};

export const getItemNote = (item: Partial<InspectionItem>, targetStatus?: InspectionItem["status"]): string => {
  const activeStatus = targetStatus || item.status;
  if (activeStatus && activeStatus !== "PENDING" && item.statusNotes?.[activeStatus] !== undefined) {
    return item.statusNotes[activeStatus] || "";
  }
  return item.mechanicNote || "";
};

export const getItemPhotos = (item: Partial<InspectionItem>, targetStatus?: InspectionItem["status"]): string[] => {
  const activeStatus = targetStatus || item.status;
  if (activeStatus && activeStatus !== "PENDING" && item.statusPhotos?.[activeStatus]) {
    return item.statusPhotos[activeStatus] || [];
  }
  return item.proofPhotoUrl ? [item.proofPhotoUrl] : [];
};
