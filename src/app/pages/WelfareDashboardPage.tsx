import { useNavigate } from "react-router";
import { Plus, ClipboardList, Eye, ShieldAlert } from "lucide-react";
import { type PwdProfile, type AtRiskCase, type Referral } from "../data/mockData";
import { useApi } from "../lib/useApi";
import { RISK_ORDER, MAX_RISK_SCORE } from "../data/riskModel";
import { RiskBadge } from "../components/StatusBadge";

export function WelfareDashboardPage() {
  const navigate = useNavigate();

  const { data: profileData, loading, error } = useApi<PwdProfile[]>("/pwd-profiles");
  const { data: caseData } = useApi<AtRiskCase[]>("/at-risk");
  const { data: referralData } = useApi<Referral[]>("/referrals");

  const profiles = profileData ?? [];
  const cases = caseData ?? [];
  const referrals = referralData ?? [];

  // FR-19 summary counts — derived from the live records so the cards can never
  // drift from the underlying data.
  const welfareStats = [
    {
      label: "Total Active PWD Profiles",
      value: profiles.length,
      color: "#2142A6", bg: "#EEF0FF", border: "#c7d2fe",
    },
    {
      label: "High-Risk Cases",
      value: profiles.filter((p) => p.riskStatus === "High Risk").length,
      color: "#dc2626", bg: "#fef2f2", border: "#fecaca",
    },
    {
      label: "Moderate-Risk Cases",
      value: profiles.filter((p) => p.riskStatus === "Moderate Risk").length,
      color: "#ca8a04", bg: "#fefce8", border: "#fef08a",
    },
    {
      label: "Pending Referrals",
      value: referrals.filter((r) => r.status === "Pending").length,
      color: "#5B48B0", bg: "#F3F0FF", border: "#ddd6fe",
    },
  ];

  // FR-18 ordering: High -> Moderate -> Low, then longest since last assessment.
  const sortedProfiles = [...profiles].sort(
    (a, b) =>
      RISK_ORDER[a.riskStatus] - RISK_ORDER[b.riskStatus] ||
      a.lastAssessment.localeCompare(b.lastAssessment)
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welfare Assessment</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of PWD welfare status — select a PWD to file an assessment</p>
        </div>
        <button
          onClick={() => navigate("/assessments/new")}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-lg transition-colors"
          style={{ backgroundColor: "#2142A6" }}
        >
          <Plus size={16} /> New Assessment
        </button>
      </div>

      {/* Welfare stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {welfareStats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border p-4"
            style={{ backgroundColor: s.bg, borderColor: s.border }}
          >
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-600 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* PWD list with assessment status */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">PWD Welfare Status</h3>
          <span className="text-xs text-gray-400">Sorted by risk level · most critical first</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">PWD Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Disability</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Risk Level</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Last Assessment</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Assessments</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedProfiles.map((p) => {
                const openCase = cases.find((c) => c.pwdId === p.id);
                const daysSince = p.lastAssessment
                  ? Math.floor(
                      (Date.now() - new Date(p.lastAssessment).getTime()) / 86400000
                    )
                  : null;
                const overdue = daysSince !== null && daysSince > 60;
                return (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{p.fullName}</div>
                      <div className="text-xs text-gray-400">{p.pwdIdNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{p.disabilityType}</td>
                    <td className="px-4 py-3"><RiskBadge level={p.riskStatus} /></td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">
                        {p.lastAssessment || <span className="text-gray-400">Never assessed</span>}
                      </div>
                      {overdue && (
                        <div className="text-xs text-red-500 mt-0.5">{daysSince}d ago — overdue</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {openCase ? (
                        <>
                          <span className="text-sm text-gray-600">
                            Score {openCase.riskScore}/{MAX_RISK_SCORE}
                          </span>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {openCase.confirmation
                              ? `Confirmed ${openCase.confirmation.confirmedLevel}`
                              : "Awaiting confirmation"}
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">No open case</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => navigate(`/pwd-profiles/${p.id}`)}
                          title="View Profile"
                          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                          style={{ color: "#2142A6" }}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => navigate(`/assessments/new/${p.id}`)}
                          title="New Assessment"
                          className="p-1.5 rounded hover:bg-purple-50 transition-colors"
                          style={{ color: "#5B48B0" }}
                        >
                          <ClipboardList size={15} />
                        </button>
                        {openCase && (
                          <button
                            onClick={() => navigate(`/at-risk/${openCase.id}`)}
                            title="Open case — risk result and confirmation"
                            className="p-1.5 rounded hover:bg-amber-50 transition-colors text-amber-600"
                          >
                            <ShieldAlert size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          {loading ? "Loading…" : error ? error : `${profiles.length} PWDs · Click the assessment icon to file a new welfare assessment`}
        </div>
      </div>
    </div>
  );
}
