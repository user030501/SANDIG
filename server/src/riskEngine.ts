// Authoritative rule-based health-risk scoring (FR-07).
//
// The manuscript (Section 1.2) defines the formula explicitly:
//
//   Health Risk Score = (Unresolved Health Need    x 2)
//                     + (Pending Referral          x 2)
//                     + (Missed Checkup            x 2)
//                     + (Medication Concern        x 2)
//                     + (Treatment/Therapy Need    x 2)
//                     + (Urgent Medical Condition  x 4)
//
//   Maximum score 14. Tiers: Low 0-4, Moderate 5-8, High 9 and above.
//
// The client keeps an identical live preview in WelfareAssessmentPage for UX,
// but the value persisted and used for referral logic is always this one.

import type { RiskLevel } from "@prisma/client";

/** Bump when the formula or thresholds change — recorded per assessment (FR-25). */
export const RULE_VERSION = "rule-v1";

export const INDICATOR_WEIGHT = 2;
export const URGENT_WEIGHT = 4;

export const INDICATOR_KEYS = [
  "unresolvedHealthNeed",
  "pendingReferral",
  "missedCheckup",
  "medicationConcern",
  "treatmentTherapyNeed",
  "urgentMedicalCondition",
] as const;

export type IndicatorKey = (typeof INDICATOR_KEYS)[number];
export type Indicators = Record<IndicatorKey, boolean>;

export const INDICATOR_WEIGHTS: Record<IndicatorKey, number> = {
  unresolvedHealthNeed: INDICATOR_WEIGHT,
  pendingReferral: INDICATOR_WEIGHT,
  missedCheckup: INDICATOR_WEIGHT,
  medicationConcern: INDICATOR_WEIGHT,
  treatmentTherapyNeed: INDICATOR_WEIGHT,
  urgentMedicalCondition: URGENT_WEIGHT,
};

/** 5 x 2 + 4 = 14. */
export const MAX_RISK_SCORE = Object.values(INDICATOR_WEIGHTS).reduce((a, b) => a + b, 0);

export function tierFromScore(score: number): RiskLevel {
  if (score >= 9) return "HighRisk";
  if (score >= 5) return "ModerateRisk";
  return "LowRisk";
}

export interface RuleResult {
  score: number;
  level: RiskLevel;
  ruleVersion: string;
  /** An urgent medical condition always forces review, whatever the total. */
  triggersImmediateReview: boolean;
  present: IndicatorKey[];
}

export function computeRuleBasedScore(indicators: Partial<Indicators>): RuleResult {
  const present = INDICATOR_KEYS.filter((k) => indicators[k] === true);
  const score = present.reduce((sum, k) => sum + INDICATOR_WEIGHTS[k], 0);
  return {
    score,
    level: tierFromScore(score),
    ruleVersion: RULE_VERSION,
    triggersImmediateReview: indicators.urgentMedicalCondition === true,
    present,
  };
}

// Feature vector for the AI service — the six coded flags only. No identifiers
// or personal information are included, per manuscript Section 1.2.
export function toFeatureVector(indicators: Partial<Indicators>): number[] {
  return INDICATOR_KEYS.map((k) => (indicators[k] === true ? 1 : 0));
}

const SEVERITY: Record<RiskLevel, number> = { HighRisk: 0, ModerateRisk: 1, LowRisk: 2 };

/** The more severe of two tiers — used to pre-fill the confirmation control. */
export function higherTier(a: RiskLevel, b: RiskLevel): RiskLevel {
  return SEVERITY[a] <= SEVERITY[b] ? a : b;
}

export const isDisagreement = (rule: RiskLevel, ai: RiskLevel): boolean => rule !== ai;
