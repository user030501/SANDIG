import { Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  ClipboardList,
  AlertTriangle,
  ArrowRightLeft,
  FileText,
  Settings,
  LogOut,
  ShieldCheck,
  Smartphone,
  StickyNote,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth, ROLE_LABELS } from "../context/AuthContext";
import logoIcon from "@/imports/image-2.png";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} />, roles: ["administrator", "barangay_staff", "pwd_focal", "barangay_official"] },
  { label: "PWD Profiles", path: "/pwd-profiles", icon: <UserCircle size={18} />, roles: ["administrator", "barangay_staff", "pwd_focal", "field_worker"] },
  { label: "Welfare Assessment", path: "/assessments", icon: <ClipboardList size={18} />, roles: ["administrator", "barangay_staff", "pwd_focal", "field_worker"] },
  { label: "At-Risk Cases", path: "/at-risk", icon: <AlertTriangle size={18} />, roles: ["administrator", "pwd_focal", "barangay_official"] },
  { label: "Referrals", path: "/referrals", icon: <ArrowRightLeft size={18} />, roles: ["administrator", "pwd_focal"] },
  { label: "Case Notes", path: "/case-notes", icon: <StickyNote size={18} />, roles: ["pwd_focal", "field_worker"] },
  { label: "Mobile Case Update", path: "/mobile-update", icon: <Smartphone size={18} />, roles: ["field_worker"] },
  { label: "Reports", path: "/reports", icon: <FileText size={18} />, roles: ["administrator", "barangay_staff", "pwd_focal", "barangay_official"] },
  { label: "Account Settings", path: "/account-settings", icon: <Users size={18} />, roles: ["administrator"] },
  { label: "Audit Logs", path: "/audit-logs", icon: <ShieldCheck size={18} />, roles: ["administrator"] },
  { label: "Settings", path: "/settings", icon: <Settings size={18} />, roles: ["administrator"] },
];

// Brand palette constants
const BRAND = {
  primary: "#2142A6",
  indigo: "#5B48B0",
  activeItem: "rgba(255,255,255,0.15)",
  hoverItem: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.12)",
  mutedText: "rgba(255,255,255,0.55)",
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role)
  );

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <aside
      style={{ backgroundColor: BRAND.primary }}
      className={`flex flex-col h-full text-white transition-all duration-300 flex-shrink-0 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Header — logo + wordmark */}
      <div
        style={{ borderBottom: `1px solid ${BRAND.border}` }}
        className={`flex items-center gap-2.5 ${collapsed ? "px-3 py-3 justify-center" : "px-4 py-3"}`}
      >
        <img
          src={logoIcon}
          alt="SANDIG logo"
          className={`object-contain flex-shrink-0 ${collapsed ? "w-8 h-8" : "w-9 h-9"}`}
        />
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <div className="font-bold text-lg tracking-widest leading-none text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
              SANDIG
            </div>
            <div className="text-xs mt-0.5 truncate" style={{ color: BRAND.mutedText }}>
              PWD Welfare System
            </div>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            style={{ color: BRAND.mutedText }}
            className="hover:text-white transition-colors flex-shrink-0"
            title="Collapse sidebar"
          >
            <ChevronLeft size={15} />
          </button>
        )}
      </div>

      {/* Collapsed expand button */}
      {collapsed && (
        <button
          onClick={onToggle}
          style={{ borderBottom: `1px solid ${BRAND.border}`, color: BRAND.mutedText }}
          className="flex items-center justify-center py-2 hover:text-white transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight size={15} />
        </button>
      )}

      {/* User chip */}
      {!collapsed && user && (
        <div
          style={{ borderBottom: `1px solid ${BRAND.border}`, backgroundColor: "rgba(0,0,0,0.15)" }}
          className="px-4 py-2.5"
        >
          <div className="text-sm font-semibold text-white truncate leading-snug">{user.fullName}</div>
          <div className="text-xs truncate mt-0.5" style={{ color: BRAND.mutedText }}>
            {ROLE_LABELS[user.role]}
          </div>
        </div>
      )}
      {collapsed && user && (
        <div
          style={{ borderBottom: `1px solid ${BRAND.border}` }}
          className="flex justify-center px-3 py-2"
        >
          <div
            title={`${user.fullName} · ${ROLE_LABELS[user.role]}`}
            style={{ backgroundColor: BRAND.indigo }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          >
            {user.fullName.charAt(0)}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {visibleItems.map((item) => {
          const active =
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path + "/"));
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              style={{
                backgroundColor: active ? BRAND.activeItem : undefined,
                color: active ? "#ffffff" : BRAND.mutedText,
              }}
              className={`flex items-center gap-3 mx-2 my-0.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                active ? "font-medium shadow-sm" : "hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ borderTop: `1px solid ${BRAND.border}` }} className="p-2">
        <button
          onClick={handleLogout}
          title={collapsed ? "Logout" : undefined}
          style={{ color: BRAND.mutedText }}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-white/10 hover:text-white rounded-lg transition-colors"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
