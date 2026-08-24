"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Gauge, FileText, Car } from "lucide-react";
import { ReminderItem } from "./ReminderTable";
import { apiService } from "@/app/apiService";

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
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [targetOdometer, setTargetOdometer] = useState<number>(10000);
  const [status, setStatus] = useState<"Pending" | "Due" | "Overdue" | "Done">("Pending");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && !reminder) {
      // Fetch vehicles for manual creation dropdown
      apiService.getVehicles().then((data) => {
        setVehicles(data || []);
        if (data && data.length > 0) {
          setSelectedVehicleId(data[0].id);
        }
      }).catch(console.error);

      // Default date to 6 months from now
      const defaultDt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
      const yyyy = defaultDt.getFullYear();
      const mm = String(defaultDt.getMonth() + 1).padStart(2, "0");
      const dd = String(defaultDt.getDate()).padStart(2, "0");
      setTargetDate(`${yyyy}-${mm}-${dd}`);
      setTargetOdometer(10000);
      setStatus("Pending");
      setNotes("");
    } else if (reminder) {
      if (reminder.targetDate) {
        const d = new Date(reminder.targetDate);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        setTargetDate(`${yyyy}-${mm}-${dd}`);
      } else {
        setTargetDate("");
      }
      setTargetOdometer(reminder.targetOdometer || 10000);
      setStatus(reminder.status || "Pending");
      setNotes(reminder.notes || "");
    }
  }, [isOpen, reminder]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (reminder) {
        await onSave(reminder.id, {
          targetDate: new Date(targetDate).toISOString(),
          targetOdometer: Number(targetOdometer),
          status,
          notes
        });
      } else if (onCreate) {
        const vObj = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
        await onCreate({
          vehicleId: vObj ? vObj.id : "",
          ownerId: vObj ? vObj.owner_id || vObj.ownerId || "" : "",
          startDate: new Date().toISOString(),
          targetDate: new Date(targetDate).toISOString(),
          startOdometer: vObj ? vObj.odometer || 0 : 0,
          targetOdometer: Number(targetOdometer),
          status,
          notes
        });
      }
      onClose();
    } catch (err) {
      console.error("Failed to save reminder", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statuses: ("Pending" | "Due" | "Overdue" | "Done")[] = ["Pending", "Due", "Overdue", "Done"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {reminder ? "Edit Maintenance Reminder" : "Create New Maintenance Reminder"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {reminder
                ? `${reminder.vehicleName} (${reminder.plateNumber}) • ${reminder.ownerName}`
                : "Schedule a future maintenance reminder for a customer vehicle"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!reminder && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-slate-400" />
                Select Vehicle
              </label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make || v.model || "Vehicle"} ({v.plate_number || v.plate || "No Plate"}) - {v.owner_name || "Owner"}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Target Due Date (Triggers Notification)
            </label>
            <input
              type="date"
              required
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-slate-400" />
              Target Odometer (Informational Reference)
            </label>
            <div className="relative">
              <input
                type="number"
                required
                value={targetOdometer}
                onChange={(e) => setTargetOdometer(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-400">KM</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <div className="grid grid-cols-4 gap-2">
              {statuses.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    status === s
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Outreach Notes / History
            </label>
            <textarea
              rows={3}
              placeholder="Record notes from customer phone call or follow-up status..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
            />
          </div>

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
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : reminder ? "Save Reminder" : "Create Reminder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
