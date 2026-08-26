"use client";

import React, { useState, useEffect } from "react";
import { useDevRole, RoleType, ImpersonatedAccount } from "@/context/DevRoleContext";
import { usePathname, useRouter } from "next/navigation";
import { apiService } from "@/app/apiService";
import { UserAccount } from "@/app/types";
import {
  ShieldAlert,
  ChevronDown,
  ExternalLink,
  Minimize2,
  Maximize2,
  Sparkles,
  UserCheck,
  Monitor,
  Smartphone,
  CheckCircle2,
  Key,
  Compass,
  LogOut
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
  { group: "Customer Portal", label: "Web Approval Portal", href: "/customer/approve/demo" },
];

export function DevRoleBar() {
  const {
    activeRole,
    currentProfile,
    switchRoleAndNavigate,
    impersonatedMechanic,
    setImpersonatedMechanic,
    impersonatedAccount,
    setImpersonatedAccount,
  } = useDevRole();
  const pathname = usePathname();
  const router = useRouter();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Live Database Accounts (Zero Dummy Fallback Arrays)
  const [dbAccounts, setDbAccounts] = useState<UserAccount[]>([]);
  const [jobOrderMechanicNames, setJobOrderMechanicNames] = useState<string[]>([]);
  const [isLoadingDB, setIsLoadingDB] = useState<boolean>(false);

  useEffect(() => {
    const loadLiveDBAccounts = async () => {
      setIsLoadingDB(true);
      try {
        const users: UserAccount[] = await apiService.getUsers("APPROVED");
        setDbAccounts(users || []);

        const jobOrders = await apiService.getJobOrders();
        const joMechs = jobOrders.flatMap((j: any) => j.inchargeMechanics || []).filter(Boolean);
        setJobOrderMechanicNames(Array.from(new Set(joMechs)));
      } catch (err) {
        console.error("Failed to fetch live database users for DevRoleBar", err);
      } finally {
        setIsLoadingDB(false);
      }
    };
    loadLiveDBAccounts();
  }, []);

  const rolesList: { type: RoleType; icon: React.ElementType; label: string }[] = [
    { type: "Admin", icon: ShieldAlert, label: "👑 Admin" },
    { type: "FrontDesk", icon: Monitor, label: "🖥️ Front Desk" },
    { type: "Mechanic", icon: Smartphone, label: "📱 Mechanic" },
    { type: "Customer", icon: UserCheck, label: "📲 Customer" },
    { type: "Public", icon: Key, label: "🔑 Public" },
  ];

  // Derive active persona options based on selected role perspective
  const getPersonaOptions = () => {
    if (activeRole === "Admin") {
      return dbAccounts.filter((u) => u.role === "Admin" || u.role === "Developer");
    }
    if (activeRole === "FrontDesk") {
      return dbAccounts.filter((u) => u.role === "Front Desk");
    }
    if (activeRole === "Mechanic") {
      const mechAccounts = dbAccounts.filter((u) => u.role === "Mechanic");
      // Merge accounts with active inchargeMechanics names from JOs
      const existingNames = new Set(mechAccounts.map((a) => a.name));
      const extraMechs: UserAccount[] = jobOrderMechanicNames
        .filter((name) => !existingNames.has(name))
        .map((name) => ({
          user_id: name,
          name: name,
          email: `${name.toLowerCase().replace(/\s+/g, ".")}@piveran.com`,
          phone_number: "09170000000",
          role: "Mechanic",
          status: "APPROVED",
        }));
      return [...mechAccounts, ...extraMechs];
    }
    return [];
  };

  const personaOptions = getPersonaOptions();

  const handleSelectAccount = (selectedId: string) => {
    if (!selectedId) {
      setImpersonatedAccount(null);
      setImpersonatedMechanic(null);
      return;
    }
    const target = personaOptions.find((a) => a.user_id === selectedId || a.name === selectedId);
    if (target) {
      const accountData: ImpersonatedAccount = {
        user_id: target.user_id,
        name: target.name,
        email: target.email,
        role: target.role,
      };
      setImpersonatedAccount(accountData);
      if (activeRole === "Mechanic") {
        setImpersonatedMechanic(target.name);
      }
    }
  };

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
          {impersonatedAccount && (
            <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/30 font-semibold">
              [{impersonatedAccount.name}]
            </span>
          )}
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
              <div className="font-extrabold text-white text-xs tracking-tight">Dev Inspector Toolbar</div>
              <div className="text-[10px] text-slate-400 truncate">
                Active View: <strong className="text-emerald-400">{currentProfile.name}</strong>
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

        {/* MULTI-ROLE PERSONA IMPERSONATION SELECTOR */}
        {(activeRole === "Admin" || activeRole === "FrontDesk" || activeRole === "Mechanic") && (
          <div className="pt-2 border-t border-slate-800/80">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Inspect {activeRole} Account</span>
              <span className="text-emerald-400 font-bold">
                {impersonatedAccount ? impersonatedAccount.name : "Default View"}
              </span>
            </div>

            <select
              value={impersonatedAccount ? impersonatedAccount.user_id || impersonatedAccount.name : ""}
              onChange={(e) => handleSelectAccount(e.target.value)}
              disabled={isLoadingDB || personaOptions.length === 0}
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">🌐 Default Role View (General)</option>
              {isLoadingDB ? (
                <option disabled>Loading accounts from DB...</option>
              ) : personaOptions.length === 0 ? (
                <option disabled value="">(No registered accounts in DB)</option>
              ) : (
                personaOptions.map((acc) => (
                  <option key={acc.user_id || acc.name} value={acc.user_id || acc.name}>
                    👤 {acc.name} ({acc.email})
                  </option>
                ))
              )}
            </select>
          </div>
        )}

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

        {/* SIGN OUT ACTION */}
        <div className="pt-2 border-t border-slate-800/80">
          <button
            onClick={() => {
              setImpersonatedAccount(null);
              setImpersonatedMechanic(null);
              switchRoleAndNavigate("Public");
            }}
            className="w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out / Log Out</span>
          </button>
        </div>

      </div>
    </div>
  );
}
