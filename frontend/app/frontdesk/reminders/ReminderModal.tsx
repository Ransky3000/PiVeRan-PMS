"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Gauge, Car, Wrench, CheckSquare } from "lucide-react";
import { ReminderItem } from "./ReminderTable";
import { apiService } from "@/app/apiService";
import { CustomSelect, SelectOption } from "@/components/CustomSelect";

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminder: ReminderItem | null;
  onSave: (id: string, updates: Partial<ReminderItem>) => Promise<void>;
  onCreate?: (newReminder: any) => Promise<void>;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  reminder,
  onSave,
  onCreate
}) => {
  const [completedJobOrders, setCompletedJobOrders] = useState<any[]>([]);
  const [bundles, setBundles] = useState<any[]>([]);
  const [selectedJoId, setSelectedJoId] = useState("");
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [targetOdometer, setTargetOdometer] = useState<number>(10000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Social media style date formatting e.g. "August 24" (current year) or "August 24, 2025" (older years)
  const formatSocialDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
      if (isNaN(d.getTime())) return dateStr;
      const currentYear = new Date().getFullYear();
      const dateYear = d.getFullYear();
      if (dateYear === currentYear) {
        return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
      }
      return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    } catch (e) {
      return dateStr;
    }
  };

  const formatDateFriendly = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch (e) {
      return dateStr;
    }
  };

  // Digit formatting with space thousands separators (e.g. 20 000 Km)
  const formatNumberWithSpaces = (numVal?: number | string) => {
    if (numVal === undefined || numVal === null || numVal === "") return "0";
    const num = typeof numVal === "number" ? numVal : parseInt(String(numVal).replace(/[^\d]/g, "")) || 0;
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const formatKm = (kmVal?: number | string) => {
    return `${formatNumberWithSpaces(kmVal)} Km`;
  };

  const formatCurrency = (amountVal?: number | string) => {
    return `₱ ${formatNumberWithSpaces(amountVal)}`;
  };

  // Compute status based on target date and 7-day advance notice window
  const computeStatusFromDate = (targetDateStr: string, currentStatus?: string): "Pending" | "Due" | "Overdue" | "Done" => {
    if (currentStatus === "Done") return "Done";
    if (!targetDateStr) return "Pending";
    const target = new Date(targetDateStr).getTime();
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (now > target) return "Overdue";
    if (target - now <= sevenDaysMs) return "Due";
    return "Pending";
  };

  const calculateTargetInfo = (jo: any, serviceTypeStr: string, availableBundles: any[]) => {
    if (!jo) return;
    const matchedBundle = availableBundles.find(
      (b) => b.packageName && serviceTypeStr && b.packageName.toLowerCase() === serviceTypeStr.toLowerCase()
    );

    const intervalKm = matchedBundle?.intervalKm || 10000;
    const intervalMonths = matchedBundle?.intervalMonths || 6;

    const startOdo = parseInt(String(jo.odometer || "0").replace(/[^\d]/g, "")) || 0;
    setTargetOdometer(startOdo + intervalKm);

    let baseDate = new Date();
    const rawDate = jo.completedAt || jo.updatedAt || jo.createdAt;
    if (rawDate) {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) baseDate = parsed;
    }

    const calculatedTarget = new Date(baseDate.getTime());
    calculatedTarget.setMonth(calculatedTarget.getMonth() + intervalMonths);

    const yyyy = calculatedTarget.getFullYear();
    const mm = String(calculatedTarget.getMonth() + 1).padStart(2, "0");
    const dd = String(calculatedTarget.getDate()).padStart(2, "0");
    setTargetDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleSelectJobOrder = (joId: string, availableJobs: any[], availableBundles: any[]) => {
    setSelectedJoId(joId);
    const jo = availableJobs.find((j) => j.id === joId);
    if (!jo) return;

    const initialServiceType = jo.serviceType || (availableBundles[0]?.packageName || "Basic PMS");
    setSelectedServiceType(initialServiceType);
    calculateTargetInfo(jo, initialServiceType, availableBundles);
  };

  const handleServiceTypeChange = (newServiceType: string) => {
    setSelectedServiceType(newServiceType);
    const jo = completedJobOrders.find((j) => j.id === selectedJoId);
    if (jo) {
      calculateTargetInfo(jo, newServiceType, bundles);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    if (!reminder) {
      Promise.all([apiService.getJobOrders(), apiService.getBundles()])
        .then(([allJobs, allBundles]) => {
          const completed = (allJobs || []).filter((j: any) => j.status === "Job completed");
          setCompletedJobOrders(completed);
          setBundles(allBundles || []);

          if (completed.length > 0) {
            handleSelectJobOrder(completed[0].id, completed, allBundles || []);
          } else {
            setSelectedJoId("");
            setSelectedServiceType("");
            const defaultDt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
            const yyyy = defaultDt.getFullYear();
            const mm = String(defaultDt.getMonth() + 1).padStart(2, "0");
            const dd = String(defaultDt.getDate()).padStart(2, "0");
            setTargetDate(`${yyyy}-${mm}-${dd}`);
            setTargetOdometer(10000);
          }
        })
        .catch(console.error);
    } else {
      if (reminder.targetDate) {
        const d = new Date(reminder.targetDate);
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          setTargetDate(`${yyyy}-${mm}-${dd}`);
        } else {
          setTargetDate("");
        }
      } else {
        setTargetDate("");
      }
      setTargetOdometer(reminder.targetOdometer || 10000);
    }
  }, [isOpen, reminder]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const computedStatus = computeStatusFromDate(targetDate, reminder?.status);

      if (reminder) {
        await onSave(reminder.id, {
          targetDate: new Date(targetDate).toISOString(),
          targetOdometer: Number(targetOdometer),
          status: computedStatus
        });
      } else if (onCreate) {
        const joObj = completedJobOrders.find((j) => j.id === selectedJoId) || completedJobOrders[0];
        const startOdo = joObj ? parseInt(String(joObj.odometer || "0").replace(/[^\d]/g, "")) || 0 : 0;
        await onCreate({
          joId: joObj ? joObj.id : undefined,
          vehicleId: joObj ? joObj.vehicleId || "" : "",
          ownerId: joObj ? joObj.ownerId || "" : "",
          startDate: joObj?.updatedAt || new Date().toISOString(),
          targetDate: new Date(targetDate).toISOString(),
          startOdometer: startOdo,
          targetOdometer: Number(targetOdometer),
          status: computedStatus
        });
      }
      onClose();
    } catch (err) {
      console.error("Failed to save reminder", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Selected Job Order & Bundle object
  const selectedJo = completedJobOrders.find((j) => j.id === selectedJoId);
  const activeServiceType = selectedServiceType || selectedJo?.serviceType || "";
  const matchedBundle = bundles.find(
    (b) => b.packageName && activeServiceType && b.packageName.toLowerCase() === activeServiceType.toLowerCase()
  );

  const selectedJoOdo = selectedJo ? parseInt(String(selectedJo.odometer || "0").replace(/[^\d]/g, "")) || 0 : 0;
  const selectedJoDate = selectedJo ? (selectedJo.completedAt || selectedJo.updatedAt || selectedJo.createdAt) : "";

  // Vehicle option labels
  const jobSelectOptions: SelectOption[] = completedJobOrders.map((j) => {
    const vName = j.vehicleModel || (j.vehicle ? `${j.vehicle.year || ''} ${j.vehicle.make || ''} ${j.vehicle.model || ''}`.trim() : '') || "Vehicle";
    const plate = j.plateNumber || j.plate_number || j.vehicle?.plate_number || "No Plate";
    return {
      value: j.id,
      label: `${vName} | ${plate}`
    };
  });

  // Service type select options (from Job Order Add form)
  const serviceTypeOptions: SelectOption[] = (bundles || []).map((b) => ({
    value: b.packageName,
    label: b.packageName
  }));

  // Checklist items preview
  const checklistItems: string[] = selectedJo?.inspectionItems && selectedJo.inspectionItems.length > 0
    ? selectedJo.inspectionItems.map((item: any) => item.name || item.title || item.item_name || "Inspection Item")
    : matchedBundle?.servicesIncluded && matchedBundle.servicesIncluded.length > 0
    ? matchedBundle.servicesIncluded
    : ["Full ECU Scanning", "Diagnose", "Inspect Battery", "Replace Sparkplug", "Replace Air Filter"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {reminder ? "Edit Reminder" : "Create Reminder"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Wireframe Layout */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {!reminder ? (
            <>
              {/* 1. SELECT VEHICLE ON JOB COMPLETED */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-slate-400" />
                  Select Vehicle on Job Completed
                </label>
                {completedJobOrders.length > 0 ? (
                  <CustomSelect
                    options={jobSelectOptions}
                    value={selectedJoId}
                    onChange={(val) => handleSelectJobOrder(val, completedJobOrders, bundles)}
                    placeholder="Select completed job vehicle..."
                  />
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    No completed job orders available.
                  </div>
                )}
              </div>

              {/* 2. OWNER */}
              <div>
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                  Owner
                </span>
                <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {selectedJo?.ownerName || selectedJo?.customerName || "Juan Dela Cruz"}
                </h4>
              </div>

              {/* 3. SERVICE TYPE (SELECTABLE CUSTOM SELECT FROM JOB ORDER FORM) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Service type
                </label>
                <CustomSelect
                  options={serviceTypeOptions.length > 0 ? serviceTypeOptions : [{ value: activeServiceType, label: activeServiceType || "Basic PMS" }]}
                  value={activeServiceType}
                  onChange={handleServiceTypeChange}
                  placeholder="Select service type..."
                />
              </div>

              {/* 4. SERVICE DETAILS CARD BOX */}
              <div className="border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                <div>
                  <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Service description:
                  </span>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                    {matchedBundle?.targetInterval || matchedBundle?.description || "Every 10 000 Km or 6 Months"}
                    {matchedBundle?.packagePrice ? ` • ${formatCurrency(matchedBundle.packagePrice)}` : ""}
                  </p>
                </div>

                <hr className="border-t border-slate-200 dark:border-slate-700/60" />

                <div>
                  <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    Checklist:
                  </span>
                  <div className="space-y-1.5 pl-1">
                    {checklistItems.slice(0, 5).map((itemStr, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200">
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">{itemStr}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. METRICS: LAST SERVICE (SOCIAL MEDIA DATE) & LAST ODOMETER (SPACE DIGITS) */}
              <div className="grid grid-cols-2 gap-4 py-1">
                {/* Last Service */}
                <div className="flex items-center gap-3">
                  <Wrench className="w-6 h-6 text-slate-800 dark:text-slate-200 shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-[11px] font-semibold text-slate-500 leading-tight">
                      Last service
                    </span>
                    <span className="block text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {formatSocialDate(selectedJoDate)}
                    </span>
                  </div>
                </div>

                {/* Last Odometer */}
                <div className="flex items-center gap-3">
                  <Gauge className="w-6 h-6 text-slate-800 dark:text-slate-200 shrink-0" />
                  <div className="min-w-0">
                    <span className="block text-[11px] font-semibold text-slate-500 leading-tight">
                      Last Odometer
                    </span>
                    <span className="block text-sm font-bold text-slate-900 dark:text-slate-100 font-mono truncate">
                      {formatKm(selectedJoOdo)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* EDIT MODE HEADER SUMMARY */
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {reminder.vehicleName}
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Owner: {reminder.ownerName} | Plate no. {reminder.plateNumber}
              </p>
            </div>
          )}

          {/* 6. DUE ODOMETER (SPACE DIGIT DISPLAY) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
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
                className="w-full px-3.5 py-2.5 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-400">Km</span>
            </div>
          </div>

          {/* 7. NEXT SCHEDULE (FRIENDLY FORMATTED DATE DISPLAY) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Next schedule
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                value={formatDateFriendly(targetDate)}
                onClick={() => {
                  const el = document.getElementById("target-date-picker-input");
                  if (el && 'showPicker' in el) (el as any).showPicker();
                }}
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-all cursor-pointer"
              />
              <input
                id="target-date-picker-input"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="absolute right-3 opacity-0 w-6 h-6 cursor-pointer"
              />
              <Calendar className="w-4 h-4 text-slate-500 absolute right-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!reminder && completedJobOrders.length === 0)}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-all shadow-md shadow-emerald-700/20 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : reminder ? "Save Reminder" : "Create Reminder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
