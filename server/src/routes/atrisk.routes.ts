// FR-08 to FR-11 — flagged at-risk cases and their review state.

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { asyncHandler, HttpError } from "../middleware/errors";
import { fromApiFollowUp } from "../codecs";
import { serializeAtRiskCase } from "../serializers";
import { RISK_SORT_ORDER } from "../ordering";

export const atRiskRouter = Router();

const withRelations = {
  pwd: true,
  assessment: {
    include: {
      assessedBy: { select: { fullName: true } },
      confirmedBy: { select: { fullName: true } },
    },
  },
} as const;

atRiskRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, followUpStatus } = req.query as Record<string, string>;
    const cases = await prisma.atRiskCase.findMany({
      where: {
        ...(status ? { status: status as "Open" | "Reviewed" | "Closed" } : {}),
        ...(followUpStatus ? { followUpStatus: fromApiFollowUp(followUpStatus) } : {}),
      },
      include: withRelations,
    });

    // Most critical first: urgent cases lead, then by tier, then by score.
    const sorted = cases.sort((a, b) => {
      const urgent =
        Number(b.assessment.triggersImmediateReview) -
        Number(a.assessment.triggersImmediateReview);
      if (urgent !== 0) return urgent;
      const tier =
        RISK_SORT_ORDER[a.assessment.ruleLevel] - RISK_SORT_ORDER[b.assessment.ruleLevel];
      if (tier !== 0) return tier;
      return b.assessment.ruleScore - a.assessment.ruleScore;
    });

    res.json(sorted.map(serializeAtRiskCase));
  })
);

atRiskRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const found = await prisma.atRiskCase.findUnique({
      where: { id: req.params.id },
      include: withRelations,
    });
    if (!found) throw new HttpError(404, "Case not found.");
    res.json(serializeAtRiskCase(found));
  })
);

const statusSchema = z.object({
  status: z.enum(["Open", "Reviewed", "Closed"]),
});

atRiskRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const { status } = statusSchema.parse(req.body);
    const found = await prisma.atRiskCase.findUnique({
      where: { id: req.params.id },
      include: withRelations,
    });
    if (!found) throw new HttpError(404, "Case not found.");

    // A case cannot be signed off before the Administrator has confirmed the
    // risk level (FR-10/FR-11) — enforced here, not only in the UI.
    if (status !== "Open" && !found.assessment.confirmedLevel) {
      throw new HttpError(
        409,
        "Confirm the risk level for this case before marking it reviewed or closed."
      );
    }

    // An urgent medical condition forces immediate review regardless of the
    // computed total or the AI output, so the case cannot simply be closed.
    if (status === "Closed" && found.assessment.triggersImmediateReview) {
      const resolved = await prisma.referral.count({
        where: { pwdId: found.pwdId, status: "Completed" },
      });
      if (resolved === 0) {
        throw new HttpError(
          409,
          "This case reports an urgent medical condition. It cannot be closed until a referral for this PWD has been completed."
        );
      }
    }

    const updated = await prisma.atRiskCase.update({
      where: { id: found.id },
      data: { status },
      include: withRelations,
    });
    res.json(serializeAtRiskCase(updated));
  })
);

const followUpSchema = z.object({
  followUpStatus: z.string(),
});

atRiskRouter.patch(
  "/:id/follow-up",
  asyncHandler(async (req, res) => {
    const { followUpStatus } = followUpSchema.parse(req.body);
    const found = await prisma.atRiskCase.findUnique({ where: { id: req.params.id } });
    if (!found) throw new HttpError(404, "Case not found.");

    const updated = await prisma.atRiskCase.update({
      where: { id: found.id },
      data: { followUpStatus: fromApiFollowUp(followUpStatus) },
      include: withRelations,
    });
    res.json(serializeAtRiskCase(updated));
  })
);
