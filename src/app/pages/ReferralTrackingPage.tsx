import { useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Edit, FileText, Printer, CheckCircle } from "lucide-react";
import { type Referral, type ReferralStatus } from "../data/mockData";
import { useApi } from "../lib/useApi";
import { api } from "../lib/api";
import { ReferralBadge, RiskBadge } from "../components/StatusBadge";
import { FollowUpBadge } from "../components/RiskPanels";

export function ReferralTrackingPage() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useApi<Referral[]>("/referrals");
  const referrals = data ?? [];
  const [actionError, setActionError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<ReferralStatus>("Pending");
  const [outcomeId, setOutcomeId] = useState<string | null>(null);
  const [outcomeText, setOutcomeText] = useState("");

  const filtered = referrals.filter((r) => {
    return !filterStatus || r.status === filterStatus;
  });

  async function updateStatus(id: string, status: ReferralStatus) {
    setActionError(null);
    try {
      await api.patch(`/referrals/${id}/status`, { status });
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update the referral.");
    } finally {
      setEditId(null);
    }
  }

  async function saveOutcome(id: string) {
    setActionError(null);
    try {
      const current = referrals.find((r) => r.id === id);
      await api.patch(`/referrals/${id}/status`, {
        status: current?.status ?? "Pending",
        outcome: outcomeText,
      });
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not save the outcome.");
    } finally {
      setOutcomeId(null);
      setOutcomeText("");
    }
  }

  const pendingCount = referrals.filter((r) => r.status === "Pending").length;
  const inProgressCount = referrals.filter((r) => r.status === "In Progress").length;
  const completedCount = referrals.filter((r) => r.status === "Completed").length;
  const escalatedCount = referrals.filter((r) => r.status === "Escalated").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referral Tracking</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor and manage all PWD referrals</p>
        </div>
        <button
          onClick={() => navigate("/referrals/new")}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-lg transition-colors"
          style={{ backgroundColor: "#2142A6" }}
        >
          <Plus size={16} /> Create Referral
        </button>
      </div>

      {actionError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
          {actionError}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pending", count: pendingCount, color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
          { label: "In Progress", count: inProgressCount, color: "#2142A6", bg: "#EEF0FF", border: "#c7d2fe" },
          { label: "Completed", count: completedCount, color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
          { label: "Escalated", count: escalatedCount, color: "#ea580c", bg: "#fff7ed", border: "#fed7aa" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-4 text-center" style={{ backgroundColor: s.bg, borderColor: s.border }}>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</div>
            <div className="text-xs mt-1" style={{ color: s.color }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
        >
          <option value="">All Statuses</option>
          <option>Pending</option>
          <option>In Progress</option>
          <option>Completed</option>
          <option>Received</option>
          <option>Escalated</option>
          <option>Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Ref. ID</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">PWD Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Identified Need</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Receiver / Office</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Referral Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Priority</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Follow-Up</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Outcome</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{r.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{r.pwdName}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[150px]">
                    <p className="line-clamp-1 text-xs">{r.identifiedNeed}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <div className="font-medium">{r.referredOffice}</div>
                    <div className="text-gray-400">{r.receiverName}</div>
                  </td>
                  <td className="px-4 py-3">
                    {editId === r.id ? (
                      <div className="flex gap-1 items-center">
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as ReferralStatus)}
                          className="border border-gray-200 rounded px-2 py-1 text-xs"
                        >
                          {["Pending", "Received", "In Progress", "Completed", "Escalated", "Cancelled"].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => updateStatus(r.id, newStatus)}
                          className="text-xs px-2 py-1 text-white rounded"
                          style={{ backgroundColor: "#2142A6" }}
                        >
                          Save
                        </button>
                        <button onClick={() => setEditId(null)} className="text-xs px-1 text-gray-400">✕</button>
                      </div>
                    ) : (
                      <ReferralBadge status={r.status} />
                    )}
                  </td>
                  <td className="px-4 py-3"><RiskBadge level={r.priorityLevel} /></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-xs text-gray-500 mb-1">{r.followUpDate || "—"}</div>
                    <FollowUpBadge status={r.followUpStatus} />
                  </td>
                  <td className="px-4 py-3 max-w-[160px]">
                    {outcomeId === r.id ? (
                      <div className="flex gap-1 items-center">
                        <input
                          value={outcomeText}
                          onChange={(e) => setOutcomeText(e.target.value)}
                          placeholder="Enter outcome"
                          className="border border-gray-200 rounded px-2 py-1 text-xs w-32"
                        />
                        <button
                          onClick={() => saveOutcome(r.id)}
                          className="text-xs p-1 text-white rounded"
                          style={{ backgroundColor: "#2BB7A9" }}
                        >
                          <CheckCircle size={12} />
                        </button>
                        <button onClick={() => setOutcomeId(null)} className="text-xs px-1 text-gray-400">✕</button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500 line-clamp-1">
                        {r.outcome || <span className="text-gray-300 italic">Not yet recorded</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setEditId(r.id); setNewStatus(r.status); }}
                        title="Update Status"
                        className="p-1.5 hover:bg-blue-50 rounded transition-colors"
                        style={{ color: "#2142A6" }}
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => { setOutcomeId(r.id); setOutcomeText(r.outcome); }}
                        title="Add / Edit Outcome"
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                      >
                        <FileText size={15} />
                      </button>
                      <button
                        title="Print Referral"
                        className="p-1.5 text-gray-500 hover:bg-gray-50 rounded transition-colors"
                      >
                        <Printer size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    {loading ? "Loading…" : error ? error : "No referrals found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          Showing {filtered.length} of {referrals.length} referrals
        </div>
      </div>
    </div>
  );
}
