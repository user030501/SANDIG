import { useState } from "react";
import { FileText, Printer, Download } from "lucide-react";
import {
  DISABILITY_TYPES, PUROKS,
  type PwdProfile, type Referral, type AtRiskCase,
} from "../data/mockData";
import { useApi } from "../lib/useApi";
import { MAX_RISK_SCORE } from "../data/riskModel";
import { RiskBadge, ReferralBadge } from "../components/StatusBadge";
import { FollowUpBadge } from "../components/RiskPanels";

const REPORT_TYPES = [
  { id: "master", label: "PWD Master List", description: "Complete list of all registered PWDs" },
  { id: "risk-summary", label: "Health-Risk Summary", description: "PWDs by health-risk level — High, Moderate, Low" },
  { id: "atrisk", label: "Health-Risk Cases Report", description: "Flagged cases with risk score and follow-up status" },
  { id: "welfare", label: "Common Health Concerns Report", description: "Most frequent health concerns across all PWDs" },
  { id: "referral-summary", label: "Referral Summary", description: "All referrals grouped by type and status" },
  { id: "pending-referrals", label: "Pending Referrals", description: "Referrals still awaiting action" },
  { id: "followup", label: "Follow-Up Schedule", description: "Upcoming follow-up dates for active referrals" },
  { id: "assessment", label: "Assessment History", description: "Health assessment history per PWD" },
];

const healthConcerns = [
  { concern: "Missed or irregular checkup", count: 5, pct: 63 },
  { concern: "Unresolved medication concern", count: 4, pct: 50 },
  { concern: "Therapy follow-up overdue", count: 4, pct: 50 },
  { concern: "Treatment not yet received", count: 3, pct: 38 },
  { concern: "Assistive device needs repair", count: 3, pct: 38 },
  { concern: "Urgent medical condition reported", count: 2, pct: 25 },
];

/** Maps the on-screen report picker to the server's export endpoints. */
const REPORT_EXPORT_TYPE: Record<string, string> = {
  master: "pwd",
  "risk-summary": "risk",
  atrisk: "risk",
  welfare: "summary",
  "referral-summary": "referral",
  "pending-referrals": "referral",
  followup: "follow-up",
  assessment: "assessment",
};

export function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState("master");
  const [filterDisability, setFilterDisability] = useState("");
  const [filterRisk, setFilterRisk] = useState("");
  const [filterReferralStatus, setFilterReferralStatus] = useState("");
  const [filterPurok, setFilterPurok] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [generated, setGenerated] = useState(false);

  const currentReport = REPORT_TYPES.find((r) => r.id === selectedReport);

  const { data: profileData, loading, error } = useApi<PwdProfile[]>("/pwd-profiles");
  const { data: referralData } = useApi<Referral[]>("/referrals");
  const { data: caseData } = useApi<AtRiskCase[]>("/at-risk");

  const allProfiles = profileData ?? [];
  const allReferrals = referralData ?? [];
  const allCases = caseData ?? [];

  /**
   * FR-21 export. The CSV is built server-side and streamed as a download, so
   * the browser saves exactly what the server generated.
   */
  function exportCsv(type: string) {
    window.open(`/api/reports/${type}?format=csv`, "_blank");
  }

  const filteredPwds = allProfiles.filter((p) => {
    const matchDisability = !filterDisability || p.disabilityType === filterDisability;
    const matchRisk = !filterRisk || p.riskStatus === filterRisk;
    const matchPurok = !filterPurok || p.purok === filterPurok;
    return matchDisability && matchRisk && matchPurok;
  });

  const filteredReferrals = allReferrals.filter(
    (r) => !filterReferralStatus || r.status === filterReferralStatus
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Generate, view, and export system reports</p>
        </div>
        {generated && (
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Printer size={15} /> Print / Save as PDF
            </button>
            <button
              onClick={() => exportCsv(REPORT_EXPORT_TYPE[selectedReport] ?? "summary")}
              className="flex items-center gap-2 px-4 py-2 text-white text-sm rounded-lg transition-colors"
              style={{ backgroundColor: "#2142A6" }}
            >
              <Download size={15} /> Export CSV
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Report selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Report Type</h3>
          <div className="space-y-1.5">
            {REPORT_TYPES.map((r) => (
              <button
                key={r.id}
                onClick={() => { setSelectedReport(r.id); setGenerated(false); }}
                className="w-full text-left px-3 py-3 rounded-lg border transition-colors"
                style={
                  selectedReport === r.id
                    ? { backgroundColor: "#EEF0FF", borderColor: "#2142A6", color: "#2142A6" }
                    : { backgroundColor: "transparent", borderColor: "#f3f4f6", color: "#374151" }
                }
              >
                <div className="text-sm font-medium">{r.label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{r.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Filters + output */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Filters</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Date From</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Date To</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Disability Type</label>
                <select value={filterDisability} onChange={(e) => setFilterDisability(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">All Types</option>
                  {DISABILITY_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Risk Level</label>
                <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">All Levels</option>
                  <option>Low Risk</option>
                  <option>Moderate Risk</option>
                  <option>High Risk</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Referral Status</label>
                <select value={filterReferralStatus} onChange={(e) => setFilterReferralStatus(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">All Statuses</option>
                  <option>Pending</option>
                  <option>Received</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>Escalated</option>
                  <option>Cancelled</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Purok / Area</label>
                <select value={filterPurok} onChange={(e) => setFilterPurok(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">All Puroks</option>
                  {PUROKS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={() => setGenerated(true)}
              className="mt-4 flex items-center gap-2 px-5 py-2 text-white text-sm rounded-lg transition-colors"
              style={{ backgroundColor: "#2142A6" }}
            >
              <FileText size={15} /> Generate Report
            </button>
          </div>

          {/* Report output */}
          {generated && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{currentReport?.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Barangay New Pandan · Generated: June 17, 2026
                  </div>
                </div>
              </div>

              {/* PWD Master List / Assessment History */}
              {(selectedReport === "master" || selectedReport === "assessment") && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Name</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Age / Sex</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Disability</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Purok</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Risk</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Last Assessment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPwds.map((p) => (
                        <tr key={p.id} className="border-b border-gray-100">
                          <td className="px-4 py-2 font-medium text-gray-900">{p.fullName}</td>
                          <td className="px-4 py-2 text-gray-600">{p.age} / {p.sex}</td>
                          <td className="px-4 py-2 text-gray-600">{p.disabilityType}</td>
                          <td className="px-4 py-2 text-gray-600">{p.purok}</td>
                          <td className="px-4 py-2"><RiskBadge level={p.riskStatus} /></td>
                          <td className="px-4 py-2 text-gray-600">{p.lastAssessment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Health-Risk Summary */}
              {selectedReport === "risk-summary" && (
                <div className="p-5 space-y-4">
                  {(["High Risk", "Moderate Risk", "Low Risk"] as const).map((level) => {
                    const group = filteredPwds.filter((p) => p.riskStatus === level);
                    return (
                      <div key={level}>
                        <div className="flex items-center gap-2 mb-2">
                          <RiskBadge level={level} />
                          <span className="text-sm text-gray-500">{group.length} PWD{group.length !== 1 ? "s" : ""}</span>
                        </div>
                        {group.length > 0 ? (
                          <div className="space-y-1">
                            {group.map((p) => (
                              <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 text-sm">
                                <span className="font-medium text-gray-800">{p.fullName}</span>
                                <span className="text-xs text-gray-400">{p.disabilityType} · {p.purok}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No PWDs at this level.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Health-Risk Cases */}
              {selectedReport === "atrisk" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">PWD Name</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Risk Score</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Priority</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Flag Reason</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Follow-Up</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allCases.filter((c) => !filterRisk || c.priorityLevel === filterRisk).map((c) => (
                        <tr key={c.id} className="border-b border-gray-100">
                          <td className="px-4 py-2 font-medium text-gray-900">{c.pwdName}</td>
                          <td className="px-4 py-2 font-bold" style={{ color: "#2142A6" }}>{c.riskScore} / {MAX_RISK_SCORE}</td>
                          <td className="px-4 py-2"><RiskBadge level={c.priorityLevel} /></td>
                          <td className="px-4 py-2 text-gray-600 max-w-[200px] truncate">{c.flagReason}</td>
                          <td className="px-4 py-2"><FollowUpBadge status={c.followUpStatus} /></td>
                          <td className="px-4 py-2 text-gray-600">{c.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Common Health Concerns */}
              {selectedReport === "welfare" && (
                <div className="p-5 space-y-3">
                  <p className="text-xs text-gray-500 mb-4">Frequency of health concerns identified during welfare assessments across all registered PWDs.</p>
                  {healthConcerns.map((item) => (
                    <div key={item.concern}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{item.concern}</span>
                        <span className="text-gray-500 font-medium text-xs">{item.count} PWDs ({item.pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: "#2142A6" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Referral Summary */}
              {selectedReport === "referral-summary" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">PWD Name</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Need</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Receiver / Office</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Status</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Outcome</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReferrals.map((r) => (
                        <tr key={r.id} className="border-b border-gray-100">
                          <td className="px-4 py-2 font-medium text-gray-900">{r.pwdName}</td>
                          <td className="px-4 py-2 text-gray-600">{r.identifiedNeed}</td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            <div>{r.referredOffice}</div>
                            <div className="text-gray-400">{r.receiverName}</div>
                          </td>
                          <td className="px-4 py-2"><ReferralBadge status={r.status} /></td>
                          <td className="px-4 py-2 text-xs text-gray-500">{r.outcome || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pending Referrals */}
              {selectedReport === "pending-referrals" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">PWD Name</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Reason</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Need</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Referred To</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Priority</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Referral Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allReferrals.filter((r) => r.status === "Pending" || r.status === "Received" || r.status === "In Progress").map((r) => (
                        <tr key={r.id} className="border-b border-gray-100">
                          <td className="px-4 py-2 font-medium text-gray-900">{r.pwdName}</td>
                          <td className="px-4 py-2 text-xs" style={{ color: "#2142A6" }}>{r.referralReason}</td>
                          <td className="px-4 py-2 text-gray-600">{r.identifiedNeed}</td>
                          <td className="px-4 py-2 text-gray-600">{r.referredOffice}</td>
                          <td className="px-4 py-2"><RiskBadge level={r.priorityLevel} /></td>
                          <td className="px-4 py-2 text-gray-600">{r.referralDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Follow-Up Schedule */}
              {selectedReport === "followup" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">PWD Name</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Need</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Referred To</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Receiver</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Referral Status</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Follow-Up Date</th>
                        <th className="text-left px-4 py-2 font-semibold text-gray-600">Follow-Up Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReferrals
                        .filter((r) => r.status !== "Completed" && r.status !== "Cancelled" && r.followUpDate)
                        .sort((a, b) => a.followUpDate.localeCompare(b.followUpDate))
                        .map((r) => (
                          <tr key={r.id} className="border-b border-gray-100">
                            <td className="px-4 py-2 font-medium text-gray-900">{r.pwdName}</td>
                            <td className="px-4 py-2 text-gray-600">{r.identifiedNeed}</td>
                            <td className="px-4 py-2 text-gray-600">{r.referredOffice}</td>
                            <td className="px-4 py-2 text-xs text-gray-500">{r.receiverName}</td>
                            <td className="px-4 py-2"><ReferralBadge status={r.status} /></td>
                            <td className="px-4 py-2 text-gray-600 font-medium">{r.followUpDate}</td>
                            <td className="px-4 py-2"><FollowUpBadge status={r.followUpStatus} /></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {!generated && (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
              <FileText size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a report type and click <strong>Generate Report</strong></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
