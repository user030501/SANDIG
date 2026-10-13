// Shared core for FR-07/FR-08: run the authoritative rule engine plus the
// advisory Random Forest model for a PWD, persist the result as an
// Assessment row, flag an AtRiskCase when warranted, and update the PWD's
// provisional risk status. Used both by the Welfare Assessment intake
// (assessments.routes.ts) and by PWD registration's automatic initial
// assessment (profiles.routes.ts).

import { prisma } from "../prisma";
import { computeRuleBasedScore, INDICATOR_LABELS, type Indicators } from "../riskEngine";
import { predictRisk } from "../aiClient";

export interface AssessmentFields {
  date?: string;
  healthConcern: string;
  checkupAttendance: string;
  therapyAttendance: string;
  medicationAccess: string;
  deviceType: string;
  deviceCondition: string;
  needsRepair: boolean;
  needsReplacement: boolean;
  urgentNeed: string;
  remarks: string;
  recommendedAction: string;
}

const withNames = {
  assessedBy: { select: { fullName: true } },
  confirmedBy: { select: { fullName: true } },
} as const;

export async function runAssessment(
  pwdId: string,
  indicators: Indicators,
  fields: AssessmentFields,
  assessedById: string
) {
  // Authoritative rule-based result.
  const rule = computeRuleBasedScore(indicators);

  // Advisory AI result. A failure here must not block the assessment — the
  // rule-based score stands on its own, and the prediction can be retried.
  const ai = await predictRisk(indicators).catch((err) => {
    console.warn("[riskAssessment] AI service unavailable:", err.message);
    return null;
  });

  const created = await prisma.assessment.create({
    data: {
      pwdId,
      date: fields.date ? new Date(fields.date) : new Date(),
      assessedById,
      healthConcern: fields.healthConcern,
      checkupAttendance: fields.checkupAttendance,
      therapyAttendance: fields.therapyAttendance,
      medicationAccess: fields.medicationAccess,
      deviceType: fields.deviceType,
      deviceCondition: fields.deviceCondition,
      needsRepair: fields.needsRepair,
      needsReplacement: fields.needsReplacement,
      urgentNeed: fields.urgentNeed,
      remarks: fields.remarks,
      recommendedAction: fields.recommendedAction,
      ...indicators,
      ruleScore: rule.score,
      ruleLevel: rule.level,
      ruleVersion: rule.ruleVersion,
      triggersImmediateReview: rule.triggersImmediateReview,
      aiPredicted: ai?.level ?? null,
      aiProbLow: ai?.probabilities.LowRisk ?? null,
      aiProbModerate: ai?.probabilities.ModerateRisk ?? null,
      aiProbHigh: ai?.probabilities.HighRisk ?? null,
      aiModelVersion: ai?.modelVersion ?? null,
      aiPredictedAt: ai ? new Date() : null,
    },
    include: withNames,
  });

  // A flagged case is opened for anything above Low, and unconditionally when
  // an urgent medical condition is present (FR-08).
  const shouldFlag = rule.level !== "LowRisk" || rule.triggersImmediateReview;
  if (shouldFlag) {
    const reasons = rule.present.map((k) => INDICATOR_LABELS[k]);
    await prisma.atRiskCase.upsert({
      where: { pwdId },
      create: {
        pwdId,
        assessmentId: created.id,
        flagReason: reasons.join("; "),
        dateFlagged: created.date,
        followUpStatus: "Scheduled",
        status: "Open",
      },
      update: {
        assessmentId: created.id,
        flagReason: reasons.join("; "),
        dateFlagged: created.date,
        status: "Open",
      },
    });
  }

  // Provisional risk status until the Administrator confirms. Using the
  // rule-based level (rather than leaving the previous value) keeps an
  // unconfirmed high-risk PWD visible in list ordering and dashboard counts.
  await prisma.pwdProfile.update({
    where: { id: pwdId },
    data: { riskStatus: rule.level },
  });

  return created;
}
