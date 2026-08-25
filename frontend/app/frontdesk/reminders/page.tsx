"use client";

import React, { useState, useEffect } from "react";
import { TailAdminLayout } from "@/components/TailAdminLayout";
import { useDevRole } from "@/context/DevRoleContext";
import { ReminderTable, ReminderItem } from "./ReminderTable";
import { ReminderModal } from "./ReminderModal";
import { ReminderDrawer } from "./ReminderDrawer";
import { apiService, subscribeToJobOrders } from "@/app/apiService";
import { Search, Plus, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RemindersPage() {
  const devContext = useDevRole();
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("PENDING");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedReminder, setSelectedReminder] = useState<ReminderItem | null>(null);
  const [drawerReminder, setDrawerReminder] = useState<ReminderItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState<boolean>(true);

  const fetchReminders = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getReminders(filterStatus);
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

  const handleCreateReminder = async (newReminderData: any) => {
    try {
      await apiService.createReminder(newReminderData);
      await fetchReminders();
    } catch (e) {
      console.error("Failed to create reminder", e);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (confirm("Are you sure you want to delete this maintenance reminder?")) {
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

  const getStatusCount = (status: string) => {
    return reminders.filter((r) => r.status.toUpperCase() === status.toUpperCase()).length;
  };

  const statusTabs = [
    { id: "PENDING", label: "Pending" },
    { id: "DUE", label: "Due Soon" },
    { id: "OVERDUE", label: "Overdue" },
    { id: "DONE", label: "Completed" }
  ];

  return (
    <TailAdminLayout userRole={devContext.activeRole} userName={devContext.currentProfile.name} userEmail={devContext.currentProfile.email}>
      <div className="space-y-3">
        {/* TOP TITLE HEADER */}
        <motion.div
          animate={{ height: isHeaderVisible ? "auto" : 0, opacity: isHeaderVisible ? 1 : 0, marginBottom: isHeaderVisible ? 12 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="overflow-hidden border-b border-slate-200/80 pb-2.5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reminders</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Track vehicle PMS service due dates for PiVeRan PMS</p>
            </div>
            <div>
              <button
                onClick={() => {
                  setSelectedReminder(null);
                  setIsModalOpen(true);
                }}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Reminder</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* STICKY AREA: TAB PILLS & SEARCH BAR */}
        <div className="sticky top-0 z-30 bg-slate-50 pt-2 pb-0 border-b border-slate-200/90 shadow-2xs -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {statusTabs.map((tab) => {
                const isActive = filterStatus.toUpperCase() === tab.id;
                const count = getStatusCount(tab.id);
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilterStatus(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-800"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reminders..."
                  className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 transition-all w-44 sm:w-60 shadow-2xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CARDS CONTAINER */}
        <section className="mt-6">
          <ReminderTable
            reminders={filteredReminders}
            onSelectReminder={(r) => setDrawerReminder(r)}
            onEdit={(r) => {
              setSelectedReminder(r);
              setIsModalOpen(true);
            }}
            onDelete={handleDeleteReminder}
            isLoading={isLoading}
          />
        </section>

        {/* Edit / Create Modal */}
        <ReminderModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          reminder={selectedReminder}
          onSave={handleSaveReminder}
          onCreate={handleCreateReminder}
        />

        {/* REMINDER SIDE DRAWER */}
        <AnimatePresence>
          {drawerReminder && (
            <ReminderDrawer
              reminder={drawerReminder}
              onClose={() => setDrawerReminder(null)}
              onSave={handleSaveReminder}
              onDelete={handleDeleteReminder}
              onMarkCompleted={(r) => handleSaveReminder(r.id, { status: "Done" })}
            />
          )}
        </AnimatePresence>
      </div>
    </TailAdminLayout>
  );
}
