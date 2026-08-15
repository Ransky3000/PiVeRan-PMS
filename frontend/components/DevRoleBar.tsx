"use client";

import React, { useState } from "react";
import { useDevRole, RoleType } from "@/context/DevRoleContext";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  ChevronDown,
  ExternalLink,
  Eye,
  Minimize2,
  Maximize2,
  Sparkles,
  UserCheck,
  Monitor,
  Smartphone,
  CheckCircle2,
  Key,
  X,
  Compass
} from "lucide-react";

const QUICK_ROUTES = [
  { group: "Auth & Public", label: "Sign In", href: "/login" },
  { group: "Auth & Public", label: "Staff Sign Up", href: "/signup" },
  { group: "Auth & Public", label: "Pending Approval", href: "/pending-approval" },
  { group: "Admin Role", label: "Admin Analytics", href: "/admin/analytics" },
  { group: "Admin Role", label: "User Approvals", href: "/admin/users" },
  { group: "Front Desk Role", label: "Bundle Catalog", href: "/frontdesk/bundles" },
  { group: "Front Desk Role", label: "Materials Inventory", href: "/frontdesk/materials" },
  { group: "Front Desk Role", label: "Job Order", href: "/frontdesk/job-orders" },
  { group: "Front Desk Role", label: "Vehicle", href: "/frontdesk/vehicles" },
  { group: "Front Desk Role", label: "Owner", href: "/frontdesk/owners" },
  { group: "Front Desk Role", label: "Mechanic", href: "/frontdesk/mechanics" },
  { group: "Mechanic Role", label: "Garage Bay Job Board", href: "/mechanic/job-board" },
  { group: "Mechanic Role", label: "DVI Inspection Sheet", href: "/mechanic/dvi" },
  { group: "Customer Portal", label: "Web Approval Portal", href: "/customer/approve/demo" },
];

export function DevRoleBar() {
  const { activeRole, currentProfile, switchRoleAndNavigate, mockDataState, setMockDataState } = useDevRole();
  const pathname = usePathname();
  const router = useRouter();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const rolesList: { type: RoleType; icon: React.ElementType; label: string }[] = [
    { type: "Admin", icon: ShieldAlert, label: "👑 Admin" },
    { type: "FrontDesk", icon: Monitor, label: "🖥️ Front Desk" },
    { type: "Mechanic", icon: Smartphone, label: "📱 Mechanic" },
    { type: "Customer", icon: UserCheck, label: "📲 Customer" },
    { type: "Public", icon: Key, label: "🔑 Public" },
  ];

  // MINIMIZED FLOATING BADGE (BOTTOM-RIGHT CORNER)
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 font-sans text-xs">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2.5 bg-slate-900/95 hover:bg-slate-950 text-slate-100 px-4 py-2.5 rounded-2xl shadow-2xl border border-emerald-500/40 backdrop-blur-xl font-bold tracking-wide transition-all hover:scale-105 cursor-pointer ring-2 ring-emerald-500/20 group"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Role View: <strong className="text-emerald-400 font-extrabold">{currentProfile.avatarBadge}</strong></span>
          <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 font-sans text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
      {/* FLOATING CARD CONTAINER (BOTTOM-RIGHT CORNER) */}
      <div className="bg-slate-950/95 text-slate-100 border border-slate-800 shadow-2xl rounded-2xl p-4 backdrop-blur-xl space-y-3.5 ring-1 ring-slate-800/80">
        
        {/* HEADER BAR */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <div className="font-extrabold text-white text-xs tracking-tight">Mockup Role Controller</div>
              <div className="text-[10px] text-slate-400 truncate">
                Active: <strong className="text-emerald-400">{currentProfile.name}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsMinimized(true)}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Minimize to Corner"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>

        {/* ROLE SELECTOR GRID */}
        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span>Select Perspective</span>
            <span className="text-emerald-400 font-normal">{currentProfile.avatarBadge}</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {rolesList.map((r) => {
              const isActive = activeRole === r.type;
              return (
                <button
                  key={r.type}
                  onClick={() => switchRoleAndNavigate(r.type)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    isActive
                      ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950/50 font-bold"
                      : "bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                  } ${r.type === "Public" ? "col-span-2" : ""}`}
                >
                  <span className="truncate">{r.label}</span>
                  {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* MOCK DATA STATE SWITCHER */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Simulated Data Mode</span>
            <span className={mockDataState === "empty" ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
              {mockDataState === "empty" ? "📭 Empty State" : "📊 Populated"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setMockDataState("populated")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mockDataState === "populated"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              📊 Populated
            </button>
            <button
              onClick={() => setMockDataState("empty")}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mockDataState === "empty"
                  ? "bg-amber-600 text-white shadow-xs font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              📭 Empty (0 Records)
            </button>
          </div>
        </div>

        {/* QUICK JUMP DROPDOWN MENU */}
        <div className="pt-1 border-t border-slate-800/80">
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-full flex items-center justify-between bg-slate-900 hover:bg-slate-800/80 text-slate-200 hover:text-white px-3 py-2 rounded-xl border border-slate-800 text-xs font-semibold transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>Quick Jump Page View</span>
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {isMenuOpen && (
              <div className="absolute bottom-full mb-2 right-0 w-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 max-h-72 overflow-y-auto p-2 text-slate-200 backdrop-blur-xl divide-y divide-slate-800">
                {Array.from(new Set(QUICK_ROUTES.map((r) => r.group))).map((group) => (
                  <div key={group} className="py-1">
                    <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-emerald-400 font-extrabold">
                      {group}
                    </div>
                    {QUICK_ROUTES.filter((r) => r.group === group).map((route) => {
                      const isCurrent = pathname === route.href;
                      return (
                        <button
                          key={route.href}
                          onClick={() => {
                            router.push(route.href);
                            setIsMenuOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isCurrent
                              ? "bg-emerald-500/20 text-emerald-300 font-bold"
                              : "hover:bg-slate-800/70 text-slate-300 hover:text-white"
                          }`}
                        >
                          <span className="truncate">{route.label}</span>
                          {isCurrent ? (
                            <span className="text-[10px] text-emerald-400 font-mono shrink-0 ml-1">active</span>
                          ) : (
                            <ExternalLink className="w-3 h-3 opacity-40 shrink-0 ml-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
