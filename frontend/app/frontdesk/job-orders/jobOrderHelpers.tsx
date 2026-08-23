import React from "react";
import { Check, XCircle, AlertTriangle } from "lucide-react";
import { JobOrder, InspectionItem, EstimateLineItem, JOStatus } from "@/app/types";

export const getServiceDescription = (serviceType?: string, customDesc?: string): string => {
  return customDesc || "";
};

export const STATUS_CONFIG: Record<JOStatus, { label: string; color: string; bg: string; border: string }> = {
  New: { label: "New", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  "Work in progress": { label: "Work in progress", color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200" },
  "Job completed": { label: "Job Completed", color: "text-emerald-800", bg: "bg-emerald-100", border: "border-emerald-300" }
};

export const getEffectiveEstimateItems = (jo: JobOrder): EstimateLineItem[] => {
  const existing = jo.estimateItems || [];
  const map = new Map<string, EstimateLineItem>();

  existing.forEach((item: EstimateLineItem) => {
    map.set(item.id, item);
  });

  (jo.inspectionItems || []).forEach((ins: InspectionItem) => {
    (ins.requiredMaterials || []).forEach((m: any) => {
      if (typeof m === "object" && m.name) {
        const id = m.cart_id || m.material_id || m.name;
        if (!map.has(id)) {
          map.set(id, {
            id: id,
            description: m.name,
            qty: m.qty || 1,
            unitPrice: m.price || 0,
            customerApproved: m.decision === "Buy"
          });
        } else {
          const cur = map.get(id)!;
          if (m.decision !== undefined) {
            cur.customerApproved = m.decision === "Buy";
          }
        }
      }
    });
  });

  return Array.from(map.values());
};

export const getEstimateCalculations = (jo: JobOrder) => {
  const items = getEffectiveEstimateItems(jo);
  const laborFee = jo.serviceFee || 0;
  const discount = jo.discount || 0;

  const buyItems = items.filter((i) => i.customerApproved !== false);
  const materialsSubtotal = buyItems.reduce((sum, i) => sum + (i.qty * i.unitPrice), 0);
  const isAllBuy = items.length > 0 && items.every((i) => i.customerApproved !== false);
  const isAnyNo = items.some((i) => i.customerApproved === false);

  const materialsLabel = isAllBuy ? "Buy all" : "Only Selected Materials";
  const commentText = isAnyNo ? "Some Materials are provided by Customer" : "Provided by Auto Shop";
  const grandTotal = Math.max(0, materialsSubtotal + laborFee - discount);

  return {
    items,
    laborFee,
    discount,
    materialsSubtotal,
    isAllBuy,
    isAnyNo,
    materialsLabel,
    commentText,
    grandTotal
  };
};

export const INSPECTION_STATUS_ICON: Record<string, React.ReactNode> = {
  GOOD: <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
  ISSUE: <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />,
  MONITOR: <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
  PENDING: <span className="w-3.5 h-3.5 rounded border border-slate-300 bg-white block shrink-0 mt-0.5" />
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
  if (item.photos && item.photos.length > 0) return item.photos;
  if (item.photoUrl) return [item.photoUrl];
  return [];
};

export const getInspectionProgress = (jo: JobOrder) => {
  const items = jo.inspectionItems || [];
  const total = items.length;
  // Both GOOD (Good) AND MONITOR (Monitor) count as completed!
  const completed = items.filter((i: InspectionItem) => i.status === "GOOD" || i.status === "MONITOR").length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent };
};
