"use client";

import React, { useState, useEffect } from "react";
import { TailAdminLayout } from "@/components/TailAdminLayout";
import { ReminderStats } from "./ReminderStats";
import { ReminderTable, ReminderItem } from "./ReminderTable";
import { ReminderModal } from "./ReminderModal";
import { apiService, subscribeToJobOrders } from "@/app/apiService";
import { Bell, Search, Plus } from "lucide-react";

export default function RemindersPage() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedReminder, setSelectedReminder] = useState<ReminderItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchReminders = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getReminders(filterStatus === "ALL" ? undefined : filterStatus);
      setReminders(data || []);
    } catch (e) {
      console.error("Failed to load reminders", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
    const unsubscribe = subscribeToJobOrders(() => {
      fetchReminders();
    });
    return () => unsubscribe();
  }, [filterStatus]);

  const handleSaveReminder = async (id: string, updates: Partial<ReminderItem>) => {
    try {
      await apiService.updateReminder(id, updates);
      await fetchReminders();
    } catch (e) {
      console.error("Failed to update reminder", e);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (confirm("Are you sure you want to delete this reminder?")) {
      try {
        await apiService.deleteReminder(id);
        await fetchReminders();
      } catch (e) {
        console.error("Failed to delete reminder", e);
      }
    }
  };

  const filteredReminders = reminders.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.vehicleName && r.vehicleName.toLowerCase().includes(q)) ||
      (r.plateNumber && r.plateNumber.toLowerCase().includes(q)) ||
      (r.ownerName && r.ownerName.toLowerCase().includes(q)) ||
      (r.ownerPhone && r.ownerPhone.toLowerCase().includes(q))
    );
  });

  const totalCount = reminders.length;
  const pendingCount = reminders.filter((r) => r.status === "Pending").length;
  const dueCount = reminders.filter((r) => r.status === "Due").length;
  const overdueCount = reminders.filter((r) => r.status === "Overdue").length;
  const doneCount = reminders.filter((r) => r.status === "Done").length;

  return (
    <TailAdminLayout userRole="FrontDesk">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              Maintenance Reminders
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track vehicle PMS service due dates auto-calculated upon job completion.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <ReminderStats
          total={totalCount}
          pending={pendingCount}
          due={dueCount}
          overdue={overdueCount}
          done={doneCount}
          activeFilter={filterStatus}
          onFilterChange={setFilterStatus}
        />

        {/* Search Bar & Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search vehicle, plate, owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
            />
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Showing {filteredReminders.length} of {totalCount} records
          </div>
        </div>

        {/* Table */}
        <ReminderTable
          reminders={filteredReminders}
          onEdit={(r) => {
            setSelectedReminder(r);
            setIsModalOpen(true);
          }}
          onDelete={handleDeleteReminder}
          isLoading={isLoading}
        />

        {/* Edit Modal */}
        <ReminderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          reminder={selectedReminder}
          onSave={handleSaveReminder}
        />
      </div>
    </TailAdminLayout>
  );
}
