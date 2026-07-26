// Bridges Prisma enum identifiers to the exact string literals the frontend's
// TypeScript unions use. Prisma identifiers cannot contain spaces, so values
// like "Low Risk" and "In Progress" are declared PascalCase in schema.prisma
// and translated here at the API boundary.
//
// Everything the API emits goes through `toApi*`; everything it accepts goes
// through `fromApi*`, so a malformed string is rejected at the edge rather than
// reaching the database.

import {
  RiskLevel,
  ReferralStatus,
  FollowUpStatus,
  DisabilityType,
  PwdIdStatus,
  CaseStatus,
  UserStatus,
  UpdateType,
} from "@prisma/client";

export type ApiRiskLevel = "Low Risk" | "Moderate Risk" | "High Risk";
export type ApiReferralStatus =
  | "Pending" | "Received" | "In Progress" | "Completed" | "Escalated" | "Cancelled";
export type ApiFollowUpStatus = "Scheduled" | "Completed" | "Overdue" | "Missed";
export type ApiDisabilityType =
  | "Physical" | "Visual" | "Hearing" | "Intellectual"
  | "Psychosocial" | "Communication" | "Chronic Illness";

const RISK_TO_API: Record<RiskLevel, ApiRiskLevel> = {
  LowRisk: "Low Risk",
  ModerateRisk: "Moderate Risk",
  HighRisk: "High Risk",
};
const RISK_FROM_API: Record<ApiRiskLevel, RiskLevel> = {
  "Low Risk": "LowRisk",
  "Moderate Risk": "ModerateRisk",
  "High Risk": "HighRisk",
};

const REFERRAL_TO_API: Record<ReferralStatus, ApiReferralStatus> = {
  Pending: "Pending",
  Received: "Received",
  InProgress: "In Progress",
  Completed: "Completed",
  Escalated: "Escalated",
  Cancelled: "Cancelled",
};
const REFERRAL_FROM_API: Record<ApiReferralStatus, ReferralStatus> = {
  Pending: "Pending",
  Received: "Received",
  "In Progress": "InProgress",
  Completed: "Completed",
  Escalated: "Escalated",
  Cancelled: "Cancelled",
};

const DISABILITY_TO_API: Record<DisabilityType, ApiDisabilityType> = {
  Physical: "Physical",
  Visual: "Visual",
  Hearing: "Hearing",
  Intellectual: "Intellectual",
  Psychosocial: "Psychosocial",
  Communication: "Communication",
  ChronicIllness: "Chronic Illness",
};
const DISABILITY_FROM_API: Record<ApiDisabilityType, DisabilityType> = {
  Physical: "Physical",
  Visual: "Visual",
  Hearing: "Hearing",
  Intellectual: "Intellectual",
  Psychosocial: "Psychosocial",
  Communication: "Communication",
  "Chronic Illness": "ChronicIllness",
};

export const toApiRisk = (v: RiskLevel): ApiRiskLevel => RISK_TO_API[v];
export const toApiReferralStatus = (v: ReferralStatus): ApiReferralStatus => REFERRAL_TO_API[v];
export const toApiDisability = (v: DisabilityType): ApiDisabilityType => DISABILITY_TO_API[v];
// These three are already identical in both worlds.
export const toApiFollowUp = (v: FollowUpStatus): ApiFollowUpStatus => v;
export const toApiPwdIdStatus = (v: PwdIdStatus): string => v;
export const toApiCaseStatus = (v: CaseStatus): string => v;
export const toApiUserStatus = (v: UserStatus): string => v;
export const toApiUpdateType = (v: UpdateType): string => v;

export function fromApiRisk(v: string): RiskLevel {
  const mapped = RISK_FROM_API[v as ApiRiskLevel];
  if (!mapped) throw new BadEnumError("riskLevel", v, Object.keys(RISK_FROM_API));
  return mapped;
}

export function fromApiReferralStatus(v: string): ReferralStatus {
  const mapped = REFERRAL_FROM_API[v as ApiReferralStatus];
  if (!mapped) throw new BadEnumError("status", v, Object.keys(REFERRAL_FROM_API));
  return mapped;
}

export function fromApiDisability(v: string): DisabilityType {
  const mapped = DISABILITY_FROM_API[v as ApiDisabilityType];
  if (!mapped) throw new BadEnumError("disabilityType", v, Object.keys(DISABILITY_FROM_API));
  return mapped;
}

export function fromApiFollowUp(v: string): FollowUpStatus {
  const allowed: FollowUpStatus[] = ["Scheduled", "Completed", "Overdue", "Missed"];
  if (!allowed.includes(v as FollowUpStatus)) {
    throw new BadEnumError("followUpStatus", v, allowed);
  }
  return v as FollowUpStatus;
}

export class BadEnumError extends Error {
  status = 400;
  constructor(field: string, received: string, allowed: readonly string[]) {
    super(`Invalid ${field}: "${received}". Expected one of: ${allowed.join(", ")}`);
  }
}

/** ISO date (YYYY-MM-DD) — the format every frontend page already renders. */
export const toIsoDate = (d: Date | null | undefined): string =>
  d ? d.toISOString().slice(0, 10) : "";

/** "YYYY-MM-DD HH:mm" — matches the existing audit log / recent update display. */
export const toIsoDateTime = (d: Date | null | undefined): string =>
  d ? d.toISOString().slice(0, 16).replace("T", " ") : "";
