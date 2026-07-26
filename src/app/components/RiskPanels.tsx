import { Check, Minus, AlertOctagon, Cpu, ListChecks, AlertTriangle } from "lucide-react";
import type { RiskLevel } from "../data/mockData";
import {
  RISK_INDICATORS,
  MAX_RISK_SCORE,
  bandFor,
  computeRuleBasedScore,
  rankedProbabilities,
  FOLLOW_UP_CLASSES,
  type RiskIndicators,
  type AiPrediction,
  type FollowUpStatus,
} from "../data/riskModel";
import { RiskBadge } from "./StatusBadge";

/** Rule-based point total shown against the maximum attainable score. */
export function RiskScoreBadge({ score }: { score: number }) {
  const band = bandFor(
    score >= 9 ? "High Risk" : score >= 5 ? "Moderate Risk" : "Low Risk"
  );
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold"
      style={{ backgroundColor: band.bg, color: band.color }}
      title={`Rule-based score — Low 0–4 · Moderate 5–8 · High 9+ (max ${MAX_RISK_SCORE})`}
    >
      {score} / {MAX_RISK_SCORE}
    </span>
  );
}

export function FollowUpBadge({ status }: { status: FollowUpStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${FOLLOW_UP_CLASSES[status]}`}>
      {status}
    </span>
  );
}

/**
 * The six scoring indicators for one PWD, showing which are present and the
 * points each contributes — so a case is never just an unexplained number.
 */
export function IndicatorChecklist({ indicators }: { indicators: RiskIndicators }) {
  return (
    <ul className="space-y-1.5">
      {RISK_INDICATORS.map((ind) => {
        const present = indicators[ind.key];
        return (
          <li
            key={ind.key}
            className="flex items-start gap-2.5 text-sm"
            title={ind.description}
          >
            <span
              className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${
                present ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-300"
              }`}
            >
              {present ? <Check size={11} strokeWidth={3} /> : <Minus size={11} strokeWidth={3} />}
            </span>
            <span className={`flex-1 ${present ? "text-gray-800" : "text-gray-400"}`}>
              {ind.label}
              {ind.doubleWeighted && (
                <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-orange-600">
                  ×2
                </span>
              )}
            </span>
            <span className={`text-xs font-medium tabular-nums ${present ? "text-gray-700" : "text-gray-300"}`}>
              {present ? `+${ind.weight}` : "0"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** Compact inline summary of present indicators, for table rows. */
export function IndicatorPills({ indicators }: { indicators: RiskIndicators }) {
  const present = RISK_INDICATORS.filter((i) => indicators[i.key]);
  if (present.length === 0) {
    return <span className="text-xs text-gray-400">No indicators present</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {present.map((i) => (
        <span
          key={i.key}
          title={`${i.description} (+${i.weight})`}
          className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
            i.doubleWeighted
              ? "bg-orange-50 text-orange-700 border-orange-200"
              : "bg-red-50 text-red-700 border-red-100"
          }`}
        >
          {i.label}
          {i.doubleWeighted && " ×2"}
        </span>
      ))}
    </div>
  );
}

/** Left half of the dual result — the deterministic, authoritative score. */
export function RuleBasedCard({ indicators }: { indicators: RiskIndicators }) {
  const result = computeRuleBasedScore(indicators);
  const band = bandFor(result.level);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <ListChecks size={16} style={{ color: "#2142A6" }} />
        <h3 className="font-semibold text-gray-800">Rule-Based Score</h3>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Deterministic total from the six health indicators
      </p>

      <div
        className="rounded-xl border p-4 mb-4"
        style={{ backgroundColor: band.bg, borderColor: band.border }}
      >
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold tabular-nums" style={{ color: band.color }}>
              {result.score}
              <span className="text-base font-medium text-gray-400"> / {MAX_RISK_SCORE}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">points</div>
          </div>
          <RiskBadge level={result.level} />
        </div>
        <div className="text-xs mt-3" style={{ color: band.color }}>
          {band.range} → {band.level}
        </div>
      </div>

      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Contributing Indicators
      </p>
      <IndicatorChecklist indicators={indicators} />

      {result.triggersImmediateReview && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
          <AlertOctagon size={14} className="text-orange-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-orange-800">
            <span className="font-semibold">Immediate review required.</span> An urgent medical
            condition is recorded — this indicator is weighted double and auto-triggers review.
          </p>
        </div>
      )}
    </div>
  );
}

/** Right half of the dual result — advisory model output only. */
export function AiPredictionCard({ prediction }: { prediction: AiPrediction }) {
  const ranked = rankedProbabilities(prediction);
  const band = bandFor(prediction.predicted);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <Cpu size={16} style={{ color: "#5B48B0" }} />
        <h3 className="font-semibold text-gray-800">AI Prediction</h3>
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
          Random Forest
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-4">Model estimate with class probabilities</p>

      <div
        className="rounded-xl border p-4 mb-4"
        style={{ backgroundColor: band.bg, borderColor: band.border }}
      >
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold tabular-nums" style={{ color: band.color }}>
              {ranked[0].pct}%
            </div>
            <div className="text-xs text-gray-500 mt-1">confidence in predicted tier</div>
          </div>
          <RiskBadge level={prediction.predicted} />
        </div>
      </div>

      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Class Probabilities
      </p>
      <div className="space-y-2">
        {ranked.map((r) => {
          const rb = bandFor(r.level);
          return (
            <div key={r.level}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">{r.level}</span>
                <span className="font-medium tabular-nums text-gray-700">{r.pct}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-gray-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${r.pct}%`, backgroundColor: rb.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2">
        <p className="text-xs text-purple-800">
          <span className="font-semibold">Advisory only.</span> This prediction supports but does
          not replace the rule-based score or the Administrator's confirmation.
        </p>
      </div>
    </div>
  );
}

export function DisagreementFlag({ ruleLevel, aiLevel }: { ruleLevel: RiskLevel; aiLevel: RiskLevel }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
      <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
      <p className="text-xs text-amber-800">
        <span className="font-semibold">Disagreement flagged.</span> Rule-based score says{" "}
        <span className="font-medium">{ruleLevel}</span>, AI prediction says{" "}
        <span className="font-medium">{aiLevel}</span>. Administrator review required.
      </p>
    </div>
  );
}
