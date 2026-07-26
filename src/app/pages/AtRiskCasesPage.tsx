import { useState } from "react";
import { useNavigate } from "react-router";
import { Eye, ArrowRightLeft, CheckCircle } from "lucide-react";
import { AT_RISK_CASES, type AtRiskCase } from "../data/mockData";
import {
  RISK_INDICATORS, RISK_BANDS, MAX_RISK_SCORE, RISK_ORDER,
  FOLLOW_UP_STATUSES, isDisagreement,
} from "../data/riskModel";
import { RiskBadge } from "../components/StatusBadge";
import { RiskScoreBadge, IndicatorPills, FollowUpBadge } from "../components/RiskPanels";

export function AtRiskCasesPage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<AtRiskCase[]>(AT_RISK_CASES);
  const [filterPriority, setFilterPriority] = useState("");
  const [filterFollowUp, setFilterFollowUp] = useState("");

  const filtered = cases
    .filter((c) => {
      const matchPriority = !filterPriority || c.priorityLevel === filterPriority;
      const matchFollowUp = !filterFollowUp || c.followUpStatus === filterFollowUp;
      return matchPriority && matchFollowUp;
    })
    .sort((a, b) => RISK_ORDER[a.priorityLevel] - RISK_ORDER[b.priorityLevel] || b.riskScore - a.riskScore);

  function markReviewed(id: string) {
    setCases((prev) => prev.map((c) => c.id === id ? { ...c, status: "Reviewed" as const } : c));
  }

  const openCount = cases.filter((c) => c.status === "Open").length;
  const highRiskCount = cases.filter((c) => c.priorityLevel === "High Risk" && c.status === "Open").length;
  const overdueCount = cases.filter((c) => c.followUpStatus === "Overdue").length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Health-Risk Cases</h1>
          <p className="text-sm text-gray-500 mt-1">Auto-scored PWDs flagged for health monitoring and intervention</p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-lg px-4 py-2 text-center" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
            <div className="text-xl font-bold" style={{ color: "#dc2626" }}>{highRiskCount}</div>
            <div className="text-xs" style={{ color: "#dc2626" }}>High Risk</div>
          </div>
          <div className="rounded-lg px-4 py-2 text-center" style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa" }}>
            <div className="text-xl font-bold" style={{ color: "#ea580c" }}>{openCount}</div>
            <div className="text-xs" style={{ color: "#ea580c" }}>Open</div>
          </div>
          <div className="rounded-lg px-4 py-2 text-center" style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}>
            <div className="text-xl font-bold" style={{ color: "#b91c1c" }}>{overdueCount}</div>
            <div className="text-xs" style={{ color: "#b91c1c" }}>Overdue</div>
          </div>
        </div>
      </div>

      {/* Risk score legend — three tiers, six scoring indicators */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Rule-Based Risk Score Legend
          </p>
          <div className="flex flex-wrap gap-3 text-xs">
            {RISK_BANDS.map((b) => (
              <span
                key={b.level}
                className="px-2.5 py-1 rounded-lg font-medium"
                style={{ backgroundColor: b.bg, color: b.color }}
              >
                {b.range} — {b.level}
              </span>
            ))}
            <span className="text-gray-400 self-center">Maximum attainable score: {MAX_RISK_SCORE}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Scoring Indicators
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {RISK_INDICATORS.map((i) => (
              <span
                key={i.key}
                title={i.description}
                className={`px-2 py-1 rounded-lg font-medium border ${
                  i.doubleWeighted
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                {i.label} <span className="opacity-60">+{i.weight}</span>
                {i.doubleWeighted && <span className="ml-1 font-semibold">×2</span>}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Urgent Medical Condition is weighted double and auto-triggers immediate review.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3">
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
        >
          <option value="">All Priority Levels</option>
          <option>Low Risk</option>
          <option>Moderate Risk</option>
          <option>High Risk</option>
        </select>
        <select
          value={filterFollowUp}
          onChange={(e) => setFilterFollowUp(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
        >
          <option value="">All Follow-Up Statuses</option>
          {FOLLOW_UP_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">PWD Name / Indicators Present</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Score</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Rule-Based</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">AI Prediction</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Confirmed Level</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Follow-Up Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 max-w-[260px]">
                    <button
                      onClick={() => navigate(`/at-risk/${c.id}`)}
                      className="font-medium text-gray-900 hover:underline text-left"
                      style={{ color: "#2142A6" }}
                    >
                      {c.pwdName}
                    </button>
                    <div className="text-xs text-gray-400 mb-1.5">Flagged {c.dateFlagged}</div>
                    <IndicatorPills indicators={c.indicators} />
                  </td>
                  <td className="px-4 py-3"><RiskScoreBadge score={c.riskScore} /></td>
                  <td className="px-4 py-3"><RiskBadge level={c.priorityLevel} /></td>
                  <td className="px-4 py-3">
                    <RiskBadge level={c.aiPrediction.predicted} />
                    <div className="text-xs text-gray-400 mt-1">
                      {Math.round(c.aiPrediction.probabilities[c.aiPrediction.predicted] * 100)}% confidence
                    </div>
                    {isDisagreement(c.priorityLevel, c.aiPrediction.predicted) && (
                      <div className="text-[10px] font-medium text-amber-600 mt-0.5">
                        Disagreement flagged
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.confirmation ? (
                      <>
                        <RiskBadge level={c.confirmation.confirmedLevel} />
                        <div className="text-[10px] text-gray-400 mt-1">
                          {c.confirmation.confirmedBy} — {c.confirmation.confirmedAt}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs font-medium text-amber-600">Awaiting confirmation</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><FollowUpBadge status={c.followUpStatus} /></td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                      c.status === "Open"
                        ? "bg-orange-50 text-orange-700 border-orange-200"
                        : c.status === "Reviewed"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => navigate(`/at-risk/${c.id}`)}
                        title="Open case — risk result and confirmation"
                        className="p-1.5 rounded hover:bg-blue-50 transition-colors"
                        style={{ color: "#2142A6" }}
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => navigate("/referrals/new")}
                        title="Create Referral"
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                      >
                        <ArrowRightLeft size={15} />
                      </button>
                      {c.status === "Open" && (
                        <button
                          onClick={() => markReviewed(c.id)}
                          title="Mark as Reviewed"
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                        >
                          <CheckCircle size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    No at-risk cases found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          Showing {filtered.length} of {cases.length} cases · sorted by risk score (highest first)
        </div>
      </div>
    </div>
  );
}
