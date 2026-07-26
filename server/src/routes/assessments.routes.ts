// FR-04, FR-05, FR-07 — health assessment intake and authoritative scoring.
//
// The rule-based score is ALWAYS recomputed here from the submitted indicators.
// Any score sent by the client is ignored: the frontend's live preview is a UX
// affordance, not an input.

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { asyncHandler, HttpError } from "../middleware/errors";
import { computeRuleBasedScore, INDICATOR_KEYS, type Indicators } from "../riskEngine";
import { serializeAssessment } from "../serializers";
import { predictRisk } from "../aiClient";

export const assessmentsRouter = Router();

const indicatorSchema = z.object({
  unresolvedHealthNeed: z.boolean().default(false),
  pendingReferral: z.boolean().default(false),
  missedCheckup: z.boolean().default(false),
  medicationConcern: z.boolean().default(false),
  treatmentTherapyNeed: z.boolean().default(false),
  urgentMedicalCondition: z.boolean().default(false),
});

const createSchema = z.object({
  pwdId: z.string().min(1),
  date: z.string().optional(),
  healthConcern: z.string().default(""),
  checkupAttendance: z.string().default("Regular"),
  therapyAttendance: z.string().default("Regular"),
  medicationAccess: z.string().default("Accessible"),
  deviceType: z.string().default(""),
  deviceCondition: z.string().default("Good"),
  needsRepair: z.boolean().default(false),
  needsReplacement: z.boolean().default(false),
  urgentNeed: z.string().default(""),
  remarks: z.string().default(""),
  recommendedAction: z.string().default(""),
  indicators: indicatorSchema,
});

const withNames = {
  assessedBy: { select: { fullName: true } },
  confirmedBy: { select: { fullName: true } },
} as const;

assessmentsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { pwdId } = req.query as Record<string, string>;
    const rows = await prisma.assessment.findMany({
      where: pwdId ? { pwdId } : undefined,
      include: withNames,
      orderBy: { date: "desc" },
    });
    res.json(rows.map(serializeAssessment));
  })
);

assessmentsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: withNames,
    });
    if (!row) throw new HttpError(404, "Assessment not found.");
    res.json(serializeAssessment(row));
  })
);

assessmentsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createSchema.parse(req.body);
    const indicators = input.indicators as Indicators;

    const pwd = await prisma.pwdProfile.findUnique({ where: { id: input.pwdId } });
    if (!pwd) throw new HttpError(404, "PWD profile not found.");

    // Authoritative rule-based result (FR-07).
    const rule = computeRuleBasedScore(indicators);

    // Advisory AI result. A failure here must not block the assessment — the
    // rule-based score stands on its own, and the prediction can be retried.
    const ai = await predictRisk(indicators).catch((err) => {
      console.warn("[assessments] AI service unavailable:", err.message);
      return null;
    });

    const created = await prisma.assessment.create({
      data: {
        pwdId: input.pwdId,
        date: input.date ? new Date(input.date) : new Date(),
        assessedById: req.user!.id,
        healthConcern: input.healthConcern,
        checkupAttendance: input.checkupAttendance,
        therapyAttendance: input.therapyAttendance,
        medicationAccess: input.medicationAccess,
        deviceType: input.deviceType,
        deviceCondition: input.deviceCondition,
        needsRepair: input.needsRepair,
        needsReplacement: input.needsReplacement,
        urgentNeed: input.urgentNeed,
        remarks: input.remarks,
        recommendedAction: input.recommendedAction,
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
        where: { pwdId: input.pwdId },
        create: {
          pwdId: input.pwdId,
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
      where: { id: input.pwdId },
      data: { riskStatus: rule.level },
    });

    await prisma.recentUpdate.create({
      data: {
        type: "Assessment",
        actor: req.user?.fullName ?? "Administrator",
        action: "Submitted health assessment",
        subject: pwd.fullName,
      },
    });

    res.status(201).json(serializeAssessment(created));
  })
);

const INDICATOR_LABELS: Record<(typeof INDICATOR_KEYS)[number], string> = {
  unresolvedHealthNeed: "Unresolved health need",
  pendingReferral: "Pending referral",
  missedCheckup: "Missed checkup",
  medicationConcern: "Medication concern",
  treatmentTherapyNeed: "Treatment or therapy need",
  urgentMedicalCondition: "Urgent medical condition reported",
};
