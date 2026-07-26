import { useState } from "react";
import { Key, ShieldCheck, User } from "lucide-react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export function UserManagementPage() {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    fullName: "Maria Santos",
    username: "admin",
    contactNumber: "09171111111",
    email: "maria.santos@newpandan.gov.ph",
    role: "Administrator / Assigned PWD Coordinator",
    status: "Active",
    lastLogin: "2026-06-17 08:30",
  });
  const [saved, setSaved] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSaved, setPwdSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setEditMode(false);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwdError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPwdError("Password must be at least 8 characters.");
      return;
    }
    setPwdError("");
    setPwdSaved(true);
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => { setPwdSaved(false); setShowReset(false); }, 2000);
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          This system has a single authorized user: the Administrator / Assigned PWD Coordinator.
        </p>
      </div>

      {/* Info banner */}
      <div
        className="rounded-xl border px-4 py-3 text-sm flex items-start gap-3"
        style={{ backgroundColor: "#EEF0FF", borderColor: "#c7d2fe", color: "#2142A6" }}
      >
        <ShieldCheck size={18} className="flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold">Single-User System</div>
          <div className="text-xs mt-0.5" style={{ color: "#5B48B0" }}>
            SANDIG is configured for use by one designated administrator per barangay. Only the Assigned PWD Coordinator may log in and manage records.
          </div>
        </div>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          Account information updated successfully.
        </div>
      )}

      {/* User profile card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: "#2142A6" }}
            >
              {form.fullName.charAt(0)}
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{form.fullName}</div>
              <div className="text-sm" style={{ color: "#5B48B0" }}>{form.role}</div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 mt-1">
                {form.status}
              </span>
            </div>
          </div>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              <User size={14} /> Edit Profile
            </button>
          )}
        </div>

        {editMode ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-700">Full Name</Label>
                <Input
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-700">Username</Label>
                <Input
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-700">Contact Number</Label>
                <Input
                  value={form.contactNumber}
                  onChange={(e) => setForm((f) => ({ ...f, contactNumber: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-700">Email</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white text-sm rounded-lg transition-colors"
                style={{ backgroundColor: "#2142A6" }}
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Full Name", value: form.fullName },
              { label: "Username", value: form.username },
              { label: "Contact Number", value: form.contactNumber },
              { label: "Email", value: form.email },
              { label: "Role", value: form.role },
              { label: "Last Login", value: form.lastLogin },
            ].map((r) => (
              <div key={r.label}>
                <div className="text-xs text-gray-500 mb-0.5">{r.label}</div>
                <div className="text-sm font-medium text-gray-900">{r.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Password reset */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-gray-500" />
            <h3 className="font-semibold text-gray-800">Change Password</h3>
          </div>
          {!showReset && (
            <button
              onClick={() => setShowReset(true)}
              className="text-sm hover:underline"
              style={{ color: "#2142A6" }}
            >
              Change
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-4">Use a strong password with at least 8 characters.</p>

        {pwdSaved && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
            Password updated successfully.
          </div>
        )}

        {showReset && (
          <form onSubmit={handleResetPassword} className="space-y-3">
            <div>
              <Label className="text-sm text-gray-700">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-gray-700">Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="mt-1"
              />
            </div>
            {pwdError && <p className="text-red-600 text-xs">{pwdError}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowReset(false); setPwdError(""); }}
                className="px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white text-sm rounded-lg transition-colors"
                style={{ backgroundColor: "#2142A6" }}
              >
                Update Password
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
