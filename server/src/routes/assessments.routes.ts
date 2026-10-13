// FR-04, FR-05, FR-07 — health assessment intake and authoritative scoring.
//
// The rule-based score is ALWAYS recomputed here from the submitted indicators.
// Any score sent by the client is ignored: the frontend's live preview is a UX
// affordance, not an input.

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { asyncHandler, HttpError } from "../middleware/errors";
import {
  higherTier, indicatorSchema, INDICATOR_KEYS, type Indicators,
} from "../riskEngine";
import { fromApiRisk } from "../codecs";
import { serializeAssessment } from "../serializers";
import { predictRisk } from "../aiClient";
import { runAssessment } from "../services/riskAssessment";

export const assessmentsRouter = Router();

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

    const created = await runAssessment(input.pwdId, indicators, input, req.user!.id);

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

// ── Human confirmation (FR-10, FR-11) ───────────────────────────────────────

const confirmSchema = z.object({
  confirmedLevel: z.string(),
});

/**
 * The Administrator confirms or overrides the final risk level. Until this
 * happens the assessment has two separate results and no decision — referral
 * creation is blocked (see referrals.routes.ts).
 *
 * `overridden` records whether the chosen level differs from the suggestion,
 * which is the more severe of the rule-based and AI tiers.
 */
assessmentsRouter.post(
  "/:id/confirm",
  asyncHandler(async (req, res) => {
    const { confirmedLevel } = confirmSchema.parse(req.body);
    const level = fromApiRisk(confirmedLevel);

    const assessment = await prisma.assessment.findUnique({
      where: { id: req.params.id },
      include: { pwd: true },
    });
    if (!assessment) throw new HttpError(404, "Assessment not found.");

    const suggested = assessment.aiPredicted
      ? higherTier(assessment.ruleLevel, assessment.aiPredicted)
      : assessment.ruleLevel;

    const updated = await prisma.assessment.update({
      where: { id: assessment.id },
      data: {
        confirmedLevel: level,
        confirmedById: req.user!.id,
        confirmedAt: new Date(),
        overridden: level !== suggested,
      },
      include: withNames,
    });

    // The confirmed level becomes the PWD's risk status.
    await prisma.pwdProfile.update({
      where: { id: assessment.pwdId },
      data: { riskStatus: level },
    });

    // An urgent medical condition keeps the case open for action regardless of
    // the confirmed tier — confirming does not clear it.
    await prisma.atRiskCase.updateMany({
      where: { assessmentId: assessment.id },
      data: { status: assessment.triggersImmediateReview ? "Open" : "Reviewed" },
    });

    await prisma.recentUpdate.create({
      data: {
        type: "Risk",
        actor: req.user?.fullName ?? "Administrator",
        action: `Confirmed risk level as ${confirmedLevel}`,
        subject: assessment.pwd.fullName,
      },
    });

    res.json(serializeAssessment(updated));
  })
);

/** Re-runs the advisory prediction, e.g. after the AI service was restarted. */
assessmentsRouter.post(
  "/:id/predict",
  asyncHandler(async (req, res) => {
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.id } });
    if (!assessment) throw new HttpError(404, "Assessment not found.");

    const indicators = Object.fromEntries(
      INDICATOR_KEYS.map((k) => [k, assessment[k]])
    ) as Indicators;

    const ai = await predictRisk(indicators);
    const updated = await prisma.assessment.update({
      where: { id: assessment.id },
      data: {
        aiPredicted: ai.level,
        aiProbLow: ai.probabilities.LowRisk,
        aiProbModerate: ai.probabilities.ModerateRisk,
        aiProbHigh: ai.probabilities.HighRisk,
        aiModelVersion: ai.modelVersion,
        aiPredictedAt: new Date(),
      },
      include: withNames,
    });
    res.json(serializeAssessment(updated));
  })
);
