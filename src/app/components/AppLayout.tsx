import { useEffect, useRef, useState } from "react";
import { Outlet, Navigate, useNavigate } from "react-router";
import { User, LogOut, ChevronDown } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../context/AuthContext";

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  if (!user) return <Navigate to="/" replace />;

  function handleLogout() {
    setMenuOpen(false);
    void logout().finally(() => navigate("/"));
  }

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
          <div className="relative ml-auto" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-3 px-1.5 py-1 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-gray-800 leading-snug">{user.fullName}</div>
                <div className="text-xs leading-snug" style={{ color: "#5B48B0" }}>
                  {user.role}
                </div>
              </div>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: "#2142A6" }}
              >
                {user.fullName.charAt(0)}
              </div>
              <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50">
                <div className="px-3.5 py-2 border-b border-gray-100 sm:hidden">
                  <div className="text-sm font-semibold text-gray-800 truncate">{user.fullName}</div>
                  <div className="text-xs truncate" style={{ color: "#5B48B0" }}>{user.role}</div>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); navigate("/account-settings"); }}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User size={15} /> Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
