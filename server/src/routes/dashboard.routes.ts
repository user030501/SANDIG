// FR-19 — dashboard summary. Every figure is computed from live records; there
// are no hardcoded counts anywhere in this file or in the pages it feeds.

import { Router } from "express";
import { prisma } from "../prisma";
import { asyncHandler } from "../middleware/errors";
import { INDICATOR_KEYS } from "../riskEngine";
import { serializeRecentUpdate, serializeReferral, serializeAuditLog } from "../serializers";

export const dashboardRouter = Router();

/** Labels for the "common health concerns" breakdown, in display order. */
const CONCERN_LABELS: Record<(typeof INDICATOR_KEYS)[number], string> = {
  missedCheckup: "Missed or irregular checkup",
  medicationConcern: "Unresolved medication concern",
  treatmentTherapyNeed: "Therapy follow-up overdue",
  unresolvedHealthNeed: "Treatment not yet received",
  pendingReferral: "Assistive device needs repair",
  urgentMedicalCondition: "Urgent medical condition reported",
};

const CONCERN_SHORT: Record<(typeof INDICATOR_KEYS)[number], string> = {
  missedCheckup: "Missed checkup",
  medicationConcern: "Medication",
  treatmentTherapyNeed: "Therapy",
  unresolvedHealthNeed: "Treatment",
  pendingReferral: "Device repair",
  urgentMedicalCondition: "Urgent",
};

const CONCERN_ORDER: (typeof INDICATOR_KEYS)[number][] = [
  "missedCheckup",
  "medicationConcern",
  "treatmentTherapyNeed",
  "unresolvedHealthNeed",
  "pendingReferral",
  "urgentMedicalCondition",
];

dashboardRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const activeProfiles = { active: true };

    const [
      totalPwd, highRisk, moderateRisk, lowRisk,
      pendingReferrals, completedReferrals,
      scheduledFollowUps, overdueFollowUps, missedFollowUps,
      recentUpdates, upcomingList, openCases,
    ] = await Promise.all([
      prisma.pwdProfile.count({ where: activeProfiles }),
      prisma.pwdProfile.count({ where: { ...activeProfiles, riskStatus: "HighRisk" } }),
      prisma.pwdProfile.count({ where: { ...activeProfiles, riskStatus: "ModerateRisk" } }),
      prisma.pwdProfile.count({ where: { ...activeProfiles, riskStatus: "LowRisk" } }),
      prisma.referral.count({ where: { status: "Pending" } }),
      prisma.referral.count({ where: { status: "Completed" } }),
      prisma.referral.count({ where: { followUpStatus: "Scheduled" } }),
      prisma.referral.count({ where: { followUpStatus: "Overdue" } }),
      prisma.referral.count({ where: { followUpStatus: "Missed" } }),
      prisma.recentUpdate.findMany({ orderBy: { dateTime: "desc" }, take: 10 }),
      prisma.referral.findMany({
        where: { followUpStatus: { not: "Completed" } },
        include: { pwd: { select: { fullName: true } } },
        orderBy: { followUpDate: "asc" },
        take: 6,
      }),
      prisma.atRiskCase.findMany({
        where: { status: "Open" },
        include: { pwd: true, assessment: true },
      }),
    ]);

    // Common health concerns, counted across each PWD's most recent assessment
    // so a PWD with several assessments is not counted more than once.
    const latestPerPwd = await prisma.assessment.findMany({
      distinct: ["pwdId"],
      orderBy: [{ pwdId: "asc" }, { date: "desc" }],
    });

    const assessedCount = latestPerPwd.length || 1;
    const healthConcerns = CONCERN_ORDER.map((key) => {
      const count = latestPerPwd.filter((a) => a[key]).length;
      return {
        key,
        concern: CONCERN_LABELS[key],
        short: CONCERN_SHORT[key],
        count,
        pct: Math.round((count / assessedCount) * 100),
      };
    });

    // Referral status breakdown for the dashboard chart.
    const referralGroups = await prisma.referral.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    const referralCounts = Object.fromEntries(
      referralGroups.map((g) => [g.status, g._count._all])
    );

    res.json({
      totalPwd,
      highRisk,
      moderateRisk,
      lowRisk,
      pendingReferrals,
      completedReferrals,
      inProgressReferrals: referralCounts["InProgress"] ?? 0,
      escalatedReferrals: referralCounts["Escalated"] ?? 0,
      upcomingFollowUps: scheduledFollowUps,
      overdueFollowUps: overdueFollowUps + missedFollowUps,
      healthConcerns,
      recentUpdates: recentUpdates.map(serializeRecentUpdate),
      upcomingFollowUpList: upcomingList.map(serializeReferral),
      priorityCases: openCases
        .sort((a, b) => b.assessment.ruleScore - a.assessment.ruleScore)
        .slice(0, 6)
        .map((c) => ({
          id: c.id,
          pwdId: c.pwdId,
          pwdName: c.pwd.fullName,
          flagReason: c.flagReason,
          riskScore: c.assessment.ruleScore,
          priorityLevel:
            c.assessment.ruleLevel === "HighRisk"
              ? "High Risk"
              : c.assessment.ruleLevel === "ModerateRisk"
              ? "Moderate Risk"
              : "Low Risk",
        })),
    });
  })
);

/** FR-22 audit trail, newest first. */
dashboardRouter.get(
  "/audit-logs",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 100), 500);
    const logs = await prisma.auditLog.findMany({
      orderBy: { dateTime: "desc" },
      take: limit,
    });
    res.json(logs.map(serializeAuditLog));
  })
);

dashboardRouter.get(
  "/recent-updates",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 10), 50);
    const updates = await prisma.recentUpdate.findMany({
      orderBy: { dateTime: "desc" },
      take: limit,
    });
    res.json(updates.map(serializeRecentUpdate));
  })
);
