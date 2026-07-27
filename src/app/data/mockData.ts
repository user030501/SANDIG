import type { RiskIndicators, AiPrediction, FollowUpStatus } from "./riskModel";

export type DisabilityType =
  | "Physical"
  | "Visual"
  | "Hearing"
  | "Intellectual"
  | "Psychosocial"
  | "Communication"
  | "Chronic Illness";

export type RiskLevel = "Low Risk" | "Moderate Risk" | "High Risk";
export type ReferralStatus = "Pending" | "Received" | "In Progress" | "Completed" | "Escalated" | "Cancelled";
export type PwdIdStatus = "Active" | "Expired" | "Pending";

export interface PwdProfile {
  id: string;
  fullName: string;
  dateOfBirth: string;
  age: number;
  sex: "Male" | "Female";
  address: string;
  contactNumber: string;
  civilStatus: string;
  disabilityType: DisabilityType;
  pwdIdNumber: string;
  pwdIdStatus: PwdIdStatus;
  dateRegistered: string;
  assistiveDevice: string;
  householdSize: number;
  livingCondition: string;
  incomeBracket: string;
  supportSituation: string;
  caregiverName: string;
  caregiverRelationship: string;
  caregiverContact: string;
  caregiverAvailability: string;
  lastAssessment: string;
  riskStatus: RiskLevel;
  purok: string;
}

export interface Assessment {
  id: string;
  pwdId: string;
  date: string;
  assessedBy: string;
  healthConcern: string;
  checkupAttendance: string;
  therapyAttendance: string;
  medicationAccess: string;
  deviceType: string;
  deviceCondition: string;
  needsRepair: boolean;
  needsReplacement: boolean;
  hasCaregiver: boolean;
  caregiverAvailability: string;
  caregiverConcern: string;
  homeAccessIssue: boolean;
  transportationIssue: boolean;
  communicationIssue: boolean;
  publicServiceIssue: boolean;
  schoolAttendance: string;
  employmentStatus: string;
  skillsTraining: string;
  urgentNeed: string;
  remarks: string;
  recommendedAction: string;
  riskLevel: RiskLevel;
}

export interface RiskConfirmation {
  confirmedLevel: RiskLevel;
  confirmedBy: string;
  confirmedAt: string;
  /** True when the Administrator chose a tier other than the suggested one. */
  overridden: boolean;
}

export interface AtRiskCase {
  id: string;
  pwdId: string;
  pwdName: string;
  flagReason: string;
  /** Which of the six scoring indicators are present for this PWD. */
  indicators: RiskIndicators;
  /** Rule-based point total, derived from `indicators` (see riskModel). */
  riskScore: number;
  /** Rule-based tier, derived from `riskScore`. */
  priorityLevel: RiskLevel;
  /**
   * Advisory Random Forest output — never replaces the rule-based result.
   * Null when the AI service was unreachable at assessment time; the
   * rule-based score stands on its own in that case.
   */
  aiPrediction: AiPrediction | null;
  /** Set once the Administrator confirms the final risk level; null until then. */
  confirmation: RiskConfirmation | null;
  /** The assessment that produced this case's score. */
  assessmentId: string;
  /** An urgent medical condition forces review regardless of the total. */
  triggersImmediateReview: boolean;
  dateFlagged: string;
  lastAssessment: string;
  followUpStatus: FollowUpStatus;
  status: "Open" | "Reviewed" | "Closed";
}

export interface Referral {
  id: string;
  pwdId: string;
  pwdName: string;
  /**
   * Always "Medical / Health" — SANDIG issues Health Referrals only. Retained
   * for schema consistency and report legibility; it is set server-side on
   * create and is never a user choice.
   */
  referralType: string;
  identifiedNeed: string;
  referralReason: string;
  referredOffice: string;
  receiverName: string;
  referralDate: string;
  followUpDate: string;
  /** Follow-up progress — uses the follow-up vocabulary, NOT the referral status. */
  followUpStatus: FollowUpStatus;
  priorityLevel: RiskLevel;
  status: ReferralStatus;
  outcome: string;
  remarks: string;
}

/** Recent-activity feed entry shown on the Dashboard. */
export interface RecentUpdate {
  id: string;
  type: "Referral" | "Status" | "Assessment" | "Risk" | "Profile";
  actor: string;
  action: string;
  subject: string;
  dateTime: string;
}

export interface SystemUser {
  id: string;
  fullName: string;
  username: string;
  role: string;
  status: "Active" | "Inactive";
  lastLogin: string;
  contactNumber: string;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  module: string;
  dateTime: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types and reference lists for the SANDIG frontend.
//
// The record arrays that used to live here (PWD_PROFILES, ASSESSMENTS,
// AT_RISK_CASES, REFERRALS, SYSTEM_USERS, AUDIT_LOGS, RECENT_UPDATES) have been
// removed — all records now come from the API. What remains is the type
// contract, which the backend schema mirrors field-for-field, plus the static
// option lists used to populate form dropdowns.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SANDIG is scoped strictly to Health Referral (manuscript Section 1.5,
 * FR-06, FR-12). Referrals go first to the Barangay Health Center, which is the
 * principal receiver; a hospital is recorded only as an escalation when the
 * Barangay Health Center or another authorized health professional determines
 * that care beyond barangay-level capacity is needed.
 *
 * Non-health receivers (DSWD, PDAO, schools, SPED centres) are deliberately
 * absent — they belong to referral categories that are out of scope.
 */
export const REFERRED_OFFICES = [
  "Barangay Health Center",
  "Hospital",
];

export const REFERRAL_REASONS = [
  "Medical consultation",
  "Missed checkup",
  "Medication concern",
  "Treatment need",
  "Therapy-related concern",
  "Urgent medical condition",
];

/**
 * Every referral in this system is a Health Referral by definition, so there is
 * no referral-type choice to make. The value is applied server-side on create
 * and kept on the record for schema consistency and report legibility.
 */
export const HEALTH_REFERRAL_TYPE = "Medical / Health";

export const DISABILITY_TYPES: DisabilityType[] = [
  "Physical",
  "Visual",
  "Hearing",
  "Intellectual",
  "Psychosocial",
  "Communication",
  "Chronic Illness",
];

export const PUROKS = ["Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5", "Purok 6"];
