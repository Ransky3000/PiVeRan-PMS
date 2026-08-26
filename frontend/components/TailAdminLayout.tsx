"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDevRole, RoleType, ROLE_PROFILES } from "@/context/DevRoleContext";
import { authService } from "@/app/apiService";
import {
  Flame,
  LayoutDashboard,
  Users,
  UserCog,
  Wrench,
  Package,
  Layers,
  Boxes,
  Settings,
  ClipboardList,
  Car,
  Receipt,
  Bell,
  CheckSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  Shield,
  Menu,
  X
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  roles: RoleType[];
}

const navItems: NavItem[] = [
  // ADMIN NAV ITEMS
  {
    label: "User Management",
    href: "/admin/users",
    icon: Users,
    badge: 1,
    roles: ["Admin"]
  },

  // FRONT DESK NAV ITEMS (Rearranged and Renamed)
  {
    label: "Job Order",
    href: "/frontdesk/job-orders",
    icon: ClipboardList,
    roles: ["FrontDesk"]
  },
  {
    label: "Vehicles",
    href: "/frontdesk/vehicles",
    icon: Car,
    roles: ["FrontDesk"]
  },
  {
    label: "Owner",
    href: "/frontdesk/owners",
    icon: User,
    roles: ["FrontDesk"]
  },
  {
    label: "Mechanics",
    href: "/frontdesk/mechanics",
    icon: UserCog,
    roles: ["FrontDesk"]
  },
  {
    label: "Bundle",
    href: "/frontdesk/bundles",
    icon: Layers,
    roles: ["FrontDesk"]
  },
  {
    label: "Materials",
    href: "/frontdesk/materials",
    icon: Boxes,
    roles: ["FrontDesk"]
  },
  {
    label: "Reminders",
    href: "/frontdesk/reminders",
    icon: Bell,
    roles: ["FrontDesk"]
  },

  // MECHANIC NAV ITEMS
  {
    label: "Job Board",
    href: "/mechanic/job-board",
    icon: ClipboardList,
    roles: ["Mechanic"]
  }
];

interface TailAdminLayoutProps {
  children: React.ReactNode;
  userRole?: RoleType;
  userName?: string;
  userEmail?: string;
}

export function TailAdminLayout({
  children,
  userRole: propRole,
  userName: propName,
  userEmail: propEmail
}: TailAdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const devContext = useDevRole();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const activeRole = propRole || devContext.activeRole || (currentUser
    ? (currentUser.role === "Front Desk" ? "FrontDesk" : currentUser.role)
    : "Public");

  const impersonated = devContext.impersonatedAccount;
  const userName = impersonated?.name || (currentUser ? currentUser.name : (devContext.currentProfile?.name || propName));
  const userEmail = impersonated?.email || (currentUser ? currentUser.email : (devContext.currentProfile?.email || propEmail));
  const userTitle = impersonated ? impersonated.role : (currentUser ? (currentUser.role === "Front Desk" ? "Front Desk Manager" : currentUser.role === "Mechanic" ? "Mechanic" : "System Owner") : (devContext.currentProfile?.title || ""));
  const avatarBadge = devContext.currentProfile?.avatarBadge || "";

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Filter navigation items by role
  const allowedNavItems = navItems.filter((item) => item.roles.includes(activeRole));

  return (
    <div className="min-h-screen bg-slate-100/60 font-sans text-slate-900 flex antialiased">
      
      {/* MOBILE OVERLAY BACKDROP */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      {/* TAILADMIN COLLAPSIBLE LEFT SIDEBAR (STICKY FIXED SCREEN HEIGHT) */}
      <aside
        className={`sticky top-0 h-screen z-40 bg-slate-900 text-white flex flex-col justify-between transition-all duration-300 shrink-0 shadow-xl ${
          isSidebarCollapsed ? "w-20" : "w-64"
        } ${isMobileOpen ? "translate-x-0 fixed inset-y-0 left-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div>
          
          {/* SIDEBAR BRAND HEADER */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-md">
                <Flame className="w-5 h-5 text-white fill-white" />
              </div>
              {!isSidebarCollapsed && (
                <div className="truncate">
                  <div className="font-extrabold text-white text-base tracking-tight leading-none truncate">
                    PiVeRan PMS
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase mt-0.5 truncate">
                    Rey Auto Repair
                  </div>
                </div>
              )}
            </div>

            {/* Collapse Toggle Button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* ROLE BADGE BANNER */}
          {!isSidebarCollapsed && (
            <div className="p-3 mx-3 my-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">ACTIVE ROLE</div>
              <div className="text-xs font-bold text-white truncate mt-0.5">
                {userTitle}
              </div>
            </div>
          )}



          {/* SIDEBAR NAVIGATION ITEMS (RBAC FILTERED) */}
          <nav className="p-3 space-y-1">
            {allowedNavItems.length === 0 && !isSidebarCollapsed && (
              <div className="p-3 text-[11px] text-slate-400 bg-slate-800/40 rounded-xl border border-slate-800 text-center leading-relaxed">
                No internal sidebar views for <strong>{avatarBadge}</strong>. Use the top Dev Controller bar to switch role perspectives.
              </div>
            )}
            {allowedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all relative group ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
                  
                  {!isSidebarCollapsed && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}

                  {/* Notification Badge */}
                  {item.badge && !isSidebarCollapsed && (
                    <span className="bg-amber-500 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

        </div>

        {/* SIDEBAR FOOTER USER CARD */}
        <div className="p-3 border-t border-slate-800">
          <div className={`flex items-center justify-between ${isSidebarCollapsed ? "justify-center" : ""}`}>
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {userName.substring(0, 2).toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">{userName}</div>
                  <div className="text-[10px] text-slate-400 truncate">{userEmail}</div>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                authService.clearSession();
                router.push("/login");
              }}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP COMMAND HEADER BAR */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          
          {/* Mobile Sidebar Toggle & Search */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search */}
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search vehicles, job orders, parts..."
                className="w-64 bg-slate-100/70 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:bg-white transition-all"
              />
            </div>
          </div>



        </header>

        {/* CONTENT PAGE CHILD */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {children}
        </main>

      </div>

    </div>
  );
}
