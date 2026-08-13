"use client";

import React, { useState, useMemo } from "react";
import { TailAdminLayout } from "@/components/TailAdminLayout";
import { useDevRole } from "@/context/DevRoleContext";
import {
  Users,
  Clock,
  CheckCircle2,
  Search,
  Wrench,
  Car,
  Laptop,
  ArrowRight,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "Admin" | "Front Desk" | "Mechanic" | "Car Owner";
  status: "ACTIVE" | "PENDING";
  associatedVehicle?: string;
  joinedDate: string;
}

export default function AdminUsersPage() {
  const { mockDataState } = useDevRole();

  // null = only show 4 flash cards by default
  const [activeCard, setActiveCard] = useState<"FRONT_DESK" | "MECHANIC" | "VEHICLES" | "APPLICANTS" | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [userList, setUserList] = useState<UserAccount[]>([
    {
      id: "USR-001",
      name: "Sir Keith",
      email: "admin@piveran.com",
      phone: "0917000001",
      role: "Admin",
      status: "ACTIVE",
      joinedDate: "Jan 10, 2026"
    },
    {
      id: "USR-002",
      name: "Sir Cedrick",
      email: "cedrick.manager@reyauto.com",
      phone: "0917111222",
      role: "Front Desk",
      status: "ACTIVE",
      joinedDate: "Feb 01, 2026"
    },
    {
      id: "USR-003",
      name: "Master Mechanic Mark",
      email: "mark.mechanic@reyauto.com",
      phone: "0918333444",
      role: "Mechanic",
      status: "ACTIVE",
      joinedDate: "Feb 15, 2026"
    },
    {
      id: "USR-004",
      name: "Ramon Garcia",
      email: "ramon.garage@reyauto.com",
      phone: "0918987654",
      role: "Mechanic",
      status: "ACTIVE",
      joinedDate: "Mar 01, 2026"
    },
    {
      id: "USR-005",
      name: "Mr. Tan",
      email: "mr.tan@gmail.com",
      phone: "0917555888",
      role: "Car Owner",
      associatedVehicle: "Mitsubishi Montero (NKM-4321)",
      status: "ACTIVE",
      joinedDate: "Feb 20, 2026"
    },
    {
      id: "USR-006",
      name: "Juan Dela Cruz",
      email: "juan.delacruz@gmail.com",
      phone: "0917888999",
      role: "Car Owner",
      associatedVehicle: "Toyota Vios (ABC-1234)",
      status: "ACTIVE",
      joinedDate: "Jan 25, 2026"
    },
    {
      id: "APP-101",
      name: "Cedrick Santos",
      email: "cedrick.new@gmail.com",
      phone: "0917123456",
      role: "Front Desk",
      status: "PENDING",
      joinedDate: "Submitted 10 mins ago"
    }
  ]);

  const frontDeskCount = userList.filter((i) => i.role === "Front Desk" && i.status === "ACTIVE").length;
  const mechanicsCount = userList.filter((i) => i.role === "Mechanic" && i.status === "ACTIVE").length;
  const vehiclesCount = userList.filter((i) => i.role === "Car Owner" && i.status === "ACTIVE").length;
  const applicantsCount = userList.filter((i) => i.status === "PENDING").length;

  const displayedUsers = useMemo(() => {
    if (mockDataState === "empty" || !activeCard) return [];

    return userList.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.associatedVehicle && item.associatedVehicle.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCard =
        (activeCard === "FRONT_DESK" && item.role === "Front Desk" && item.status === "ACTIVE") ||
        (activeCard === "MECHANIC" && item.role === "Mechanic" && item.status === "ACTIVE") ||
        (activeCard === "VEHICLES" && item.role === "Car Owner" && item.status === "ACTIVE") ||
        (activeCard === "APPLICANTS" && item.status === "PENDING");

      return matchesSearch && matchesCard;
    });
  }, [mockDataState, userList, searchTerm, activeCard]);

  const handleApprove = (id: string, name: string) => {
    setUserList(
      userList.map((i) => (i.id === id ? { ...i, status: "ACTIVE", joinedDate: "Just now" } : i))
    );
    triggerToast(`Approved account for ${name}`);
  };

  const handleDeactivate = (id: string, name: string) => {
    setUserList(userList.filter((i) => i.id !== id));
    triggerToast(`Deactivated account for ${name}`);
  };

  const cardTitleMap = {
    FRONT_DESK: "Front Desk Accounts",
    MECHANIC: "Garage Mechanics",
    VEHICLES: "Registered Vehicles & Car Owners",
    APPLICANTS: "Pending Signup Applications"
  };

  return (
    <TailAdminLayout userRole="Admin" userName="Sir Keith" userEmail="admin@piveran.com">
      <div className="space-y-5 font-sans">
        
        {/* 1. TOP TITLE HEADER SECTION */}
        <div className="border-b border-slate-200/80 pb-3">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            User Management
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Select a module card below to view and manage Front Desk staff, Mechanics, Vehicles, or Applicants
          </p>
        </div>

        {/* Toast Notification Alert */}
        {toastMessage && (
          <div className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 2. 4 FLASH CARDS GRID FOR EACH ROLE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Front Desk */}
          <div
            onClick={() => setActiveCard(activeCard === "FRONT_DESK" ? null : "FRONT_DESK")}
            className={`bg-white rounded-2xl border p-5 shadow-2xs space-y-4 cursor-pointer transition-all hover:shadow-md ${
              activeCard === "FRONT_DESK"
                ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20"
                : "border-slate-200/90 hover:border-blue-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                <Laptop className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full">
                {frontDeskCount} Active
              </span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Front Desk</h3>
              <p className="text-xs text-slate-500 mt-0.5">Intake ops, billing & customer estimates</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-700">
              <span>{activeCard === "FRONT_DESK" ? "Close Table" : "Click to view table"}</span>
              <ArrowRight className={`w-3.5 h-3.5 transition-transform ${activeCard === "FRONT_DESK" ? "rotate-90" : ""}`} />
            </div>
          </div>

          {/* Card 2: Mechanics */}
          <div
            onClick={() => setActiveCard(activeCard === "MECHANIC" ? null : "MECHANIC")}
            className={`bg-white rounded-2xl border p-5 shadow-2xs space-y-4 cursor-pointer transition-all hover:shadow-md ${
              activeCard === "MECHANIC"
                ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20"
                : "border-slate-200/90 hover:border-emerald-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {mechanicsCount} Active
              </span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Mechanics</h3>
              <p className="text-xs text-slate-500 mt-0.5">Garage bay tablets & DVI inspection sheets</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
              <span>{activeCard === "MECHANIC" ? "Close Table" : "Click to view table"}</span>
              <ArrowRight className={`w-3.5 h-3.5 transition-transform ${activeCard === "MECHANIC" ? "rotate-90" : ""}`} />
            </div>
          </div>

          {/* Card 3: Vehicles */}
          <div
            onClick={() => setActiveCard(activeCard === "VEHICLES" ? null : "VEHICLES")}
            className={`bg-white rounded-2xl border p-5 shadow-2xs space-y-4 cursor-pointer transition-all hover:shadow-md ${
              activeCard === "VEHICLES"
                ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20"
                : "border-slate-200/90 hover:border-indigo-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                <Car className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                {vehiclesCount} Vehicles
              </span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Vehicles</h3>
              <p className="text-xs text-slate-500 mt-0.5">Registered car profiles & owner accounts</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-700">
              <span>{activeCard === "VEHICLES" ? "Close Table" : "Click to view table"}</span>
              <ArrowRight className={`w-3.5 h-3.5 transition-transform ${activeCard === "VEHICLES" ? "rotate-90" : ""}`} />
            </div>
          </div>

          {/* Card 4: Applicants */}
          <div
            onClick={() => setActiveCard(activeCard === "APPLICANTS" ? null : "APPLICANTS")}
            className={`bg-white rounded-2xl border p-5 shadow-2xs space-y-4 cursor-pointer transition-all hover:shadow-md ${
              activeCard === "APPLICANTS"
                ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20"
                : "border-slate-200/90 hover:border-amber-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                {applicantsCount} Pending
              </span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Applicants</h3>
              <p className="text-xs text-slate-500 mt-0.5">Incoming /signup requests for review</p>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-700">
              <span>{activeCard === "APPLICANTS" ? "Close Table" : "Click to view table"}</span>
              <ArrowRight className={`w-3.5 h-3.5 transition-transform ${activeCard === "APPLICANTS" ? "rotate-90" : ""}`} />
            </div>
          </div>

        </div>

        {/* 3. TABLE AREA (ONLY DISPLAYED WHEN A CARD IS CLICKED!) */}
        <AnimatePresence>
          {activeCard && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 pt-2"
            >
              {/* Header & Search for open table */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-sm font-extrabold text-slate-900">
                    {cardTitleMap[activeCard]} ({displayedUsers.length})
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search name or vehicle..."
                      className="bg-white border border-slate-200 rounded-xl py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 transition-all w-48 sm:w-60"
                    />
                  </div>

                  <button
                    onClick={() => setActiveCard(null)}
                    className="bg-white hover:bg-slate-200 text-slate-600 font-semibold text-xs px-3 py-1.5 rounded-xl border border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Close Table</span>
                  </button>
                </div>
              </div>

              {/* Clean Table */}
              <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="bg-slate-100/90 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 grid grid-cols-12 py-3 px-5 items-center">
                  <div className="col-span-4 sm:col-span-3">User Name</div>
                  <div className="col-span-3 sm:col-span-3">System Role</div>
                  <div className="col-span-3 sm:col-span-4">Contact & Vehicle Details</div>
                  <div className="col-span-2 sm:col-span-2 text-right">Status / Action</div>
                </div>

                {displayedUsers.length === 0 ? (
                  <div className="py-12 px-4 text-center space-y-3">
                    <Users className="w-8 h-8 text-slate-300 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-slate-900">
                        {mockDataState === "empty" ? "No users registered" : "No matching users found"}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {mockDataState === "empty"
                          ? "Your shop database currently has 0 registered users."
                          : `No users matched current search.`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {displayedUsers.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 py-3.5 px-5 items-center hover:bg-emerald-50/60 transition-colors"
                      >
                        
                        {/* User Name */}
                        <div className="col-span-4 sm:col-span-3 pr-2 font-medium text-slate-900">
                          {item.name}
                        </div>

                        {/* Role */}
                        <div className="col-span-3 sm:col-span-3 pr-2 text-slate-600 font-medium truncate">
                          {item.role}
                        </div>

                        {/* Contact & Vehicle Details */}
                        <div className="col-span-3 sm:col-span-4 pr-2 text-slate-500 font-normal">
                          <div>{item.email}</div>
                          {item.associatedVehicle && (
                            <div className="text-[11px] text-slate-400">{item.associatedVehicle}</div>
                          )}
                        </div>

                        {/* Status / Actions */}
                        <div className="col-span-2 sm:col-span-2 text-right flex items-center justify-end gap-3 text-xs">
                          {item.status === "ACTIVE" ? (
                            <>
                              <span className="text-emerald-700 font-medium">Active</span>
                              {item.role !== "Admin" && (
                                <button
                                  onClick={() => handleDeactivate(item.id, item.name)}
                                  className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                >
                                  Remove
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="text-amber-700 font-medium">Pending</span>
                              <button
                                onClick={() => handleApprove(item.id, item.name)}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                              >
                                Approve
                              </button>
                            </>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </section>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </TailAdminLayout>
  );
}
