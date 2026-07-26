import React, { createContext, useContext, useState } from "react";

export type UserRole =
  | "administrator"
  | "barangay_staff"
  | "pwd_focal"
  | "field_worker"
  | "barangay_official";

export interface AuthUser {
  id: string;
  fullName: string;
  username: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const login = (u: AuthUser) => setUser(u);
  const logout = () => setUser(null);
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export const DEMO_USERS: AuthUser[] = [
  { id: "u1", fullName: "Maria Santos", username: "admin", role: "administrator" },
  { id: "u2", fullName: "Jose Reyes", username: "staff1", role: "barangay_staff" },
  { id: "u3", fullName: "Ana Cruz", username: "focal1", role: "pwd_focal" },
  { id: "u4", fullName: "Pedro Lim", username: "bhw1", role: "field_worker" },
  { id: "u5", fullName: "Ricardo Dela Cruz", username: "official1", role: "barangay_official" },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  administrator: "Administrator",
  barangay_staff: "Barangay Staff",
  pwd_focal: "PWD Focal Person",
  field_worker: "BHW / Field Worker",
  barangay_official: "Barangay Official",
};
