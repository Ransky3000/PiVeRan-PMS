"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export type RoleType = "Developer" | "Admin" | "FrontDesk" | "Mechanic" | "Customer" | "Public";
export type MockDataState = "populated" | "empty";

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
    name: "Developer Admin",
    email: "dev@piveran.com",
    title: "System Engineer",
    avatarBadge: "🛠️ Developer",
    defaultRoute: "/mechanic/job-board",
  },
  Admin: {
    role: "Admin",
    name: "Sir Keith",
    email: "admin@piveran.com",
    title: "System Owner",
    avatarBadge: "👑 Admin",
    defaultRoute: "/admin/analytics",
  },
  FrontDesk: {
    role: "FrontDesk",
    name: "Sir Cedrick",
    email: "frontdesk@piveran.com",
    title: "Front Desk Manager",
    avatarBadge: "🖥️ Front Desk",
    defaultRoute: "/frontdesk/job-orders",
  },
  Mechanic: {
    role: "Mechanic",
    name: "Bay Tablet #1",
    email: "mechanic@piveran.com",
    title: "Service Technician",
    avatarBadge: "📱 Mechanic",
    defaultRoute: "/mechanic/job-board",
  },
  Customer: {
    role: "Customer",
    name: "Car Owner Preview",
    email: "customer@gmail.com",
    title: "Vehicle Owner",
    avatarBadge: "📲 Customer",
    defaultRoute: "/customer/approve/demo",
  },
  Public: {
    role: "Public",
    name: "Guest User",
    email: "unauthenticated@piveran.com",
    title: "Public / Unauthenticated",
    avatarBadge: "🔑 Public",
    defaultRoute: "/login",
  },
};

interface DevRoleContextType {
  activeRole: RoleType;
  currentProfile: RoleProfile;
  setRole: (role: RoleType) => void;
  switchRoleAndNavigate: (role: RoleType) => void;
  mockDataState: MockDataState;
  setMockDataState: (state: MockDataState) => void;
  toggleMockDataState: () => void;
  isDevBarVisible: boolean;
  toggleDevBar: () => void;
  impersonatedMechanic: string | null;
  setImpersonatedMechanic: (name: string | null) => void;
}

const DevRoleContext = createContext<DevRoleContextType | undefined>(undefined);

export function DevRoleProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRoleState] = useState<RoleType>("Developer");
  const [mockDataState, setMockDataState] = useState<MockDataState>("populated");
  const [isDevBarVisible, setIsDevBarVisible] = useState(true);
  const [impersonatedMechanic, setImpersonatedMechanicState] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const savedRole = localStorage.getItem("piveran_dev_role") as RoleType | null;
    if (savedRole && ROLE_PROFILES[savedRole]) {
      setActiveRoleState(savedRole);
    }
    const savedState = localStorage.getItem("piveran_mock_state") as MockDataState | null;
    if (savedState) {
      setMockDataState(savedState);
    }
    const savedMech = localStorage.getItem("piveran_impersonated_mech");
    if (savedMech) {
      setImpersonatedMechanicState(savedMech);
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

  const setMockState = (state: MockDataState) => {
    setMockDataState(state);
    localStorage.setItem("piveran_mock_state", state);
  };

  const toggleMockDataState = () => {
    const nextState = mockDataState === "populated" ? "empty" : "populated";
    setMockState(nextState);
  };

  const switchRoleAndNavigate = (role: RoleType) => {
    setRole(role);
    const targetRoute = ROLE_PROFILES[role].defaultRoute;
    router.push(targetRoute);
  };

  const toggleDevBar = () => {
    setIsDevBarVisible((prev) => !prev);
  };

  const currentProfile = ROLE_PROFILES[activeRole];

  return (
    <DevRoleContext.Provider
      value={{
        activeRole,
        currentProfile,
        setRole,
        switchRoleAndNavigate,
        mockDataState,
        setMockDataState: setMockState,
        toggleMockDataState,
        isDevBarVisible,
        toggleDevBar,
        impersonatedMechanic,
        setImpersonatedMechanic,
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
