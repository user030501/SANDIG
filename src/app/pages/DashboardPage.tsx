import { useNavigate } from "react-router";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  UserCircle, AlertTriangle, ArrowRightLeft, CheckCircle,
  Plus, ClipboardList, FileText, Calendar, Activity, History,
} from "lucide-react";
import type { RecentUpdate, Referral, RiskLevel } from "../data/mockData";
import { useApi } from "../lib/useApi";
import { RiskBadge } from "../components/StatusBadge";
import { RiskScoreBadge, FollowUpBadge } from "../components/RiskPanels";
import { useAuth } from "../context/AuthContext";

// FR-19 dashboard payload — every figure is computed server-side from live
// records. Nothing on this page is hardcoded.
interface DashboardData {
  totalPwd: number;
  highRisk: number;
  moderateRisk: number;
  lowRisk: number;
  pendingReferrals: number;
  completedReferrals: number;
  inProgressReferrals: number;
  escalatedReferrals: number;
  upcomingFollowUps: number;
  overdueFollowUps: number;
  healthConcerns: { key: string; concern: string; short: string; count: number; pct: number }[];
  recentUpdates: RecentUpdate[];
  upcomingFollowUpList: Referral[];
  priorityCases: {
    id: string; pwdId: string; pwdName: string;
    flagReason: string; riskScore: number; priorityLevel: RiskLevel;
  }[];
}

const UPDATE_STYLES: Record<RecentUpdate["type"], { color: string; bg: string }> = {
  Referral: { color: "#2142A6", bg: "#EEF0FF" },
  Status: { color: "#c2410c", bg: "#FFF7ED" },
  Assessment: { color: "#5B48B0", bg: "#F3F0FF" },
  Risk: { color: "#dc2626", bg: "#fef2f2" },
  Profile: { color: "#15803d", bg: "#F0FDF4" },
};

function StatCard({
  icon, label, value, color, sub, border,
}: {
  icon: React.ReactNode; label: string; value: number | string;
  color: string; sub?: string; border?: string;
}) {
  return (
    <div
      className="bg-white rounded-xl border p-5 flex items-start gap-4"
      style={{ borderColor: border ?? "#e5e7eb" }}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 leading-none">{value}</div>
        <div className="text-sm text-gray-600 mt-1">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error } = useApi<DashboardData>("/dashboard");

  if (loading || error || !data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-400">
        {loading ? "Loading dashboard…" : error ?? "No dashboard data."}
      </div>
    );
  }

  const {
    totalPwd, highRisk, moderateRisk, lowRisk,
    pendingReferrals, completedReferrals, inProgressReferrals, escalatedReferrals,
    upcomingFollowUps, overdueFollowUps,
    healthConcerns, recentUpdates, upcomingFollowUpList, priorityCases,
  } = data;

  const referralSummary = [
    { label: "Pending", count: pendingReferrals, color: "#f59e0b" },
    { label: "In Progress", count: inProgressReferrals, color: "#3b82f6" },
    { label: "Completed", count: completedReferrals, color: "#22c55e" },
    { label: "Escalated", count: escalatedReferrals, color: "#ea580c" },
  ];

  // Guard against divide-by-zero before any PWD records exist.
  const pct = (n: number) => (totalPwd === 0 ? 0 : Math.round((n / totalPwd) * 100));

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.fullName}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/pwd-profiles/new")}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-lg transition-colors"
            style={{ backgroundColor: "#2142A6" }}
          >
            <Plus size={16} /> Add PWD
          </button>
          <button
            onClick={() => navigate("/referrals/new")}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowRightLeft size={16} /> Create Referral
          </button>
        </div>
      </div>

      {/* ── System Capacity Summary ── */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
          System Capacity Summary
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<UserCircle size={22} className="text-white" />}
            label="Total PWD Records"
            value={totalPwd}
            color="bg-[#2142A6]"
            sub="Brgy. New Pandan"
          />
          <StatCard
            icon={<AlertTriangle size={22} style={{ color: "#F48740" }} />}
            label="Pending Referrals"
            value={pendingReferrals}
            color="bg-orange-50"
            sub="Awaiting action"
            border="#fed7aa"
          />
          <StatCard
            icon={<Calendar size={22} style={{ color: "#5B48B0" }} />}
            label="Upcoming Follow-Ups"
            value={upcomingFollowUps}
            color="bg-purple-50"
            sub={overdueFollowUps > 0 ? `${overdueFollowUps} overdue or missed` : "Scheduled"}
            border="#ddd6fe"
          />
          <StatCard
            icon={<CheckCircle size={22} className="text-green-600" />}
            label="Completed Referrals"
            value={completedReferrals}
            color="bg-green-50"
            sub="All time"
            border="#bbf7d0"
          />
        </div>
      </div>

      {/* ── Risk Distribution ── */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
          Risk Distribution
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "High Risk", count: highRisk, bg: "#fef2f2", border: "#fecaca", text: "#dc2626", bar: "#dc2626" },
            { label: "Moderate Risk", count: moderateRisk, bg: "#fefce8", border: "#fef08a", text: "#ca8a04", bar: "#eab308" },
            { label: "Low Risk", count: lowRisk, bg: "#f0fdf4", border: "#bbf7d0", text: "#16a34a", bar: "#22c55e" },
          ].map((r) => (
            <div
              key={r.label}
              className="rounded-xl border p-4"
              style={{ backgroundColor: r.bg, borderColor: r.border }}
            >
              <div className="text-xs font-medium mb-2" style={{ color: r.text }}>{r.label}</div>
              <div className="text-3xl font-bold text-gray-900">{r.count}</div>
              <div className="mt-2 h-1.5 rounded-full bg-white/60 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct(r.count)}%`, backgroundColor: r.bar }}
                />
              </div>
              <div className="text-xs mt-1" style={{ color: r.text }}>
                {pct(r.count)}% of total
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unmet needs bar chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-1">Common Unmet Health Needs</h3>
          <p className="text-xs text-gray-400 mb-4">Number of PWDs with each identified health concern</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={healthConcerns} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="short" tick={{ fontSize: 10 }} interval={0} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "#eff6ff" }}
                labelFormatter={(l) => healthConcerns.find((c) => c.short === l)?.concern ?? l}
              />
              <Bar dataKey="count" name="PWDs" fill="#2142A6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Referral status cards */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-1">Referral Status</h3>
          <p className="text-xs text-gray-400 mb-4">Current breakdown of all referrals</p>
          <div className="grid grid-cols-2 gap-3">
            {referralSummary.map((r) => (
              <div
                key={r.label}
                className="rounded-xl p-4 flex items-center justify-between"
                style={{ backgroundColor: r.color + "18", border: `1px solid ${r.color}44` }}
              >
                <div>
                  <div className="text-xs font-medium" style={{ color: r.color }}>{r.label}</div>
                  <div className="text-2xl font-bold text-gray-900 mt-0.5">{r.count}</div>
                </div>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
              </div>
            ))}
          </div>
          <div className="mt-4 h-2 rounded-full overflow-hidden flex gap-0.5">
            {referralSummary.map((r) => (
              <div
                key={r.label}
                className="h-full rounded-sm"
                style={{ flex: r.count, backgroundColor: r.color }}
                title={r.label}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Common Welfare Concerns ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-1">
          <Activity size={16} style={{ color: "#2BB7A9" }} />
          <h3 className="font-semibold text-gray-800">Common Health Concerns</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">Percentage of PWDs with each health concern based on latest assessments</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {healthConcerns.map((c) => (
            <div key={c.concern}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{c.concern}</span>
                <span className="text-gray-500 font-medium text-xs">{c.count} PWDs ({c.pct}%)</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#EEF0FF" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${c.pct}%`, backgroundColor: "#2142A6" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Follow-Ups */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-800">Upcoming Follow-Ups</h3>
              <p className="text-xs text-gray-400 mt-0.5">Scheduled · Completed · Overdue · Missed</p>
            </div>
            <button onClick={() => navigate("/referrals")} className="text-xs hover:underline" style={{ color: "#2142A6" }}>
              View all
            </button>
          </div>
          {upcomingFollowUpList.length === 0 ? (
            <p className="text-sm text-gray-400">No upcoming follow-ups.</p>
          ) : (
            <div className="space-y-3">
              {upcomingFollowUpList.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-gray-800">{r.pwdName}</div>
                    <div className="text-xs text-gray-400">{r.referredOffice} · {r.referralType}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{r.followUpDate}</span>
                    <FollowUpBadge status={r.followUpStatus} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority Cases */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Priority Cases</h3>
            <button onClick={() => navigate("/at-risk")} className="text-xs hover:underline" style={{ color: "#2142A6" }}>
              View all
            </button>
          </div>
          <div className="space-y-3">
            {priorityCases.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/at-risk/${c.id}`)}
                className="w-full text-left flex items-center justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0 flex-1 mr-3">
                  <div className="text-sm font-medium text-gray-800">{c.pwdName}</div>
                  <div className="text-xs text-gray-400 truncate">{c.flagReason}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <RiskScoreBadge score={c.riskScore} />
                  <RiskBadge level={c.priorityLevel} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Updates ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <History size={16} style={{ color: "#2BB7A9" }} />
            <h3 className="font-semibold text-gray-800">Recent Updates</h3>
          </div>
          <button
            onClick={() => navigate("/audit-logs")}
            className="text-xs hover:underline"
            style={{ color: "#2142A6" }}
          >
            View audit logs
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">Latest activity recorded in the system</p>

        <div className="divide-y divide-gray-100">
          {recentUpdates.slice(0, 8).map((u) => {
            const s = UPDATE_STYLES[u.type];
            return (
              <div key={u.id} className="flex items-start gap-3 py-2.5">
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0 w-[74px] text-center"
                  style={{ backgroundColor: s.bg, color: s.color }}
                >
                  {u.type}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-gray-800">
                    {u.action} — <span className="font-medium">{u.subject}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">by {u.actor}</div>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                  {u.dateTime}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/pwd-profiles/new")}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors"
            style={{ backgroundColor: "#EEF0FF", color: "#2142A6", borderColor: "#c7d2fe" }}
          >
            <Plus size={15} /> Add PWD Profile
          </button>
          <button
            onClick={() => navigate("/assessments")}
            className="flex items-center gap-2 px-4 py-2 border text-sm rounded-lg transition-colors"
            style={{ backgroundColor: "#F3F0FF", color: "#5B48B0", borderColor: "#ddd6fe" }}
          >
            <ClipboardList size={15} /> New Assessment
          </button>
          <button
            onClick={() => navigate("/referrals/new")}
            className="flex items-center gap-2 px-4 py-2 border text-sm rounded-lg transition-colors"
            style={{ backgroundColor: "#FFF7ED", color: "#c2410c", borderColor: "#fed7aa" }}
          >
            <ArrowRightLeft size={15} /> Create Referral
          </button>
          <button
            onClick={() => navigate("/reports")}
            className="flex items-center gap-2 px-4 py-2 border text-sm rounded-lg transition-colors"
            style={{ backgroundColor: "#F0FDF4", color: "#15803d", borderColor: "#bbf7d0" }}
          >
            <FileText size={15} /> Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}
