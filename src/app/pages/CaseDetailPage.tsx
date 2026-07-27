import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft, ArrowRightLeft, UserCircle, ShieldCheck, Clock, Pencil,
} from "lucide-react";
import type { AtRiskCase, PwdProfile, RiskLevel } from "../data/mockData";
import { useApi } from "../lib/useApi";
import { api } from "../lib/api";
import {
  computeRuleBasedScore, isDisagreement, higherTier, bandFor,
} from "../data/riskModel";
import { RiskBadge } from "../components/StatusBadge";
import {
  RuleBasedCard, AiPredictionCard, DisagreementFlag, FollowUpBadge,
} from "../components/RiskPanels";
import { useAuth } from "../context/AuthContext";

const LEVELS: RiskLevel[] = ["Low Risk", "Moderate Risk", "High Risk"];

export function CaseDetailPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: record, loading, error, refetch } = useApi<AtRiskCase>(
    caseId ? `/at-risk/${caseId}` : null, [caseId]
  );
  const { data: profile } = useApi<PwdProfile>(
    record ? `/pwd-profiles/${record.pwdId}` : null, [record?.pwdId]
  );

  const [selected, setSelected] = useState<RiskLevel | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const confirmation = record?.confirmation ?? null;

  // The rule-based result is recomputed from the indicators rather than read
  // from the stored score, so the displayed total always matches the checklist.
  const rule = record ? computeRuleBasedScore(record.indicators) : null;

  // Pre-fill the confirmation control with the more severe of the two results.
  const suggested: RiskLevel =
    record && rule
      ? record.aiPrediction
        ? higherTier(rule.level, record.aiPrediction.predicted)
        : rule.level
      : "Low Risk";

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-400">
        Loading case…
      </div>
    );
  }

  if (!record || !rule) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <p className="text-gray-500">{error ?? "Case not found."}</p>
        <button onClick={() => navigate("/at-risk")} className="mt-3 text-sm hover:underline" style={{ color: "#2142A6" }}>
          Back to Health-Risk Cases
        </button>
      </div>
    );
  }

  const disagree = record.aiPrediction
    ? isDisagreement(rule.level, record.aiPrediction.predicted)
    : false;
  const chosen = selected ?? confirmation?.confirmedLevel ?? suggested;

  async function confirmLevel() {
    if (!record) return;
    setSubmitting(true);
    setActionError(null);
    try {
      // The server records who confirmed and when, and decides `overridden`.
      await api.post(`/assessments/${record.assessmentId}/confirm`, {
        confirmedLevel: chosen,
      });
      setSelected(null);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not save the confirmation.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{record.pwdName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Case {record.id.toUpperCase()}
            {profile && ` · ${profile.pwdIdNumber} · ${profile.disabilityType}`}
            {` · Flagged ${record.dateFlagged}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/pwd-profiles/${record.pwdId}`)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UserCircle size={15} /> View Profile
          </button>
          <button
            onClick={() => navigate("/referrals/new")}
            className="flex items-center gap-2 px-3 py-2 text-white text-sm rounded-lg transition-colors"
            style={{ backgroundColor: "#2142A6" }}
          >
            <ArrowRightLeft size={15} /> Create Referral
          </button>
        </div>
      </div>

      {/* Case summary strip */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-gray-400 mb-1">Follow-Up Status</div>
          <FollowUpBadge status={record.followUpStatus} />
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Case Status</div>
          <div className="text-sm font-medium text-gray-800">{record.status}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Last Assessment</div>
          <div className="text-sm font-medium text-gray-800">{record.lastAssessment}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">Confirmed Level</div>
          {confirmation
            ? <RiskBadge level={confirmation.confirmedLevel} />
            : <span className="text-xs text-amber-600 font-medium">Awaiting confirmation</span>}
        </div>
      </div>

      {/* Flag reason */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Flag Reason</p>
        <p className="text-sm text-gray-700 leading-relaxed">{record.flagReason}</p>
      </div>

      {/* ── Dual risk result ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Risk Assessment Result
          </h2>
          <span className="text-xs text-gray-400">
            Two independent results — neither is final until confirmed below
          </span>
        </div>

        {disagree && (
          <div className="mb-3">
            <DisagreementFlag ruleLevel={rule.level} aiLevel={record.aiPrediction!.predicted} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <RuleBasedCard indicators={record.indicators} />
          {record.aiPrediction ? (
            <AiPredictionCard prediction={record.aiPrediction} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-center text-center">
              <p className="text-sm text-gray-400">
                No AI prediction recorded. The model service was unreachable when this
                assessment was filed — the rule-based score stands on its own.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Human confirmation ── */}
      <div className="bg-white rounded-xl border-2 p-5" style={{ borderColor: confirmation ? "#bbf7d0" : "#fed7aa" }}>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={16} style={{ color: confirmation ? "#16a34a" : "#ea580c" }} />
          <h3 className="font-semibold text-gray-800">Confirmed Risk Level</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          The Administrator sets the final risk level. Automated results are decision support only.
        </p>

        {actionError && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-lg text-xs">
            {actionError}
          </div>
        )}

        {confirmation ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="rounded-xl border px-4 py-3"
                style={{
                  backgroundColor: bandFor(confirmation.confirmedLevel).bg,
                  borderColor: bandFor(confirmation.confirmedLevel).border,
                }}
              >
                <div className="text-lg font-bold" style={{ color: bandFor(confirmation.confirmedLevel).color }}>
                  {confirmation.confirmedLevel}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-gray-400" />
                  Confirmed by{" "}
                  <span className="font-medium text-gray-800">{confirmation.confirmedBy}</span> —{" "}
                  {confirmation.confirmedAt}
                </div>
                {confirmation.overridden && (
                  <div className="text-xs text-amber-600 mt-0.5">
                    Overridden — differs from the suggested {suggested}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelected(chosen)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Pencil size={14} /> Change
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {LEVELS.map((lvl) => {
                const b = bandFor(lvl);
                const active = chosen === lvl;
                return (
                  <button
                    key={lvl}
                    onClick={() => setSelected(lvl)}
                    className="px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors"
                    style={{
                      backgroundColor: active ? b.bg : "#fff",
                      borderColor: active ? b.color : "#e5e7eb",
                      color: active ? b.color : "#6b7280",
                    }}
                  >
                    {lvl}
                    {lvl === suggested && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide opacity-70">Suggested</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={confirmLevel}
                className="px-5 py-2 text-white text-sm rounded-lg transition-colors"
                disabled={submitting}
                style={{ backgroundColor: chosen === suggested ? "#16a34a" : "#ea580c", opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? "Saving…" : chosen === suggested ? "Confirm" : `Override to ${chosen}`}
              </button>
              <span className="text-xs text-gray-500">
                Pre-filled with <span className="font-medium">{suggested}</span> —{" "}
                {record.aiPrediction
                  ? `the higher of the rule-based (${rule.level}) and AI (${record.aiPrediction.predicted}) results.`
                  : `the rule-based result (${rule.level}). No AI prediction is available.`}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
