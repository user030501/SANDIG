// Converts Prisma rows into the exact object shapes the frontend already
// consumes (see src/app/data/mockData.ts). Keeping this in one place means a
// page can be pointed at the API without touching its rendering code.

import type {
  Assessment, AtRiskCase, AuditLog, PwdProfile, Referral, RecentUpdate, SystemUser,
} from "@prisma/client";
import {
  toApiRisk, toApiReferralStatus, toApiDisability, toApiFollowUp,
  toApiPwdIdStatus, toApiCaseStatus, toApiUserStatus, toApiUpdateType,
  toIsoDate, toIsoDateTime,
} from "./codecs";
import { INDICATOR_KEYS } from "./riskEngine";

/** Age in whole years, derived rather than stored so it can never go stale. */
export function ageFrom(dateOfBirth: Date, now = new Date()): number {
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const m = now.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dateOfBirth.getDate())) age--;
  return age;
}

export function serializeProfile(p: PwdProfile, lastAssessment?: Date | null) {
  return {
    id: p.id,
    fullName: p.fullName,
    dateOfBirth: toIsoDate(p.dateOfBirth),
    age: ageFrom(p.dateOfBirth),
    sex: p.sex,
    address: p.address,
    contactNumber: p.contactNumber,
    civilStatus: p.civilStatus,
    disabilityType: toApiDisability(p.disabilityType),
    pwdIdNumber: p.pwdIdNumber,
    pwdIdStatus: toApiPwdIdStatus(p.pwdIdStatus),
    dateRegistered: toIsoDate(p.dateRegistered),
    assistiveDevice: p.assistiveDevice,
    householdSize: p.householdSize,
    livingCondition: p.livingCondition,
    incomeBracket: p.incomeBracket,
    supportSituation: p.supportSituation,
    caregiverName: p.caregiverName,
    caregiverRelationship: p.caregiverRelationship,
    caregiverContact: p.caregiverContact,
    caregiverAvailability: p.caregiverAvailability,
    lastAssessment: toIsoDate(lastAssessment ?? null),
    riskStatus: toApiRisk(p.riskStatus),
    purok: p.purok,
  };
}

/** The six indicators as the frontend's RiskIndicators record. */
export function serializeIndicators(a: Assessment): Record<string, boolean> {
  return Object.fromEntries(INDICATOR_KEYS.map((k) => [k, a[k]]));
}

type AssessmentWithNames = Assessment & {
  assessedBy?: { fullName: string } | null;
  confirmedBy?: { fullName: string } | null;
};

export function serializeAssessment(a: AssessmentWithNames) {
  return {
    id: a.id,
    pwdId: a.pwdId,
    date: toIsoDate(a.date),
    assessedBy: a.assessedBy?.fullName ?? "",
    healthConcern: a.healthConcern,
    checkupAttendance: a.checkupAttendance,
    therapyAttendance: a.therapyAttendance,
    medicationAccess: a.medicationAccess,
    deviceType: a.deviceType,
    deviceCondition: a.deviceCondition,
    needsRepair: a.needsRepair,
    needsReplacement: a.needsReplacement,
    urgentNeed: a.urgentNeed,
    remarks: a.remarks,
    recommendedAction: a.recommendedAction,
    indicators: serializeIndicators(a),

    // Rule-based and AI results are deliberately kept apart (FR-09).
    ruleBased: {
      score: a.ruleScore,
      level: toApiRisk(a.ruleLevel),
      ruleVersion: a.ruleVersion,
      triggersImmediateReview: a.triggersImmediateReview,
    },
    aiPrediction: a.aiPredicted
      ? {
          predicted: toApiRisk(a.aiPredicted),
          probabilities: {
            "Low Risk": a.aiProbLow ?? 0,
            "Moderate Risk": a.aiProbModerate ?? 0,
            "High Risk": a.aiProbHigh ?? 0,
          },
          modelVersion: a.aiModelVersion ?? "",
          predictedAt: toIsoDateTime(a.aiPredictedAt),
        }
      : null,
    confirmation: a.confirmedLevel
      ? {
          confirmedLevel: toApiRisk(a.confirmedLevel),
          confirmedBy: a.confirmedBy?.fullName ?? "",
          confirmedAt: toIsoDate(a.confirmedAt),
          overridden: a.overridden ?? false,
        }
      : null,
    // Legacy field kept so existing UI that reads `riskLevel` still works.
    riskLevel: toApiRisk(a.confirmedLevel ?? a.ruleLevel),
  };
}

type CaseWithRelations = AtRiskCase & {
  pwd: PwdProfile;
  assessment: AssessmentWithNames;
};

export function serializeAtRiskCase(c: CaseWithRelations) {
  const a = c.assessment;
  return {
    id: c.id,
    pwdId: c.pwdId,
    pwdName: c.pwd.fullName,
    flagReason: c.flagReason,
    indicators: serializeIndicators(a),
    riskScore: a.ruleScore,
    priorityLevel: toApiRisk(a.ruleLevel),
    aiPrediction: a.aiPredicted
      ? {
          predicted: toApiRisk(a.aiPredicted),
          probabilities: {
            "Low Risk": a.aiProbLow ?? 0,
            "Moderate Risk": a.aiProbModerate ?? 0,
            "High Risk": a.aiProbHigh ?? 0,
          },
        }
      : null,
    confirmation: a.confirmedLevel
      ? {
          confirmedLevel: toApiRisk(a.confirmedLevel),
          confirmedBy: a.confirmedBy?.fullName ?? "",
          confirmedAt: toIsoDate(a.confirmedAt),
          overridden: a.overridden ?? false,
        }
      : null,
    assessmentId: a.id,
    triggersImmediateReview: a.triggersImmediateReview,
    dateFlagged: toIsoDate(c.dateFlagged),
    lastAssessment: toIsoDate(a.date),
    followUpStatus: toApiFollowUp(c.followUpStatus),
    status: toApiCaseStatus(c.status),
  };
}

export function serializeReferral(r: Referral & { pwd?: { fullName: string } | null }) {
  return {
    id: r.id,
    pwdId: r.pwdId,
    pwdName: r.pwd?.fullName ?? "",
    referralType: r.referralType,
    identifiedNeed: r.identifiedNeed,
    referralReason: r.referralReason,
    referredOffice: r.referredOffice,
    receiverName: r.receiverName,
    referralDate: toIsoDate(r.referralDate),
    followUpDate: toIsoDate(r.followUpDate),
    followUpStatus: toApiFollowUp(r.followUpStatus),
    priorityLevel: toApiRisk(r.priorityLevel),
    status: toApiReferralStatus(r.status),
    outcome: r.outcome,
    remarks: r.remarks,
  };
}

export const serializeRecentUpdate = (u: RecentUpdate) => ({
  id: u.id,
  type: toApiUpdateType(u.type),
  actor: u.actor,
  action: u.action,
  subject: u.subject,
  dateTime: toIsoDateTime(u.dateTime),
});

export const serializeAuditLog = (l: AuditLog) => ({
  id: l.id,
  user: l.userName,
  action: l.action,
  module: l.module,
  dateTime: toIsoDateTime(l.dateTime),
});

export const serializeUser = (u: SystemUser) => ({
  id: u.id,
  fullName: u.fullName,
  username: u.username,
  role: u.role,
  status: toApiUserStatus(u.status),
  lastLogin: toIsoDateTime(u.lastLogin),
  contactNumber: u.contactNumber,
});
