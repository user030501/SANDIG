import { useState } from "react";
import { Search, Save, ClipboardList, ArrowRightLeft } from "lucide-react";
import { type PwdProfile } from "../data/mockData";
import { useApi } from "../lib/useApi";
import { FOLLOW_UP_STATUSES } from "../data/riskModel";
import { RiskBadge, PwdIdBadge } from "../components/StatusBadge";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

export function MobileCaseUpdatePage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PwdProfile | null>(null);
  const [caseNote, setCaseNote] = useState("");
  const [referralStatus, setReferralStatus] = useState("Pending");
  const [followUpStatus, setFollowUpStatus] = useState<string>("Scheduled");
  const [quickAssessment, setQuickAssessment] = useState("");
  const [saved, setSaved] = useState<string | null>(null);

  const { data: profileData } = useApi<PwdProfile[]>("/pwd-profiles");
  const profiles = profileData ?? [];

  const results = search.length >= 2
    ? profiles.filter((p) => p.fullName.toLowerCase().includes(search.toLowerCase()))
    : [];

  function handleSaveCaseNote() {
    setSaved("case_note");
    setCaseNote("");
    setTimeout(() => setSaved(null), 2000);
  }

  function handleUpdateAssessment() {
    setSaved("assessment");
    setQuickAssessment("");
    setTimeout(() => setSaved(null), 2000);
  }

  function handleUpdateReferral() {
    setSaved("referral");
    setTimeout(() => setSaved(null), 2000);
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mobile Case Update</h1>
        <p className="text-sm text-gray-500 mt-1">BHW / Field Worker quick update tool</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
            placeholder="Search PWD by name..."
            className="pl-10 py-3 text-base"
          />
        </div>
        {results.length > 0 && !selected && (
          <div className="mt-2 border border-gray-100 rounded-lg overflow-hidden">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => { setSelected(p); setSearch(p.fullName); }}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
              >
                <div>
                  <div className="font-medium text-gray-900">{p.fullName}</div>
                  <div className="text-xs text-gray-400">{p.pwdIdNumber} · {p.disabilityType}</div>
                </div>
                <RiskBadge level={p.riskStatus} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected profile summary */}
      {selected && (
        <>
          <div className="bg-blue-900 rounded-xl p-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">{selected.fullName}</h2>
                <p className="text-blue-200 text-sm mt-0.5">{selected.pwdIdNumber} · {selected.disabilityType}</p>
                <p className="text-blue-200 text-sm">{selected.purok}</p>
              </div>
              <RiskBadge level={selected.riskStatus} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
              <div className="bg-blue-800 rounded-lg p-3">
                <div className="text-blue-300 text-xs mb-1">Caregiver</div>
                <div className="font-medium">{selected.caregiverName === "None" ? "No caregiver" : selected.caregiverName}</div>
              </div>
              <div className="bg-blue-800 rounded-lg p-3">
                <div className="text-blue-300 text-xs mb-1">PWD ID Status</div>
                <div className="font-medium">{selected.pwdIdStatus}</div>
              </div>
              <div className="bg-blue-800 rounded-lg p-3">
                <div className="text-blue-300 text-xs mb-1">Last Assessment</div>
                <div className="font-medium">{selected.lastAssessment}</div>
              </div>
              <div className="bg-blue-800 rounded-lg p-3">
                <div className="text-blue-300 text-xs mb-1">Assistive Device</div>
                <div className="font-medium">{selected.assistiveDevice || "None"}</div>
              </div>
            </div>
          </div>

          {/* Toast notification */}
          {saved && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm text-center">
              {saved === "case_note" && "Case note saved successfully."}
              {saved === "assessment" && "Assessment update saved."}
              {saved === "referral" && "Referral status updated."}
            </div>
          )}

          {/* Case note */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Add Case Note</h3>
            <textarea
              value={caseNote}
              onChange={(e) => setCaseNote(e.target.value)}
              placeholder="Describe home visit observations, concerns, or notes..."
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white resize-none mb-3"
            />
            <Button
              onClick={handleSaveCaseNote}
              disabled={!caseNote.trim()}
              className="w-full flex items-center justify-center gap-2 bg-blue-900 hover:bg-blue-800 py-3 text-base"
            >
              <Save size={18} /> Save Case Note
            </Button>
          </div>

          {/* Quick assessment update */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Quick Assessment Update</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Current Concern / Observation</label>
                <Input
                  value={quickAssessment}
                  onChange={(e) => setQuickAssessment(e.target.value)}
                  placeholder="Brief description of current condition"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Risk Level Update</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white">
                  <option>No change</option>
                  <option>Low Risk</option>
                  <option>Moderate Risk</option>
                  <option>High Risk</option>
                </select>
              </div>
            </div>
            <Button
              onClick={handleUpdateAssessment}
              disabled={!quickAssessment.trim()}
              className="w-full mt-3 flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-800 py-3 text-base"
            >
              <ClipboardList size={18} /> Update Assessment
            </Button>
          </div>

          {/* Referral follow-up */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Referral Follow-Up Update</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Referral Status</label>
                <select
                  value={referralStatus}
                  onChange={(e) => setReferralStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
                >
                  <option>Pending</option>
                  <option>Received</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>Escalated</option>
                  <option>Cancelled</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Follow-Up Status</label>
                <select
                  value={followUpStatus}
                  onChange={(e) => setFollowUpStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
                >
                  {FOLLOW_UP_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Follow-Up Result</label>
                <textarea
                  placeholder="Describe the outcome of the follow-up visit"
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white resize-none"
                />
              </div>
            </div>
            <Button
              onClick={handleUpdateReferral}
              className="w-full mt-3 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 py-3 text-base"
            >
              <ArrowRightLeft size={18} /> Update Referral Status
            </Button>
          </div>
        </>
      )}

      {!selected && search.length < 2 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <Search size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Search for a PWD to start a case update</p>
        </div>
      )}
    </div>
  );
}
