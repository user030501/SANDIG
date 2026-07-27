// FR-21 — report generation and export.
//
// CSV is produced server-side because it needs no dependency, opens directly in
// Excel, and prints cleanly. The frontend's existing print view covers the PDF
// case via the browser's own print-to-PDF.

import { Router } from "express";
import { prisma } from "../prisma";
import { asyncHandler, HttpError } from "../middleware/errors";
import { toApiRisk, toApiReferralStatus, toApiDisability, toIsoDate } from "../codecs";
import { ageFrom } from "../serializers";

export const reportsRouter = Router();

export const REPORT_TYPES = [
  "pwd", "assessment", "risk", "referral", "follow-up", "outcome", "summary",
] as const;
type ReportType = (typeof REPORT_TYPES)[number];

interface Report {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}

/** RFC 4180 escaping — quotes doubled, fields with separators quoted. */
function toCsv(report: Report): string {
  const escape = (v: string | number): string => {
    const s = String(v ?? "");
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    report.columns.map(escape).join(","),
    ...report.rows.map((r) => r.map(escape).join(",")),
  ].join("\r\n");
}

async function build(type: ReportType): Promise<Report> {
  switch (type) {
    case "pwd": {
      const rows = await prisma.pwdProfile.findMany({
        where: { active: true },
        orderBy: { fullName: "asc" },
      });
      return {
        title: "PWD Master List",
        columns: ["PWD ID", "Full Name", "Age", "Sex", "Disability Type", "Purok", "ID Status", "Risk Status", "Contact"],
        rows: rows.map((p) => [
          p.pwdIdNumber, p.fullName, ageFrom(p.dateOfBirth), p.sex,
          toApiDisability(p.disabilityType), p.purok, p.pwdIdStatus,
          toApiRisk(p.riskStatus), p.contactNumber,
        ]),
      };
    }

    case "assessment": {
      const rows = await prisma.assessment.findMany({
        include: { pwd: true, assessedBy: true },
        orderBy: { date: "desc" },
      });
      return {
        title: "Assessment History",
        columns: ["Date", "PWD ID", "PWD Name", "Assessed By", "Rule Score", "Rule Level", "AI Prediction", "Confirmed Level", "Urgent", "Recommended Action"],
        rows: rows.map((a) => [
          toIsoDate(a.date), a.pwd.pwdIdNumber, a.pwd.fullName,
          a.assessedBy.fullName, `${a.ruleScore}/14`, toApiRisk(a.ruleLevel),
          a.aiPredicted ? toApiRisk(a.aiPredicted) : "—",
          a.confirmedLevel ? toApiRisk(a.confirmedLevel) : "Pending confirmation",
          a.triggersImmediateReview ? "Yes" : "No", a.recommendedAction,
        ]),
      };
    }

    case "risk": {
      const rows = await prisma.atRiskCase.findMany({
        include: { pwd: true, assessment: { include: { confirmedBy: true } } },
      });
      return {
        title: "Health-Risk Cases",
        columns: ["PWD ID", "PWD Name", "Score", "Rule Level", "AI Prediction", "Confirmed Level", "Confirmed By", "Confirmed On", "Overridden", "Urgent", "Follow-Up", "Case Status", "Flag Reason"],
        rows: rows.map((c) => [
          c.pwd.pwdIdNumber, c.pwd.fullName, `${c.assessment.ruleScore}/14`,
          toApiRisk(c.assessment.ruleLevel),
          c.assessment.aiPredicted ? toApiRisk(c.assessment.aiPredicted) : "—",
          c.assessment.confirmedLevel ? toApiRisk(c.assessment.confirmedLevel) : "Pending",
          c.assessment.confirmedBy?.fullName ?? "—",
          toIsoDate(c.assessment.confirmedAt) || "—",
          c.assessment.overridden ? "Yes" : "No",
          c.assessment.triggersImmediateReview ? "Yes" : "No",
          c.followUpStatus, c.status, c.flagReason,
        ]),
      };
    }

    case "referral": {
      const rows = await prisma.referral.findMany({
        include: { pwd: true },
        orderBy: { referralDate: "desc" },
      });
      return {
        title: "Referral Summary",
        columns: ["Referral Date", "PWD ID", "PWD Name", "Identified Need", "Referred Office", "Receiver", "Priority", "Referral Status", "Follow-Up Date", "Follow-Up Status"],
        rows: rows.map((r) => [
          toIsoDate(r.referralDate), r.pwd.pwdIdNumber, r.pwd.fullName,
          r.identifiedNeed, r.referredOffice, r.receiverName,
          toApiRisk(r.priorityLevel), toApiReferralStatus(r.status),
          toIsoDate(r.followUpDate) || "—", r.followUpStatus,
        ]),
      };
    }

    case "follow-up": {
      const rows = await prisma.referral.findMany({
        where: { followUpStatus: { not: "Completed" } },
        include: { pwd: true },
        orderBy: { followUpDate: "asc" },
      });
      return {
        title: "Follow-Up Schedule",
        columns: ["Follow-Up Date", "Follow-Up Status", "PWD ID", "PWD Name", "Referred Office", "Identified Need", "Referral Status"],
        rows: rows.map((r) => [
          toIsoDate(r.followUpDate) || "—", r.followUpStatus,
          r.pwd.pwdIdNumber, r.pwd.fullName, r.referredOffice,
          r.identifiedNeed, toApiReferralStatus(r.status),
        ]),
      };
    }

    case "outcome": {
      const rows = await prisma.referral.findMany({
        where: { status: { in: ["Completed", "Escalated", "Cancelled"] } },
        include: { pwd: true },
        orderBy: { referralDate: "desc" },
      });
      return {
        title: "Referral Outcomes",
        columns: ["Referral Date", "PWD ID", "PWD Name", "Referred Office", "Status", "Outcome", "Remarks"],
        rows: rows.map((r) => [
          toIsoDate(r.referralDate), r.pwd.pwdIdNumber, r.pwd.fullName,
          r.referredOffice, toApiReferralStatus(r.status),
          r.outcome || "—", r.remarks || "—",
        ]),
      };
    }

    case "summary": {
      const [total, high, moderate, low, referrals, pending, completed, escalated, assessments, confirmed, urgent] =
        await Promise.all([
          prisma.pwdProfile.count({ where: { active: true } }),
          prisma.pwdProfile.count({ where: { active: true, riskStatus: "HighRisk" } }),
          prisma.pwdProfile.count({ where: { active: true, riskStatus: "ModerateRisk" } }),
          prisma.pwdProfile.count({ where: { active: true, riskStatus: "LowRisk" } }),
          prisma.referral.count(),
          prisma.referral.count({ where: { status: "Pending" } }),
          prisma.referral.count({ where: { status: "Completed" } }),
          prisma.referral.count({ where: { status: "Escalated" } }),
          prisma.assessment.count(),
          prisma.assessment.count({ where: { confirmedLevel: { not: null } } }),
          prisma.assessment.count({ where: { triggersImmediateReview: true } }),
        ]);
      return {
        title: "System Summary",
        columns: ["Metric", "Value"],
        rows: [
          ["Total active PWD profiles", total],
          ["High-risk cases", high],
          ["Moderate-risk cases", moderate],
          ["Low-risk cases", low],
          ["Total assessments", assessments],
          ["Assessments confirmed", confirmed],
          ["Assessments awaiting confirmation", assessments - confirmed],
          ["Assessments flagging an urgent condition", urgent],
          ["Total referrals", referrals],
          ["Pending referrals", pending],
          ["Completed referrals", completed],
          ["Escalated referrals", escalated],
          ["Generated", new Date().toISOString().slice(0, 16).replace("T", " ")],
        ],
      };
    }
  }
}

reportsRouter.get(
  "/:type",
  asyncHandler(async (req, res) => {
    const type = req.params.type as ReportType;
    if (!REPORT_TYPES.includes(type)) {
      throw new HttpError(400, `Unknown report type "${type}". Expected one of: ${REPORT_TYPES.join(", ")}`);
    }

    const report = await build(type);

    if (req.query.format === "csv") {
      const filename = `sandig-${type}-report-${toIsoDate(new Date())}.csv`;
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      // BOM so Excel opens UTF-8 correctly.
      res.send("﻿" + toCsv(report));
      return;
    }

    res.json(report);
  })
);
