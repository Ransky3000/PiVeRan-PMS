"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Car,
  Gauge,
  Calendar,
  Wrench,
  Phone,
  Check,
  Trash2
} from "lucide-react";
import { ReminderItem } from "./ReminderTable";
import { apiService } from "@/app/apiService";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";

interface ReminderDrawerProps {
  reminder: ReminderItem | null;
  onClose: () => void;
  onSave?: (id: string, updates: Partial<ReminderItem>) => Promise<void>;
  onDelete: (id: string) => void;
  onMarkCompleted: (reminder: ReminderItem) => void;
}

export const ReminderDrawer: React.FC<ReminderDrawerProps> = ({
  reminder,
  onClose,
  onSave,
  onDelete,
  onMarkCompleted
}) => {
  const [completedJobOrders, setCompletedJobOrders] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [selectedJoId, setSelectedJoId] = useState("");
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [targetOdometer, setTargetOdometer] = useState<number>(10000);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!reminder) return;

    // Load available bundles & job orders for fallback or matching
    Promise.all([apiService.getJobOrders(), apiService.getBundles()])
      .then(([allJobs, allBundles]) => {
        const completed = (allJobs || []).filter((j: any) => j.status === "Job completed");
        setCompletedJobOrders(completed);
        setBundles(allBundles || []);

        const matchedJo = (allJobs || []).find((j: any) => j.id === reminder.joId || j.joId === reminder.joId);
        if (matchedJo) {
          setSelectedJoId(matchedJo.id);
          setSelectedServiceType(matchedJo.serviceType || (allBundles[0]?.packageName || "Basic PMS"));
        } else if (completed.length > 0) {
          setSelectedJoId(completed[0].id);
          setSelectedServiceType(completed[0].serviceType || (allBundles[0]?.packageName || "Basic PMS"));
        }
      })
      .catch(console.error);

    // Populate dates and odometer
    if (reminder.targetDate) {
      const d = new Date(reminder.targetDate);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        setTargetDate(`${yyyy}-${mm}-${dd}`);
      }
    }
    setTargetOdometer(reminder.targetOdometer || 10000);
  }, [reminder]);

  if (!reminder) return null;

  // Selected Job Order & Bundle object
  const selectedJo = completedJobOrders.find((j) => j.id === selectedJoId);
  const activeServiceType = selectedServiceType || selectedJo?.serviceType || "Basic PMS";
  const matchedBundle = bundles.find(
    (b) => b.packageName && activeServiceType && b.packageName.toLowerCase() === activeServiceType.toLowerCase()
  );

  const selectedJoOdo = reminder.startOdometer || (selectedJo ? parseInt(String(selectedJo.odometer || "0").replace(/[^\d]/g, "")) || 0 : 0);
  const selectedJoDate = reminder.startDate || (selectedJo ? (selectedJo.completedAt || selectedJo.updatedAt || selectedJo.createdAt) : "");

  // Vehicle option labels
  const jobSelectOptions: SelectOption[] = completedJobOrders.length > 0
    ? completedJobOrders.map((j) => {
        const vName = j.vehicleModel || (j.vehicle ? `${j.vehicle.year || ''} ${j.vehicle.make || ''} ${j.vehicle.model || ''}`.trim() : '') || "Vehicle";
        const plate = j.plateNumber || j.plate_number || j.vehicle?.plate_number || "No Plate";
        return {
          value: j.id,
          label: `${vName} | ${plate}`
        };
      })
    : [{ value: reminder.joId || "1", label: `${reminder.vehicleName} | ${reminder.plateNumber}` }];

  // Service type select options
  const serviceTypeOptions: SelectOption[] = (bundles || []).length > 0
    ? (bundles || []).map((b) => ({
        value: b.packageName,
        label: b.packageName
      }))
    : [{ value: activeServiceType, label: activeServiceType }];

  // Checklist items preview
  const checklistItems: string[] = matchedBundle?.servicesIncluded && matchedBundle.servicesIncluded.length > 0
    ? matchedBundle.servicesIncluded
    : selectedJo?.inspectionItems && selectedJo.inspectionItems.length > 0
    ? selectedJo.inspectionItems.map((item: any) => item.name || item.title || item.item_name || "Inspection Item")
    : [
        "Full ECU Scanning",
        "Diagnose",
        "Inspect Battery",
        "Replace Sparkplug",
        "Replace Air Filter",
        "Replace Cabin Filter",
        "Fluid Flushing",
        "Inspect/Replace Brake pads and disk",
        "Inspect and Clean brake lining and drum",
        "Change Oil",
        "Replace Oil Filter"
      ];

  // Digit formatting with space thousands separators (e.g. 20 000 Km)
  const formatNumberWithSpaces = (numVal?: number | string) => {
    if (numVal === undefined || numVal === null || numVal === "") return "0";
    const num = typeof numVal === "number" ? numVal : parseInt(String(numVal).replace(/[^\d]/g, "")) || 0;
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const formatKm = (kmVal?: number | string) => {
    return `${formatNumberWithSpaces(kmVal)} Km`;
  };

  const formatDateFriendly = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch (e) {
      return dateStr;
    }
  };

  const formatSocialDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;

      const currentYear = new Date().getFullYear();
      const dateYear = d.getFullYear();
      const datePart = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const timePart = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

      if (dateYear === currentYear) {
        return `${datePart} | ${timePart}`;
      } else {
        return `${datePart}, ${dateYear} | ${timePart}`;
      }
    } catch (e) {
      return dateStr;
    }
  };

  const handleServiceTypeChange = (newServiceType: string) => {
    setSelectedServiceType(newServiceType);
    const matchedB = bundles.find(
      (b) => b.packageName && newServiceType && b.packageName.toLowerCase() === newServiceType.toLowerCase()
    );
    const intervalKm = matchedB?.intervalKm || 10000;
    const intervalMonths = matchedB?.intervalMonths || 6;
    setTargetOdometer(selectedJoOdo + intervalKm);

    let baseDate = new Date();
    if (selectedJoDate) {
      const parsed = new Date(selectedJoDate);
      if (!isNaN(parsed.getTime())) baseDate = parsed;
    }
    const calculatedTarget = new Date(baseDate.getTime());
    calculatedTarget.setMonth(calculatedTarget.getMonth() + intervalMonths);
    const yyyy = calculatedTarget.getFullYear();
    const mm = String(calculatedTarget.getMonth() + 1).padStart(2, "0");
    const dd = String(calculatedTarget.getDate()).padStart(2, "0");
    setTargetDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleSaveAndComplete = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave(reminder.id, {
          targetDate: targetDate ? new Date(targetDate).toISOString() : reminder.targetDate,
          targetOdometer: Number(targetOdometer),
          status: "Done"
        });
      } else {
        onMarkCompleted(reminder);
      }
      onClose();
    } catch (e) {
      console.error("Failed to complete reminder", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-950/40"
      />

      {/* Drawer Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[480px] bg-white border-l border-slate-200 shadow-2xl flex flex-col"
      >
        {/* ── DRAWER HEADER ── */}
        <div className="shrink-0 px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-900">
              Maintenance Reminder
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── DRAWER BODY (SCROLLABLE - MATCHING CREATE REMINDER FORM CONTENT) ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* 1. SELECT VEHICLE ON JOB COMPLETED */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-slate-400" />
              Select Vehicle on Job Completed
            </label>
            <CustomSelect
              options={jobSelectOptions}
              value={selectedJoId || jobSelectOptions[0]?.value || ""}
              onChange={(val) => setSelectedJoId(val)}
              placeholder="Select completed job vehicle..."
            />
          </div>

          {/* 2. OWNER */}
          <div>
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
              Owner
            </span>
            <h4 className="text-xl font-bold text-slate-900">
              {reminder.ownerName || selectedJo?.ownerName || "Juan Dela Cruz"}
            </h4>
            <div className="mt-1 space-y-0.5 text-xs text-slate-600">
              <div>
                <span className="font-medium text-slate-500">Phone: </span>
                <span className="font-semibold text-slate-800">
                  {reminder.ownerPhone || selectedJo?.ownerPhone || selectedJo?.owner?.contact_number || "N/A"}
                </span>
              </div>
              <div>
                <span className="font-medium text-slate-500">FB Contact: </span>
                {(() => {
                  const fbVal = reminder.ownerFb || selectedJo?.ownerFb || selectedJo?.owner?.facebook || "";
                  if (!fbVal || fbVal === "N/A") {
                    return <span className="font-semibold text-slate-500">N/A</span>;
                  }
                  const fbHref = fbVal.startsWith("http://") || fbVal.startsWith("https://")
                    ? fbVal
                    : fbVal.includes("facebook.com")
                    ? `https://${fbVal}`
                    : `https://facebook.com/${fbVal}`;
                  return (
                    <a
                      href={fbHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-emerald-700 hover:text-emerald-800 underline hover:no-underline transition-colors cursor-pointer"
                    >
                      {fbVal}
                    </a>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* 3. SERVICE TYPE */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Service type
            </label>
            <CustomSelect
              options={serviceTypeOptions}
              value={activeServiceType}
              onChange={handleServiceTypeChange}
              placeholder="Select service type..."
            />
          </div>

          {/* 4. SERVICE DETAILS CARD BOX (MATCHING SCREENSHOT 1) */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-3">
            <div className="grid grid-cols-12 gap-3 items-center">
              <span className="col-span-4 text-xs font-semibold text-slate-500">
                Service description:
              </span>
              <span className="col-span-8 text-xs font-medium text-slate-800">
                {matchedBundle?.targetInterval || matchedBundle?.description || "Every 10,000 KM or 3 Months"}
              </span>
            </div>

            <hr className="border-t border-slate-200/80" />

            <div className="grid grid-cols-12 gap-3 items-start">
              <span className="col-span-4 text-xs font-semibold text-slate-500">
                Checklist:
              </span>
              <div className="col-span-8 space-y-2">
                {checklistItems.map((itemStr, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs font-medium text-slate-700">
                    <div className="w-4 h-4 rounded border border-slate-300 bg-white shrink-0" />
                    <span>{itemStr}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5. METRICS: LAST SERVICE & LAST ODOMETER */}
          <div className="grid grid-cols-2 gap-4 py-1">
            {/* Last Service */}
            <div className="flex items-center gap-3">
              <Wrench className="w-6 h-6 text-slate-800 shrink-0" />
              <div className="min-w-0">
                <span className="block text-[11px] font-semibold text-slate-500 leading-tight">
                  Last service
                </span>
                <span className="block text-sm font-bold text-slate-900 truncate">
                  {formatSocialDate(selectedJoDate)}
                </span>
              </div>
            </div>

            {/* Last Odometer */}
            <div className="flex items-center gap-3">
              <Gauge className="w-6 h-6 text-slate-800 shrink-0" />
              <div className="min-w-0">
                <span className="block text-[11px] font-semibold text-slate-500 leading-tight">
                  Last Odometer
                </span>
                <span className="block text-sm font-bold text-slate-900 truncate">
                  {formatKm(selectedJoOdo)}
                </span>
              </div>
            </div>
          </div>

          {/* 6. DUE ODOMETER */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-slate-400" />
              Due odometer
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formatNumberWithSpaces(targetOdometer)}
                onChange={(e) => {
                  const raw = parseInt(e.target.value.replace(/[^\d]/g, "")) || 0;
                  setTargetOdometer(raw);
                }}
                className="w-full px-3.5 py-2.5 pr-12 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
              />
              <span className="absolute right-3.5 top-2.5 text-xs text-slate-400">Km</span>
            </div>
          </div>

          {/* 7. NEXT SCHEDULE */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Next schedule
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                value={formatDateFriendly(targetDate)}
                onClick={() => {
                  const el = document.getElementById("drawer-target-date-picker");
                  if (el && 'showPicker' in el) (el as any).showPicker();
                }}
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all cursor-pointer"
              />
              <input
                id="drawer-target-date-picker"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="absolute right-3 opacity-0 w-6 h-6 cursor-pointer"
              />
              <Calendar className="w-4 h-4 text-slate-500 absolute right-3.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── DRAWER FOOTER (MATCHING SCREENSHOT 2 - NO EDIT BUTTON) ── */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {reminder.status !== "Done" && (
              <button
                type="button"
                onClick={handleSaveAndComplete}
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSaving ? "Saving..." : "Complete"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (confirm(`Are you sure you want to delete reminder for ${reminder.vehicleName}?`)) {
                  onDelete(reminder.id);
                  onClose();
                }
              }}
              className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition-all cursor-pointer"
              title="Delete Reminder"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};
