"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { TailAdminLayout } from "@/components/TailAdminLayout";
import { useDevRole } from "@/context/DevRoleContext";
import {
  Users,
  Clock,
  CheckCircle2,
  Search,
  Plus,
  Trash2,
  Check,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiService } from "../../apiService";

interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "Admin" | "Front Desk" | "Mechanic";
  status: "ACTIVE" | "PENDING";
  joinedDate: string;
}

function mapBackendUserToFrontend(user: any): UserAccount {
  return {
    id: user.user_id,
    name: user.name,
    email: user.email,
    phone: user.phone_number,
    role: user.role,
    status: user.status === "APPROVED" ? "ACTIVE" : user.status,
    joinedDate: new Date(user.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  };
}

export default function AdminUsersPage() {
  const { mockDataState } = useDevRole();
  const [activeTab, setActiveTab] = useState<"APPLICANTS" | "ACTIVE_STAFF">("APPLICANTS");
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [userList, setUserList] = useState<UserAccount[]>([]);

  useEffect(() => {
    async function loadUsers() {
      try {
        const users = await apiService.getUsers();
        setUserList(users.map(mapBackendUserToFrontend));
      } catch (err) {
        console.error("Failed to load users from backend", err);
      }
    }
    loadUsers();
  }, []);

  useEffect(() => {
    const mainElement = document.querySelector("main");
    if (!mainElement) return;

    const handleScroll = () => {
      const currentScrollY = mainElement.scrollTop;
      if (currentScrollY > 50) {
        if (currentScrollY > lastScrollY.current + 5) {
          setIsHeaderVisible(false);
        } else if (currentScrollY < lastScrollY.current - 5) {
          setIsHeaderVisible(true);
        }
      } else {
        setIsHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    mainElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => mainElement.removeEventListener("scroll", handleScroll);
  }, []);

  const applicantsCount = userList.filter((i) => i.status === "PENDING").length;
  const activeStaffCount = userList.filter((i) => i.status === "ACTIVE" && i.role !== "Admin").length;

  const displayedUsers = useMemo(() => {
    if (mockDataState === "empty") return [];

    return userList.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTab =
        activeTab === "APPLICANTS"
          ? item.status === "PENDING"
          : item.status === "ACTIVE" && item.role !== "Admin";

      return matchesSearch && matchesTab;
    });
  }, [mockDataState, userList, searchTerm, activeTab]);

  const handleApprove = async (id: string, name: string) => {
    try {
      await apiService.updateUserStatus(id, "APPROVED");
      setUserList(
        userList.map((i) => (i.id === id ? { ...i, status: "ACTIVE", joinedDate: "Just now" } : i))
      );
      triggerToast(`Approved account for ${name}`);
    } catch (err: any) {
      triggerToast(err.message || "Failed to approve user.");
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    try {
      await apiService.updateUserStatus(id, "REJECTED");
      setUserList(userList.filter((i) => i.id !== id));
      triggerToast(`Deactivated account for ${name}`);
    } catch (err: any) {
      triggerToast(err.message || "Failed to update user.");
    }
  };

  return (
    <TailAdminLayout userRole="Admin" userName="Sir Keith" userEmail="admin@piveran.com">
      <div className="space-y-3 font-sans">
        
        {/* 1. TOP TITLE HEADER SECTION */}
        <motion.div
          animate={{
            height: isHeaderVisible ? "auto" : 0,
            opacity: isHeaderVisible ? 1 : 0,
            marginBottom: isHeaderVisible ? 12 : 0
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="overflow-hidden border-b border-slate-200/80 pb-2.5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                User Management
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Approve pending staff registration requests and manage active staff accounts
              </p>
            </div>
          </div>
        </motion.div>

        {/* Toast Notification Alert */}
        {toastMessage && (
          <div className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 2. FIXED STICKY AREA: TAB BAR + FILTERS */}
        <div className="sticky top-0 z-30 bg-slate-50 pt-2 pb-0 border-b border-slate-200/90 shadow-2xs -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 transition-all">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
            
            {/* Tab Selection */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("APPLICANTS")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "APPLICANTS"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Applicants ({applicantsCount})</span>
              </button>

              <button
                onClick={() => setActiveTab("ACTIVE_STAFF")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "ACTIVE_STAFF"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Active Staff ({activeStaffCount})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name or email..."
                  className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 transition-all w-44 sm:w-60 shadow-2xs"
                />
              </div>
            </div>

          </div>

          {/* TABLE HEADERS */}
          <div className="bg-slate-100/90 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 grid grid-cols-12 py-3 px-5 items-center mt-2 rounded-t-xl">
            <div className="col-span-3">Name</div>
            <div className="col-span-3">Email Address</div>
            <div className="col-span-2">Phone Number</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

        </div>

        {/* 3. DATA ROWS AREA */}
        <section className="bg-white rounded-b-2xl border border-slate-200 border-t-0 shadow-2xs">
          {displayedUsers.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-900">
                  {activeTab === "APPLICANTS" ? "No pending applications" : "No active staff found"}
                </h4>
                <p className="text-xs text-slate-400">
                  {searchTerm ? `No matches found for "${searchTerm}"` : ""}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {displayedUsers.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 py-3.5 px-5 items-center hover:bg-emerald-50/40 transition-colors group"
                >
                  {/* Name */}
                  <div className="col-span-3 pr-2 font-medium text-slate-900">
                    {item.name}
                  </div>

                  {/* Email */}
                  <div className="col-span-3 pr-2 text-slate-600 font-normal truncate">
                    {item.email}
                  </div>

                  {/* Phone */}
                  <div className="col-span-2 text-slate-700 font-medium">
                    {item.phone}
                  </div>

                  {/* Role Badge */}
                  <div className="col-span-2 pr-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      item.role === "Front Desk"
                        ? "bg-blue-50 border-blue-200 text-blue-800"
                        : "bg-emerald-50 border-emerald-200 text-emerald-800"
                    }`}>
                      {item.role}
                    </span>
                  </div>

                  {/* Actions column */}
                  <div className="col-span-2 text-right flex items-center justify-end gap-2">
                    {item.status === "PENDING" ? (
                      <>
                        <button
                          onClick={() => handleApprove(item.id, item.name)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-1.5 rounded-lg transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                          title="Approve Applicant"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeactivate(item.id, item.name)}
                          className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold p-1.5 rounded-lg transition-all cursor-pointer"
                          title="Decline/Delete Application"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleDeactivate(item.id, item.name)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition-all cursor-pointer"
                        title="Deactivate Staff"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </TailAdminLayout>
  );
}
