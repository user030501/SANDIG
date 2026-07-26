import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Eye, EyeOff, Lock } from "lucide-react";
import logoIcon from "@/imports/image-2.png";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err) {
      // The server returns a deliberately uniform message so the form cannot be
      // used to probe which usernames exist.
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-5/12 p-12 text-white"
        style={{ backgroundColor: "#2142A6" }}
      >
        <div>
          {/* Logo + wordmark */}
          <div className="flex items-center gap-4 mb-10">
            <img
              src={logoIcon}
              alt="SANDIG icon"
              className="w-16 h-16 object-contain flex-shrink-0"
            />
            <div>
              <div
                className="text-4xl font-bold tracking-widest leading-none"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                SANDIG
              </div>
              <div className="text-xs tracking-wider mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                VERSION 1.0 · PROTOTYPE
              </div>
            </div>
          </div>

          {/* Tagline */}
          <h2 className="text-xl font-semibold leading-snug text-white mb-2">
            System for Assessment, Needs Detection,<br />Intervention, and Guidance
          </h2>
          <p className="text-sm leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.65)" }}>
            PWD Welfare Monitoring and Referral System<br />for Barangay New Pandan
          </p>

          {/* Color-accent divider */}
          <div className="flex gap-1.5 mb-8">
            <div className="h-1 w-8 rounded-full" style={{ backgroundColor: "#2BB7A9" }} />
            <div className="h-1 w-8 rounded-full" style={{ backgroundColor: "#F48740" }} />
            <div className="h-1 w-8 rounded-full" style={{ backgroundColor: "#8C7BFF" }} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-3">
            {[
              { label: "Registered PWDs", value: "8", note: "Barangay New Pandan", accent: "#2BB7A9" },
              { label: "At-Risk Cases (Open)", value: "3", note: "Requiring attention", accent: "#F48740" },
              { label: "Active Referrals", value: "4", note: "Pending & in-progress", accent: "#8C7BFF" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-4 flex items-center justify-between"
                style={{ backgroundColor: "rgba(0,0,0,0.18)" }}
              >
                <div>
                  <div className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {s.label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {s.note}
                  </div>
                </div>
                <div className="text-3xl font-bold" style={{ color: s.accent }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
          Republic of the Philippines<br />
          Local Government Unit · Barangay New Pandan<br />
          This system is intended for authorized barangay personnel only.
        </div>
      </div>

      {/* ── Right login panel ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center p-8"
        style={{ backgroundColor: "#F5F7FB" }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile-only header */}
          <div className="flex lg:hidden flex-col items-center mb-8">
            <img src={logoIcon} alt="SANDIG" className="w-16 h-16 object-contain mb-3" />
            <div
              className="text-2xl font-bold tracking-widest"
              style={{ color: "#2142A6", fontFamily: "'Poppins', sans-serif" }}
            >
              SANDIG
            </div>
            <div className="text-gray-400 text-xs mt-1 text-center">
              PWD Welfare Monitoring and Referral System
            </div>
          </div>

          {/* Login card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-9">
            {/* Teal accent bar */}
            <div
              className="w-10 h-1 rounded-full mb-5"
              style={{ backgroundColor: "#2BB7A9" }}
            />

            <div className="flex items-center gap-2 mb-2">
              <Lock size={15} style={{ color: "#2142A6" }} />
              <h2 className="text-lg font-semibold text-gray-900">Sign In</h2>
            </div>
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-4"
              style={{ backgroundColor: "#EEF0FF", color: "#2142A6" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
              Administrator / Assigned PWD Coordinator
            </div>
            <p className="text-gray-400 text-sm mb-6">Enter your credentials to continue.</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-gray-700 text-sm">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1"
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-700 text-sm">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors mt-1 disabled:opacity-60"
                style={{ backgroundColor: loading ? "#5B48B0" : "#2142A6" }}
              >
                {loading ? "Signing in…" : "Login"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  className="text-sm hover:underline transition-colors"
                  style={{ color: "#2142A6" }}
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-5">
            Authorized personnel only.
          </p>
          <p className="text-center text-xs mt-1" style={{ color: "#8C7BFF", opacity: 0.6 }}>
            Barangay New Pandan · SANDIG v1.0 · Prototype
          </p>
        </div>
      </div>
    </div>
  );
}
