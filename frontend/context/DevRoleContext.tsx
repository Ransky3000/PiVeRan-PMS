"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export type RoleType = "Developer" | "Admin" | "FrontDesk" | "Mechanic" | "Customer" | "Public";

export interface RoleProfile {
  role: RoleType;
  name: string;
  email: string;
  title: string;
  avatarBadge: string;
  defaultRoute: string;
}

export const ROLE_PROFILES: Record<RoleType, RoleProfile> = {
  Developer: {
    role: "Developer",
    name: "System Developer",
    email: "dev@piveran.com",
    title: "System Engineer",
    avatarBadge: "🛠️ Developer",
    defaultRoute: "/mechanic/job-board",
  },
  Admin: {
    role: "Admin",
    name: "System Administrator",
    email: "admin@piveran.com",
    title: "System Owner",
    avatarBadge: "👑 Admin",
    defaultRoute: "/admin/analytics",
  },
  FrontDesk: {
    role: "FrontDesk",
    name: "Front Desk Staff",
    email: "frontdesk@piveran.com",
    title: "Front Desk Manager",
    avatarBadge: "🖥️ Front Desk",
    defaultRoute: "/frontdesk/job-orders",
  },
  Mechanic: {
    role: "Mechanic",
    name: "Staff Mechanic",
    email: "mechanic@piveran.com",
    title: "Mechanic",
    avatarBadge: "📱 Mechanic",
    defaultRoute: "/mechanic/job-board",
  },
  Customer: {
    role: "Customer",
    name: "Vehicle Owner",
    email: "owner@piveran.com",
    title: "Vehicle Owner",
    avatarBadge: "📲 Customer",
    defaultRoute: "/customer/approve/demo",
  },
  Public: {
    role: "Public",
    name: "Guest User",
    email: "public@piveran.com",
    title: "Public / Unauthenticated",
    avatarBadge: "🔑 Public",
    defaultRoute: "/login",
  },
};

export interface ImpersonatedAccount {
  user_id?: string;
  name: string;
  email: string;
  role: string;
}

interface DevRoleContextType {
  activeRole: RoleType;
  currentProfile: RoleProfile;
  setRole: (role: RoleType) => void;
  switchRoleAndNavigate: (role: RoleType) => void;
  isDevBarVisible: boolean;
  toggleDevBar: () => void;
  impersonatedMechanic: string | null;
  setImpersonatedMechanic: (name: string | null) => void;
  impersonatedAccount: ImpersonatedAccount | null;
  setImpersonatedAccount: (account: ImpersonatedAccount | null) => void;
}

const DevRoleContext = createContext<DevRoleContextType | undefined>(undefined);

export function DevRoleProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRoleState] = useState<RoleType>("Developer");
  const [isDevBarVisible, setIsDevBarVisible] = useState(true);
  const [impersonatedMechanic, setImpersonatedMechanicState] = useState<string | null>(null);
  const [impersonatedAccount, setImpersonatedAccountState] = useState<ImpersonatedAccount | null>(null);
  const router = useRouter();

  useEffect(() => {
    const savedRole = localStorage.getItem("piveran_dev_role") as RoleType | null;
    if (savedRole && ROLE_PROFILES[savedRole]) {
      setActiveRoleState(savedRole);
    }
    const savedMech = localStorage.getItem("piveran_impersonated_mech");
    if (savedMech) {
      setImpersonatedMechanicState(savedMech);
    }
    const savedAccountStr = localStorage.getItem("piveran_impersonated_account");
    if (savedAccountStr) {
      try {
        setImpersonatedAccountState(JSON.parse(savedAccountStr));
      } catch (e) {}
    }
  }, []);

  const setRole = (role: RoleType) => {
    setActiveRoleState(role);
    localStorage.setItem("piveran_dev_role", role);
  };

  const setImpersonatedMechanic = (name: string | null) => {
    setImpersonatedMechanicState(name);
    if (name) {
      localStorage.setItem("piveran_impersonated_mech", name);
    } else {
      localStorage.removeItem("piveran_impersonated_mech");
    }
  };

  const setImpersonatedAccount = (account: ImpersonatedAccount | null) => {
    setImpersonatedAccountState(account);
    if (account) {
      localStorage.setItem("piveran_impersonated_account", JSON.stringify(account));
    } else {
      localStorage.removeItem("piveran_impersonated_account");
    }
  };

  const switchRoleAndNavigate = (role: RoleType) => {
    setRole(role);
    setImpersonatedAccount(null);
    setImpersonatedMechanic(null);
    const targetRoute = ROLE_PROFILES[role].defaultRoute;
    router.push(targetRoute);
  };

  const toggleDevBar = () => {
    setIsDevBarVisible((prev) => !prev);
  };

  const baseProfile = ROLE_PROFILES[activeRole];
  const currentProfile: RoleProfile = impersonatedAccount
    ? {
        ...baseProfile,
        name: impersonatedAccount.name,
        email: impersonatedAccount.email,
      }
    : baseProfile;

  return (
    <DevRoleContext.Provider
      value={{
        activeRole,
        currentProfile,
        setRole,
        switchRoleAndNavigate,
        isDevBarVisible,
        toggleDevBar,
        impersonatedMechanic,
        setImpersonatedMechanic,
        impersonatedAccount,
        setImpersonatedAccount,
      }}
    >
      {children}
    </DevRoleContext.Provider>
  );
}

export function useDevRole() {
  const context = useContext(DevRoleContext);
  if (!context) {
    throw new Error("useDevRole must be used within a DevRoleProvider");
  }
  return context;
}
