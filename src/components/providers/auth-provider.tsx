"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Role } from "@/lib/types";

interface AuthUser {
  id: string;
  displayName: string;
  role: Role;
  rtName: string;
}

interface AuthContextType {
  user: AuthUser | null;
  role: Role;
  isReady: boolean;
  login: (role: Role) => void;
  logout: () => void;
  switchRole: (role: Role) => void;
}

const userByRole: Record<Role, AuthUser> = {
  resident: {
    id: "usr_resident_01",
    displayName: "Siti Rahmawati",
    role: "resident",
    rtName: "RT 01 RW 04 Melati",
  },
  admin: {
    id: "usr_admin_01",
    displayName: "Bambang Sutrisno",
    role: "admin",
    rtName: "RT 01 RW 04 Melati",
  },
  developer: {
    id: "usr_dev_01",
    displayName: "Developer SULAP",
    role: "developer",
    rtName: "Platform SULAP (Semua RT)",
  },
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: "resident",
  isReady: false,
  login: () => {},
  logout: () => {},
  switchRole: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem("sulap_role") as Role | null;
    if (savedRole === "resident" || savedRole === "admin" || savedRole === "developer") {
      setUser(userByRole[savedRole]);
    }
    setIsReady(true);
  }, []);

  const login = (newRole: Role) => {
    setUser(userByRole[newRole]);
    localStorage.setItem("sulap_role", newRole);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sulap_role");
  };

  const switchRole = (newRole: Role) => {
    login(newRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : "resident",
        isReady,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
