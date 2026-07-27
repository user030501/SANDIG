import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, Plus, Eye, Edit, ClipboardList } from "lucide-react";
import { DISABILITY_TYPES, PUROKS, type PwdProfile, type AtRiskCase } from "../data/mockData";
import { useApi } from "../lib/useApi";
import { RiskBadge, PwdIdBadge } from "../components/StatusBadge";
import { RiskScoreBadge, IndicatorPills } from "../components/RiskPanels";
import { Input } from "../components/ui/input";



export function PwdProfilesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterDisability, setFilterDisability] = useState("");
  const [filterIdStatus, setFilterIdStatus] = useState("");
  const [filterPurok, setFilterPurok] = useState("");

  const RISK_ORDER: Record<string, number> = { "High Risk": 0, "Moderate Risk": 1, "Low Risk": 2 };

  const { data: profileData, loading, error } = useApi<PwdProfile[]>("/pwd-profiles");
  const { data: caseData } = useApi<AtRiskCase[]>("/at-risk");
  const profiles = profileData ?? [];

  /** The open risk case for a PWD, if one exists — supplies the indicator breakdown. */
  const riskCaseFor = (pwdId: string) => (caseData ?? []).find((c) => c.pwdId === pwdId);

  const filtered = profiles
    .filter((p) => {
      const matchSearch =
        !search ||
        p.fullName.toLowerCase().includes(search.toLowerCase()) ||
        p.pwdIdNumber.toLowerCase().includes(search.toLowerCase());
      const matchDisability = !filterDisability || p.disabilityType === filterDisability;
      const matchId = !filterIdStatus || p.pwdIdStatus === filterIdStatus;
      const matchPurok = !filterPurok || p.purok === filterPurok;
      return matchSearch && matchDisability && matchId && matchPurok;
    })
    .sort((a, b) => {
      const riskDiff = RISK_ORDER[a.riskStatus] - RISK_ORDER[b.riskStatus];
      if (riskDiff !== 0) return riskDiff;
      // Secondary: oldest last assessment first (most overdue)
      return a.lastAssessment.localeCompare(b.lastAssessment);
    });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">PWD Profiles</h1>
        <button
          onClick={() => navigate("/pwd-profiles/new")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white text-sm rounded-lg hover:bg-blue-800 transition-colors"
        >
          <Plus size={16} /> Add PWD
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name or PWD ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-sm"
            />
          </div>
          <select
            value={filterDisability}
            onChange={(e) => setFilterDisability(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
          >
            <option value="">All Disability Types</option>
            {DISABILITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={filterIdStatus}
            onChange={(e) => setFilterIdStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
          >
            <option value="">All ID Statuses</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
            <option value="Pending">Pending</option>
          </select>
          <select
            value={filterPurok}
            onChange={(e) => setFilterPurok(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
          >
            <option value="">All Puroks</option>
            {PUROKS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">PWD Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Age</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Disability Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">PWD ID Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Caregiver</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Last Assessment</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Risk Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.fullName}</div>
                    <div className="text-xs text-gray-400">{p.pwdIdNumber}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{p.age}</td>
                  <td className="px-4 py-3 text-gray-700">{p.disabilityType}</td>
                  <td className="px-4 py-3"><PwdIdBadge status={p.pwdIdStatus} /></td>
                  <td className="px-4 py-3 text-gray-700">
                    {p.caregiverName === "None" ? <span className="text-gray-400">No caregiver</span> : p.caregiverName}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{p.lastAssessment}</td>
                  <td className="px-4 py-3 max-w-[220px]">
                    <div className="flex items-center gap-2 mb-1">
                      <RiskBadge level={p.riskStatus} />
                      {riskCaseFor(p.id) && <RiskScoreBadge score={riskCaseFor(p.id)!.riskScore} />}
                    </div>
                    {riskCaseFor(p.id) && <IndicatorPills indicators={riskCaseFor(p.id)!.indicators} />}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => navigate(`/pwd-profiles/${p.id}`)}
                        title="View Profile"
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => navigate(`/pwd-profiles/${p.id}/edit`)}
                        title="Edit Profile"
                        className="p-1.5 text-gray-600 hover:bg-gray-50 rounded"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => navigate(`/assessments/new/${p.id}`)}
                        title="New Assessment"
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                      >
                        <ClipboardList size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    {loading ? "Loading…" : error ? error : "No PWD profiles found matching your filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          Showing {filtered.length} of {profiles.length} records
        </div>
      </div>
    </div>
  );
}
