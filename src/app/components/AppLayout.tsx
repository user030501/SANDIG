import { useState } from "react";
import { Outlet, Navigate } from "react-router";
import { Sidebar } from "./Sidebar";
import { useAuth, ROLE_LABELS } from "../context/AuthContext";

export function AppLayout() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F5F7FB" }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          {/* Teal left accent line */}
          <div
            className="absolute left-0 top-0 h-14 w-1 hidden"
            style={{ backgroundColor: "#2BB7A9" }}
          />
          <div className="text-sm text-gray-400 truncate hidden sm:block">
            Barangay New Pandan &nbsp;·&nbsp; SANDIG — System for Assessment, Needs Detection, Intervention, and Guidance
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-gray-800 leading-snug">{user.fullName}</div>
              <div className="text-xs leading-snug" style={{ color: "#5B48B0" }}>
                {ROLE_LABELS[user.role]}
              </div>
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: "#2142A6" }}
            >
              {user.fullName.charAt(0)}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
