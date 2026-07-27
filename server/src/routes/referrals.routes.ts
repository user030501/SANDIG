// FR-06, FR-12 to FR-16 — referral creation, status tracking and follow-up.

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { asyncHandler, HttpError } from "../middleware/errors";
import { fromApiFollowUp, fromApiReferralStatus, fromApiRisk } from "../codecs";
import { serializeReferral } from "../serializers";

export const referralsRouter = Router();

/**
 * SANDIG issues Health Referrals only (manuscript Section 1.5, FR-06, FR-12).
 * There is no other referral category in scope, so the type is applied here
 * rather than accepted from the client.
 */
const HEALTH_REFERRAL_TYPE = "Medical / Health";

/** Health receivers only — the BHC is the principal receiver, a hospital the escalation. */
const ALLOWED_OFFICES = ["Barangay Health Center", "Hospital"] as const;

const createSchema = z.object({
  pwdId: z.string().min(1),
  identifiedNeed: z.string().min(1),
  referralReason: z.string().min(1),
  referredOffice: z.enum(ALLOWED_OFFICES, {
    errorMap: () => ({
      message: `Referred office must be one of: ${ALLOWED_OFFICES.join(", ")}. SANDIG records Health Referrals only.`,
    }),
  }),
  receiverName: z.string().default(""),
  referralDate: z.string().min(1),
  followUpDate: z.string().optional(),
  priorityLevel: z.string().optional(),
  remarks: z.string().default(""),
});

referralsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, followUpStatus, pwdId } = req.query as Record<string, string>;
    const referrals = await prisma.referral.findMany({
      where: {
        ...(status ? { status: fromApiReferralStatus(status) } : {}),
        ...(followUpStatus ? { followUpStatus: fromApiFollowUp(followUpStatus) } : {}),
        ...(pwdId ? { pwdId } : {}),
      },
      include: { pwd: { select: { fullName: true } } },
      orderBy: [{ referralDate: "desc" }],
    });
    res.json(referrals.map(serializeReferral));
  })
);

referralsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createSchema.parse(req.body);

    const pwd = await prisma.pwdProfile.findUnique({
      where: { id: input.pwdId },
      include: {
        assessments: { orderBy: { date: "desc" }, take: 1 },
      },
    });
    if (!pwd) throw new HttpError(404, "PWD profile not found.");

    // FR-10/FR-11: a referral cannot be recorded off the back of an unconfirmed
    // risk result. The Administrator must have confirmed the level first.
    const latest = pwd.assessments[0];
    if (latest && !latest.confirmedLevel) {
      throw new HttpError(
        409,
        "The latest assessment for this PWD has not been confirmed yet. Confirm the risk level before creating a referral."
      );
    }

    const created = await prisma.referral.create({
      data: {
        pwdId: input.pwdId,
        referralType: HEALTH_REFERRAL_TYPE,
        identifiedNeed: input.identifiedNeed,
        referralReason: input.referralReason,
        referredOffice: input.referredOffice,
        receiverName: input.receiverName,
        referralDate: new Date(input.referralDate),
        followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
        followUpStatus: "Scheduled",
        priorityLevel: input.priorityLevel ? fromApiRisk(input.priorityLevel) : pwd.riskStatus,
        status: "Pending",
        remarks: input.remarks,
      },
      include: { pwd: { select: { fullName: true } } },
    });

    await prisma.recentUpdate.create({
      data: {
        type: "Referral",
        actor: req.user?.fullName ?? "Administrator",
        action: `Created referral to ${created.referredOffice}`,
        subject: pwd.fullName,
      },
    });

    res.status(201).json(serializeReferral(created));
  })
);

const statusSchema = z.object({
  status: z.string(),
  outcome: z.string().optional(),
  remarks: z.string().optional(),
});

// FR-13/FR-14 — referral status uses its own vocabulary: Pending, Received,
// In Progress, Completed, Escalated, Cancelled.
referralsRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const input = statusSchema.parse(req.body);
    const existing = await prisma.referral.findUnique({
      where: { id: req.params.id },
      include: { pwd: { select: { fullName: true } } },
    });
    if (!existing) throw new HttpError(404, "Referral not found.");

    const updated = await prisma.referral.update({
      where: { id: existing.id },
      data: {
        status: fromApiReferralStatus(input.status),
        ...(input.outcome !== undefined ? { outcome: input.outcome } : {}),
        ...(input.remarks !== undefined ? { remarks: input.remarks } : {}),
      },
      include: { pwd: { select: { fullName: true } } },
    });

    await prisma.recentUpdate.create({
      data: {
        type: "Status",
        actor: req.user?.fullName ?? "Administrator",
        action: `Referral status changed to ${input.status}`,
        subject: existing.pwd?.fullName ?? "",
      },
    });

    res.json(serializeReferral(updated));
  })
);

const followUpSchema = z.object({
  followUpStatus: z.string(),
  followUpDate: z.string().optional(),
  outcome: z.string().optional(),
});

// FR-15/FR-16 — follow-up progress. Deliberately a separate vocabulary from the
// referral status above: Scheduled, Completed, Overdue, Missed.
referralsRouter.patch(
  "/:id/follow-up",
  asyncHandler(async (req, res) => {
    const input = followUpSchema.parse(req.body);
    const existing = await prisma.referral.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Referral not found.");

    const updated = await prisma.referral.update({
      where: { id: existing.id },
      data: {
        followUpStatus: fromApiFollowUp(input.followUpStatus),
        ...(input.followUpDate ? { followUpDate: new Date(input.followUpDate) } : {}),
        ...(input.outcome !== undefined ? { outcome: input.outcome } : {}),
      },
      include: { pwd: { select: { fullName: true } } },
    });
    res.json(serializeReferral(updated));
  })
);
