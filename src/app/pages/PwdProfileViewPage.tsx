import { useParams, useNavigate } from "react-router";
import { Edit, ClipboardList, ArrowRightLeft, Printer, ArrowLeft } from "lucide-react";
import { PWD_PROFILES, ASSESSMENTS, REFERRALS, AT_RISK_CASES } from "../data/mockData";
import { RiskBadge, PwdIdBadge, ReferralBadge } from "../components/StatusBadge";
import { RiskScoreBadge, IndicatorChecklist } from "../components/RiskPanels";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1">
      <span className="text-xs text-gray-500 sm:w-40 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-900 font-medium">{value || "—"}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function PwdProfileViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const profile = PWD_PROFILES.find((p) => p.id === id);
  const assessments = ASSESSMENTS.filter((a) => a.pwdId === id);
  const referrals = REFERRALS.filter((r) => r.pwdId === id);
  const riskCase = AT_RISK_CASES.find((c) => c.pwdId === id);

  if (!profile) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>PWD profile not found.</p>
        <button onClick={() => navigate("/pwd-profiles")} className="mt-4 text-blue-600 hover:underline text-sm">Back to list</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/pwd-profiles")}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.fullName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-500">{profile.pwdIdNumber}</span>
              <PwdIdBadge status={profile.pwdIdStatus} />
              <RiskBadge level={profile.riskStatus} />
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => navigate(`/pwd-profiles/${id}/edit`)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit size={15} /> Edit Profile
          </button>
          <button
            onClick={() => navigate(`/assessments/new/${id}`)}
            className="flex items-center gap-2 px-3 py-2 border border-purple-200 text-purple-700 text-sm rounded-lg hover:bg-purple-50 transition-colors"
          >
            <ClipboardList size={15} /> New Assessment
          </button>
          <button
            onClick={() => navigate("/referrals/new")}
            className="flex items-center gap-2 px-3 py-2 bg-blue-900 text-white text-sm rounded-lg hover:bg-blue-800 transition-colors"
          >
            <ArrowRightLeft size={15} /> Create Referral
          </button>
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
            <Printer size={15} /> Print
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Personal Information">
          <InfoRow label="Full Name" value={profile.fullName} />
          <InfoRow label="Date of Birth" value={profile.dateOfBirth} />
          <InfoRow label="Age" value={profile.age} />
          <InfoRow label="Sex" value={profile.sex} />
          <InfoRow label="Civil Status" value={profile.civilStatus} />
          <InfoRow label="Address" value={profile.address} />
          <InfoRow label="Contact Number" value={profile.contactNumber} />
        </Section>

        <Section title="Disability Information">
          <InfoRow label="Type of Disability" value={profile.disabilityType} />
          <InfoRow label="PWD ID Number" value={profile.pwdIdNumber} />
          <InfoRow label="PWD ID Status" value={<PwdIdBadge status={profile.pwdIdStatus} />} />
          <InfoRow label="Date Registered" value={profile.dateRegistered} />
          <InfoRow label="Assistive Device" value={profile.assistiveDevice} />
        </Section>

        <Section title="Household Information">
          <InfoRow label="Household Size" value={`${profile.householdSize} members`} />
          <InfoRow label="Living Condition" value={profile.livingCondition} />
          <InfoRow label="Income Bracket" value={profile.incomeBracket} />
          <InfoRow label="Support Situation" value={profile.supportSituation} />
        </Section>

        <Section title="Caregiver Information">
          <InfoRow label="Caregiver Name" value={profile.caregiverName} />
          <InfoRow label="Relationship" value={profile.caregiverRelationship} />
          <InfoRow label="Contact Number" value={profile.caregiverContact} />
          <InfoRow label="Availability" value={profile.caregiverAvailability} />
        </Section>
      </div>

      {/* Risk indicator breakdown — why this PWD carries their risk level */}
      {riskCase && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Risk Indicators
            </h3>
            <button
              onClick={() => navigate(`/at-risk/${riskCase.id}`)}
              className="text-xs hover:underline"
              style={{ color: "#2142A6" }}
            >
              Open case review
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <RiskScoreBadge score={riskCase.riskScore} />
                <RiskBadge level={riskCase.priorityLevel} />
                <span className="text-xs text-gray-400">rule-based</span>
              </div>
              <IndicatorChecklist indicators={riskCase.indicators} />
            </div>
            <div className="text-sm space-y-2">
              <div>
                <span className="text-xs text-gray-500 block mb-1">AI Prediction (advisory)</span>
                <RiskBadge level={riskCase.aiPrediction.predicted} />
              </div>
              <div>
                <span className="text-xs text-gray-500 block mb-1">Confirmed Risk Level</span>
                {riskCase.confirmation ? (
                  <>
                    <RiskBadge level={riskCase.confirmation.confirmedLevel} />
                    <div className="text-xs text-gray-400 mt-1">
                      Confirmed by {riskCase.confirmation.confirmedBy} — {riskCase.confirmation.confirmedAt}
                    </div>
                  </>
                ) : (
                  <span className="text-xs font-medium text-amber-600">Awaiting confirmation</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assessment History */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">
          Assessment History
        </h3>
        {assessments.length === 0 ? (
          <p className="text-sm text-gray-400">No assessments recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {assessments.map((a) => (
              <div key={a.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-900">{a.date} — Assessed by {a.assessedBy}</div>
                  <RiskBadge level={a.riskLevel} />
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Urgent Need:</span> {a.urgentNeed}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Recommended Action:</span> {a.recommendedAction}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Referral History */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 pb-2 border-b border-gray-100">
          Referral History
        </h3>
        {referrals.length === 0 ? (
          <p className="text-sm text-gray-400">No referrals recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-2 font-semibold">Referral ID</th>
                  <th className="pb-2 font-semibold">Reason</th>
                  <th className="pb-2 font-semibold">Referred To</th>
                  <th className="pb-2 font-semibold">Date</th>
                  <th className="pb-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50">
                    <td className="py-2 text-gray-600">{r.id}</td>
                    <td className="py-2 text-gray-700 max-w-[200px] truncate">{r.referralReason}</td>
                    <td className="py-2 text-gray-700">{r.referredOffice}</td>
                    <td className="py-2 text-gray-600">{r.referralDate}</td>
                    <td className="py-2"><ReferralBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
