import React, { createContext, useContext, useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";

/**
 * SANDIG has exactly one direct user type: the Administrator, who is the
 * Assigned PWD Coordinator (manuscript Section 1.5, FR-23). The Barangay Health
 * Center and other referred offices are external entities that never log in, so
 * they are deliberately not modelled as roles here.
 */
export type UserRole = "administrator";

export const ROLE_LABELS: Record<UserRole, string> = {
  administrator: "Administrator",
};

export interface AuthUser {
  id: string;
  fullName: string;
  username: string;
  /** Free-text title from the server, e.g. "Administrator / Assigned PWD Coordinator". */
  role: string;
  status?: string;
  lastLogin?: string;
  contactNumber?: string;
  email?: string;
  hasSecurityQuestion?: boolean;
}

export interface UpdateProfileInput {
  fullName: string;
  username: string;
  contactNumber: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  /** True while the initial session probe is in flight. */
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore an existing session on mount — the JWT lives in an httpOnly cookie,
  // so the only way to know whether we are signed in is to ask the server.
  useEffect(() => {
    let cancelled = false;
    api
      .get<{ user: AuthUser }>("/auth/me")
      .then((res) => {
        if (!cancelled) setUser(res.user);
      })
      .catch((err: unknown) => {
        // Only a genuine 401 means "not signed in". Anything else — a rate
        // limit, a dropped connection — is not proof the session is gone, and
        // treating it as a logout stranded the user on the login screen with
        // no way back in until the same limit let the next request through.
        if (!cancelled && err instanceof ApiError && err.status === 401) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(username: string, password: string) {
    const res = await api.post<{ user: AuthUser }>("/auth/login", { username, password });
    setUser(res.user);
  }

  async function logout() {
    try {
      await api.post("/auth/logout", {});
    } finally {
      setUser(null);
    }
  }

  async function updateProfile(input: UpdateProfileInput) {
    const res = await api.patch<{ user: AuthUser }>("/auth/me", input);
    setUser(res.user);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
