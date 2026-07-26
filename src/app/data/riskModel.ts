// ─────────────────────────────────────────────────────────────────────────────
// SANDIG risk model — single source of truth for risk scoring across all screens.
//
// The system uses exactly three tiers (Low / Moderate / High) and six health
// indicators. Every screen that shows a score, tier, legend or filter reads
// from this module so the classification scheme can never drift between pages.
// ─────────────────────────────────────────────────────────────────────────────

import type { RiskLevel } from "./mockData";

export type RiskIndicatorKey =
  | "unresolvedHealthNeed"
  | "pendingReferral"
  | "missedCheckup"
  | "medicationConcern"
  | "treatmentTherapyNeed"
  | "urgentMedicalCondition";

export interface RiskIndicator {
  key: RiskIndicatorKey;
  label: string;
  weight: number;
  /** Urgent Medical Condition is weighted double and forces immediate review. */
  doubleWeighted?: boolean;
  description: string;
}

/** Base weight per indicator; the urgent indicator counts double. */
export const INDICATOR_WEIGHT = 3;

export const RISK_INDICATORS: RiskIndicator[] = [
  {
    key: "unresolvedHealthNeed",
    label: "Unresolved Health Need",
    weight: INDICATOR_WEIGHT,
    description: "A reported health need has not yet been addressed",
  },
  {
    key: "pendingReferral",
    label: "Pending Referral",
    weight: INDICATOR_WEIGHT,
    description: "An open referral has not been acted on by the receiving office",
  },
  {
    key: "missedCheckup",
    label: "Missed Checkup",
    weight: INDICATOR_WEIGHT,
    description: "Scheduled medical checkup was missed or attendance is irregular",
  },
  {
    key: "medicationConcern",
    label: "Medication Concern",
    weight: INDICATOR_WEIGHT,
    description: "Medication is inaccessible, unaffordable or not taken regularly",
  },
  {
    key: "treatmentTherapyNeed",
    label: "Treatment or Therapy Need",
    weight: INDICATOR_WEIGHT,
    description: "Prescribed treatment or therapy has not been received",
  },
  {
    key: "urgentMedicalCondition",
    label: "Urgent Medical Condition",
    weight: INDICATOR_WEIGHT * 2,
    doubleWeighted: true,
    description: "Urgent condition reported — weighted double, triggers immediate review",
  },
];

/** Highest attainable rule-based total (5 × 3 + 6 = 21). */
export const MAX_RISK_SCORE = RISK_INDICATORS.reduce((sum, i) => sum + i.weight, 0);

/** Indicator flags recorded for a single PWD during assessment. */
export type RiskIndicators = Record<RiskIndicatorKey, boolean>;

// ── Tier bands ───────────────────────────────────────────────────────────────
// Exactly three tiers. There is no "Elevated" tier in SANDIG.

export interface RiskBand {
  level: RiskLevel;
  min: number;
  max: number;
  range: string;
  color: string;
  bg: string;
  border: string;
}

export const RISK_BANDS: RiskBand[] = [
  { level: "High Risk", min: 9, max: Infinity, range: "9 and above", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  { level: "Moderate Risk", min: 5, max: 8, range: "5–8", color: "#ca8a04", bg: "#fefce8", border: "#fef08a" },
  { level: "Low Risk", min: 0, max: 4, range: "0–4", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
];

/** Map a rule-based point total to its tier. Low 0–4 · Moderate 5–8 · High 9+. */
export function tierFromScore(score: number): RiskLevel {
  if (score >= 9) return "High Risk";
  if (score >= 5) return "Moderate Risk";
  return "Low Risk";
}

export function bandFor(level: RiskLevel): RiskBand {
  return RISK_BANDS.find((b) => b.level === level)!;
}

/** Sort helper — most critical first. */
export const RISK_ORDER: Record<RiskLevel, number> = {
  "High Risk": 0,
  "Moderate Risk": 1,
  "Low Risk": 2,
};

// ── Rule-based scoring ───────────────────────────────────────────────────────

export interface RuleBasedResult {
  score: number;
  level: RiskLevel;
  present: RiskIndicator[];
  absent: RiskIndicator[];
  /** True when the urgent indicator is set — case must be reviewed immediately. */
  triggersImmediateReview: boolean;
}

export function computeRuleBasedScore(indicators: RiskIndicators): RuleBasedResult {
  const present = RISK_INDICATORS.filter((i) => indicators[i.key]);
  const absent = RISK_INDICATORS.filter((i) => !indicators[i.key]);
  const score = present.reduce((sum, i) => sum + i.weight, 0);
  return {
    score,
    level: tierFromScore(score),
    present,
    absent,
    triggersImmediateReview: indicators.urgentMedicalCondition === true,
  };
}

export function emptyIndicators(): RiskIndicators {
  return RISK_INDICATORS.reduce((acc, i) => {
    acc[i.key] = false;
    return acc;
  }, {} as RiskIndicators);
}

// ── AI prediction (Random Forest) ────────────────────────────────────────────
// Advisory only. Never replaces the rule-based score or the human confirmation.

export interface AiPrediction {
  predicted: RiskLevel;
  /** Class probabilities; keys sum to 1. */
  probabilities: Record<RiskLevel, number>;
}

/** Probabilities ordered highest-first, formatted for display. */
export function rankedProbabilities(p: AiPrediction): { level: RiskLevel; pct: number }[] {
  return (Object.keys(p.probabilities) as RiskLevel[])
    .map((level) => ({ level, pct: Math.round(p.probabilities[level] * 100) }))
    .sort((a, b) => b.pct - a.pct);
}

/** True when the rule-based tier and the AI tier do not match. */
export function isDisagreement(ruleLevel: RiskLevel, aiLevel: RiskLevel): boolean {
  return ruleLevel !== aiLevel;
}

/** The more severe of the two tiers — used to pre-fill the confirmation control. */
export function higherTier(a: RiskLevel, b: RiskLevel): RiskLevel {
  return RISK_ORDER[a] <= RISK_ORDER[b] ? a : b;
}

// ── Follow-up status ─────────────────────────────────────────────────────────
// Deliberately distinct from the referral status vocabulary (Pending, Received,
// In Progress, Completed, Escalated, Cancelled), which applies to referrals only.

export type FollowUpStatus = "Scheduled" | "Completed" | "Overdue" | "Missed";

export const FOLLOW_UP_STATUSES: FollowUpStatus[] = ["Scheduled", "Completed", "Overdue", "Missed"];

export const FOLLOW_UP_CLASSES: Record<FollowUpStatus, string> = {
  Scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  Completed: "bg-green-50 text-green-700 border-green-200",
  Overdue: "bg-red-50 text-red-700 border-red-200",
  Missed: "bg-gray-100 text-gray-600 border-gray-300",
};
