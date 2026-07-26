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
  /** Advisory Random Forest output — never replaces the rule-based result. */
  aiPrediction: AiPrediction;
  /** Set once the Administrator confirms the final risk level; null until then. */
  confirmation: RiskConfirmation | null;
  dateFlagged: string;
  lastAssessment: string;
  followUpStatus: FollowUpStatus;
  status: "Open" | "Reviewed" | "Closed";
}

export interface Referral {
  id: string;
  pwdId: string;
  pwdName: string;
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

export const PWD_PROFILES: PwdProfile[] = [
  {
    id: "pwd001",
    fullName: "Luisa Magbanua",
    dateOfBirth: "1982-03-15",
    age: 44,
    sex: "Female",
    address: "Purok 2, Brgy. New Pandan",
    contactNumber: "09171234567",
    civilStatus: "Married",
    disabilityType: "Physical",
    pwdIdNumber: "PWD-2021-001",
    pwdIdStatus: "Active",
    dateRegistered: "2021-06-10",
    assistiveDevice: "Wheelchair",
    householdSize: 5,
    livingCondition: "Renting",
    incomeBracket: "Below Minimum Wage",
    supportSituation: "Has family support",
    caregiverName: "Roberto Magbanua",
    caregiverRelationship: "Spouse",
    caregiverContact: "09177654321",
    caregiverAvailability: "Full-time",
    lastAssessment: "2026-05-10",
    riskStatus: "High Risk",
    purok: "Purok 2",
  },
  {
    id: "pwd002",
    fullName: "Carlos Dela Torre",
    dateOfBirth: "1975-08-22",
    age: 50,
    sex: "Male",
    address: "Purok 4, Brgy. New Pandan",
    contactNumber: "09281234567",
    civilStatus: "Single",
    disabilityType: "Visual",
    pwdIdNumber: "PWD-2020-002",
    pwdIdStatus: "Expired",
    dateRegistered: "2020-03-18",
    assistiveDevice: "White Cane",
    householdSize: 2,
    livingCondition: "Own home",
    incomeBracket: "Minimum Wage",
    supportSituation: "Lives with elderly parent",
    caregiverName: "Remedios Dela Torre",
    caregiverRelationship: "Mother",
    caregiverContact: "09282345678",
    caregiverAvailability: "Part-time",
    lastAssessment: "2026-04-20",
    riskStatus: "Moderate Risk",
    purok: "Purok 4",
  },
  {
    id: "pwd003",
    fullName: "Maria Elena Reyes",
    dateOfBirth: "2005-11-03",
    age: 20,
    sex: "Female",
    address: "Purok 1, Brgy. New Pandan",
    contactNumber: "09331234567",
    civilStatus: "Single",
    disabilityType: "Intellectual",
    pwdIdNumber: "PWD-2022-003",
    pwdIdStatus: "Active",
    dateRegistered: "2022-01-25",
    assistiveDevice: "None",
    householdSize: 6,
    livingCondition: "Own home",
    incomeBracket: "Below Minimum Wage",
    supportSituation: "Has family support",
    caregiverName: "Teresita Reyes",
    caregiverRelationship: "Mother",
    caregiverContact: "09334567890",
    caregiverAvailability: "Full-time",
    lastAssessment: "2026-05-18",
    riskStatus: "Low Risk",
    purok: "Purok 1",
  },
  {
    id: "pwd004",
    fullName: "Fernando Navarro",
    dateOfBirth: "1968-07-14",
    age: 57,
    sex: "Male",
    address: "Purok 3, Brgy. New Pandan",
    contactNumber: "09451234567",
    civilStatus: "Widowed",
    disabilityType: "Hearing",
    pwdIdNumber: "PWD-2019-004",
    pwdIdStatus: "Active",
    dateRegistered: "2019-09-05",
    assistiveDevice: "Hearing Aid",
    householdSize: 1,
    livingCondition: "Renting",
    incomeBracket: "No income",
    supportSituation: "Lives alone",
    caregiverName: "None",
    caregiverRelationship: "N/A",
    caregiverContact: "N/A",
    caregiverAvailability: "No caregiver",
    lastAssessment: "2026-03-15",
    riskStatus: "High Risk",
    purok: "Purok 3",
  },
  {
    id: "pwd005",
    fullName: "Rosa Villanueva",
    dateOfBirth: "1990-01-28",
    age: 36,
    sex: "Female",
    address: "Purok 5, Brgy. New Pandan",
    contactNumber: "09561234567",
    civilStatus: "Married",
    disabilityType: "Chronic Illness",
    pwdIdNumber: "PWD-2023-005",
    pwdIdStatus: "Active",
    dateRegistered: "2023-04-12",
    assistiveDevice: "None",
    householdSize: 4,
    livingCondition: "Own home",
    incomeBracket: "Minimum Wage",
    supportSituation: "Has family support",
    caregiverName: "Mario Villanueva",
    caregiverRelationship: "Spouse",
    caregiverContact: "09567890123",
    caregiverAvailability: "Part-time",
    lastAssessment: "2026-05-25",
    riskStatus: "Moderate Risk",
    purok: "Purok 5",
  },
  {
    id: "pwd006",
    fullName: "Antonio Bautista",
    dateOfBirth: "1955-12-05",
    age: 70,
    sex: "Male",
    address: "Purok 1, Brgy. New Pandan",
    contactNumber: "09671234567",
    civilStatus: "Married",
    disabilityType: "Physical",
    pwdIdNumber: "PWD-2018-006",
    pwdIdStatus: "Active",
    dateRegistered: "2018-07-20",
    assistiveDevice: "Crutches",
    householdSize: 3,
    livingCondition: "Own home",
    incomeBracket: "Senior Citizen Pension",
    supportSituation: "Has family support",
    caregiverName: "Lourdes Bautista",
    caregiverRelationship: "Spouse",
    caregiverContact: "09678901234",
    caregiverAvailability: "Full-time",
    lastAssessment: "2026-04-05",
    riskStatus: "Low Risk",
    purok: "Purok 1",
  },
  {
    id: "pwd007",
    fullName: "Cynthia Mercado",
    dateOfBirth: "1998-06-17",
    age: 27,
    sex: "Female",
    address: "Purok 6, Brgy. New Pandan",
    contactNumber: "09781234567",
    civilStatus: "Single",
    disabilityType: "Psychosocial",
    pwdIdNumber: "PWD-2024-007",
    pwdIdStatus: "Pending",
    dateRegistered: "2024-02-14",
    assistiveDevice: "None",
    householdSize: 4,
    livingCondition: "Renting",
    incomeBracket: "Below Minimum Wage",
    supportSituation: "Limited family support",
    caregiverName: "Gloria Mercado",
    caregiverRelationship: "Mother",
    caregiverContact: "09789012345",
    caregiverAvailability: "Part-time",
    lastAssessment: "2026-05-30",
    riskStatus: "High Risk",
    purok: "Purok 6",
  },
  {
    id: "pwd008",
    fullName: "Ernesto Castillo",
    dateOfBirth: "1980-04-09",
    age: 46,
    sex: "Male",
    address: "Purok 2, Brgy. New Pandan",
    contactNumber: "09891234567",
    civilStatus: "Separated",
    disabilityType: "Communication",
    pwdIdNumber: "PWD-2022-008",
    pwdIdStatus: "Active",
    dateRegistered: "2022-08-30",
    assistiveDevice: "Communication Board",
    householdSize: 2,
    livingCondition: "Own home",
    incomeBracket: "Minimum Wage",
    supportSituation: "Has sibling support",
    caregiverName: "Mila Castillo",
    caregiverRelationship: "Sister",
    caregiverContact: "09890123456",
    caregiverAvailability: "Part-time",
    lastAssessment: "2026-05-12",
    riskStatus: "Moderate Risk",
    purok: "Purok 2",
  },
];

export const ASSESSMENTS: Assessment[] = [
  {
    id: "asmt001",
    pwdId: "pwd001",
    date: "2026-05-10",
    assessedBy: "Maria Santos",
    healthConcern: "Recurring back pain and pressure sores",
    checkupAttendance: "Irregular",
    therapyAttendance: "None",
    medicationAccess: "Difficult — no transport",
    deviceType: "Wheelchair",
    deviceCondition: "Worn",
    needsRepair: true,
    needsReplacement: false,
    hasCaregiver: true,
    caregiverAvailability: "Full-time",
    caregiverConcern: "Caregiver also has health issues",
    homeAccessIssue: true,
    transportationIssue: true,
    communicationIssue: false,
    publicServiceIssue: true,
    schoolAttendance: "N/A",
    employmentStatus: "Unemployed",
    skillsTraining: "None",
    urgentNeed: "Wheelchair repair, medical check-up",
    remarks: "PWD has not had a check-up in 8 months. Caregiver is aging.",
    recommendedAction: "Refer to Barangay Health Center",
    riskLevel: "High Risk",
  },
  {
    id: "asmt002",
    pwdId: "pwd004",
    date: "2026-03-15",
    assessedBy: "Maria Santos",
    healthConcern: "Hypertension, no medication",
    checkupAttendance: "None in past year",
    therapyAttendance: "None",
    medicationAccess: "Cannot afford",
    deviceType: "Hearing Aid",
    deviceCondition: "Broken",
    needsRepair: false,
    needsReplacement: true,
    hasCaregiver: false,
    caregiverAvailability: "None",
    caregiverConcern: "No caregiver",
    homeAccessIssue: false,
    transportationIssue: true,
    communicationIssue: true,
    publicServiceIssue: true,
    schoolAttendance: "N/A",
    employmentStatus: "Unemployed",
    skillsTraining: "None",
    urgentNeed: "Medical assistance, hearing aid replacement",
    remarks: "Lives alone. Urgent situation — no support network.",
    recommendedAction: "Immediate referral to Hospital — urgent medical condition",
    riskLevel: "High Risk",
  },
];

// Risk scores below are the rule-based point totals produced by the six
// indicators (3 points each, Urgent Medical Condition 6). Bands: Low 0–4,
// Moderate 5–8, High 9 and above. Max attainable total is 21.
export const AT_RISK_CASES: AtRiskCase[] = [
  {
    id: "arc001",
    pwdId: "pwd001",
    pwdName: "Luisa Magbanua",
    flagReason: "Missed scheduled checkup; medication not being taken regularly; therapy not yet started",
    indicators: {
      unresolvedHealthNeed: true,
      pendingReferral: true,
      missedCheckup: true,
      medicationConcern: true,
      treatmentTherapyNeed: true,
      urgentMedicalCondition: false,
    },
    riskScore: 15,
    priorityLevel: "High Risk",
    aiPrediction: {
      predicted: "High Risk",
      probabilities: { "High Risk": 0.82, "Moderate Risk": 0.15, "Low Risk": 0.03 },
    },
    confirmation: {
      confirmedLevel: "High Risk",
      confirmedBy: "Maria Santos",
      confirmedAt: "2026-05-11",
      overridden: false,
    },
    dateFlagged: "2026-05-10",
    lastAssessment: "2026-05-10",
    followUpStatus: "Scheduled",
    status: "Open",
  },
  {
    id: "arc002",
    pwdId: "pwd004",
    pwdName: "Fernando Navarro",
    flagReason: "Urgent medical condition reported; unresolved medication concern; pending Barangay Health Center referral",
    indicators: {
      unresolvedHealthNeed: true,
      pendingReferral: true,
      missedCheckup: true,
      medicationConcern: true,
      treatmentTherapyNeed: false,
      urgentMedicalCondition: true,
    },
    riskScore: 18,
    priorityLevel: "High Risk",
    aiPrediction: {
      predicted: "High Risk",
      probabilities: { "High Risk": 0.94, "Moderate Risk": 0.05, "Low Risk": 0.01 },
    },
    confirmation: {
      confirmedLevel: "High Risk",
      confirmedBy: "Maria Santos",
      confirmedAt: "2026-03-16",
      overridden: false,
    },
    dateFlagged: "2026-03-15",
    lastAssessment: "2026-03-15",
    followUpStatus: "Overdue",
    status: "Open",
  },
  {
    id: "arc003",
    pwdId: "pwd007",
    pwdName: "Cynthia Mercado",
    flagReason: "Therapy follow-up overdue; treatment not yet received; missed two consecutive health assessments",
    indicators: {
      unresolvedHealthNeed: true,
      pendingReferral: true,
      missedCheckup: true,
      medicationConcern: false,
      treatmentTherapyNeed: true,
      urgentMedicalCondition: false,
    },
    riskScore: 12,
    priorityLevel: "High Risk",
    // Rule-based says High, the model says Moderate — surfaces as a disagreement.
    aiPrediction: {
      predicted: "Moderate Risk",
      probabilities: { "Moderate Risk": 0.61, "High Risk": 0.34, "Low Risk": 0.05 },
    },
    confirmation: null,
    dateFlagged: "2026-05-30",
    lastAssessment: "2026-05-30",
    followUpStatus: "Missed",
    status: "Open",
  },
  {
    id: "arc004",
    pwdId: "pwd002",
    pwdName: "Carlos Dela Torre",
    flagReason: "Missed scheduled checkup; treatment not yet received following last assessment recommendation",
    indicators: {
      unresolvedHealthNeed: false,
      pendingReferral: false,
      missedCheckup: true,
      medicationConcern: false,
      treatmentTherapyNeed: true,
      urgentMedicalCondition: false,
    },
    riskScore: 6,
    priorityLevel: "Moderate Risk",
    aiPrediction: {
      predicted: "Moderate Risk",
      probabilities: { "Moderate Risk": 0.71, "Low Risk": 0.18, "High Risk": 0.11 },
    },
    confirmation: {
      confirmedLevel: "Moderate Risk",
      confirmedBy: "Maria Santos",
      confirmedAt: "2026-04-21",
      overridden: false,
    },
    dateFlagged: "2026-04-20",
    lastAssessment: "2026-04-20",
    followUpStatus: "Completed",
    status: "Reviewed",
  },
];

export const REFERRALS: Referral[] = [
  {
    id: "ref001",
    pwdId: "pwd001",
    pwdName: "Luisa Magbanua",
    referralType: "Medical / Health",
    identifiedNeed: "Medical consultation and wheelchair assessment",
    referralReason: "Missed checkup",
    referredOffice: "Barangay Health Center",
    receiverName: "BHC Nurse-in-Charge",
    referralDate: "2026-05-12",
    followUpDate: "2026-05-26",
    followUpStatus: "Overdue",
    priorityLevel: "High Risk",
    status: "In Progress",
    outcome: "",
    remarks: "Has not had a check-up in 8 months; wheelchair condition worsening",
  },
  {
    id: "ref002",
    pwdId: "pwd004",
    pwdName: "Fernando Navarro",
    referralType: "Medical / Health",
    identifiedNeed: "Urgent medical treatment for hypertension",
    referralReason: "Urgent medical condition",
    referredOffice: "Hospital",
    receiverName: "Hospital Social Worker",
    referralDate: "2026-03-18",
    followUpDate: "2026-04-01",
    followUpStatus: "Overdue",
    priorityLevel: "High Risk",
    status: "Escalated",
    outcome: "Initial contact made, awaiting schedule",
    remarks: "Escalated to Hospital — untreated hypertension, lives alone",
  },
  {
    id: "ref003",
    pwdId: "pwd002",
    pwdName: "Carlos Dela Torre",
    referralType: "Medical / Health",
    identifiedNeed: "Routine medical consultation",
    referralReason: "Missed checkup",
    referredOffice: "Barangay Health Center",
    receiverName: "BHC Physician",
    referralDate: "2026-04-22",
    followUpDate: "2026-05-06",
    followUpStatus: "Completed",
    priorityLevel: "Moderate Risk",
    status: "Completed",
    outcome: "Consultation completed; follow-up prescription issued",
    remarks: "",
  },
  {
    id: "ref004",
    pwdId: "pwd007",
    pwdName: "Cynthia Mercado",
    referralType: "Medical / Health",
    identifiedNeed: "Therapy follow-up",
    referralReason: "Therapy-related concern",
    referredOffice: "Barangay Health Center",
    receiverName: "BHC Nurse-in-Charge",
    referralDate: "2026-06-01",
    followUpDate: "2026-06-15",
    followUpStatus: "Missed",
    priorityLevel: "High Risk",
    status: "Pending",
    outcome: "",
    remarks: "Coordinate with BHC for psychosocial therapy session",
  },
  {
    id: "ref005",
    pwdId: "pwd003",
    pwdName: "Maria Elena Reyes",
    referralType: "Medical / Health",
    identifiedNeed: "Medication review and health monitoring",
    referralReason: "Medication concern",
    referredOffice: "Barangay Health Center",
    receiverName: "BHC Nurse-in-Charge",
    referralDate: "2026-05-28",
    followUpDate: "2026-06-18",
    followUpStatus: "Scheduled",
    priorityLevel: "Moderate Risk",
    status: "Received",
    outcome: "",
    remarks: "Parent confirmed availability for scheduled visit",
  },
];

export const SYSTEM_USERS: SystemUser[] = [
  {
    id: "u1",
    fullName: "Maria Santos",
    username: "admin",
    role: "Administrator / Assigned PWD Coordinator",
    status: "Active",
    lastLogin: "2026-06-17 08:30",
    contactNumber: "09171111111",
  },
];

export const AUDIT_LOGS: AuditLog[] = [
  { id: "log001", user: "Maria Santos", action: "Submitted health assessment", module: "Welfare Assessment", dateTime: "2026-06-17 08:55" },
  { id: "log002", user: "Maria Santos", action: "Created health referral", module: "Referrals", dateTime: "2026-06-16 15:20" },
  { id: "log003", user: "Maria Santos", action: "Confirmed risk classification", module: "At-Risk Cases", dateTime: "2026-06-16 14:10" },
  { id: "log004", user: "Maria Santos", action: "Generated report", module: "Reports", dateTime: "2026-06-16 11:05" },
  { id: "log005", user: "Maria Santos", action: "Updated referral status", module: "Referrals", dateTime: "2026-06-15 09:30" },
  { id: "log006", user: "Maria Santos", action: "Updated PWD profile", module: "PWD Profiles", dateTime: "2026-06-15 08:45" },
  { id: "log007", user: "Maria Santos", action: "Recorded follow-up outcome", module: "Referrals", dateTime: "2026-06-14 16:00" },
  { id: "log008", user: "Maria Santos", action: "Submitted health assessment", module: "Welfare Assessment", dateTime: "2026-06-14 13:25" },
  { id: "log009", user: "Maria Santos", action: "Changed account password", module: "Account Settings", dateTime: "2026-06-13 10:15" },
  { id: "log010", user: "Maria Santos", action: "Updated account information", module: "Account Settings", dateTime: "2026-06-12 09:00" },
  { id: "log011", user: "Maria Santos", action: "Created PWD profile", module: "PWD Profiles", dateTime: "2026-06-11 10:30" },
  { id: "log012", user: "Maria Santos", action: "Generated report", module: "Reports", dateTime: "2026-06-10 15:00" },
];

// Recent activity feed for the Dashboard — newest first.
export const RECENT_UPDATES: RecentUpdate[] = [
  { id: "ru001", type: "Assessment", actor: "Maria Santos", action: "Submitted health assessment", subject: "Cynthia Mercado", dateTime: "2026-06-17 08:55" },
  { id: "ru002", type: "Risk", actor: "Maria Santos", action: "Confirmed risk level as High Risk", subject: "Luisa Magbanua", dateTime: "2026-06-17 08:40" },
  { id: "ru003", type: "Referral", actor: "Maria Santos", action: "Created referral to Barangay Health Center", subject: "Cynthia Mercado", dateTime: "2026-06-16 15:20" },
  { id: "ru004", type: "Status", actor: "BHC Nurse-in-Charge", action: "Referral status changed to Received", subject: "Maria Elena Reyes", dateTime: "2026-06-16 11:05" },
  { id: "ru005", type: "Status", actor: "Maria Santos", action: "Referral status changed to Escalated", subject: "Fernando Navarro", dateTime: "2026-06-15 16:30" },
  { id: "ru006", type: "Assessment", actor: "Maria Santos", action: "Submitted health assessment", subject: "Rosa Villanueva", dateTime: "2026-06-15 09:30" },
  { id: "ru007", type: "Profile", actor: "Maria Santos", action: "Updated PWD profile", subject: "Ernesto Castillo", dateTime: "2026-06-15 08:45" },
  { id: "ru008", type: "Status", actor: "BHC Physician", action: "Referral status changed to Completed", subject: "Carlos Dela Torre", dateTime: "2026-06-14 16:00" },
  { id: "ru009", type: "Risk", actor: "Maria Santos", action: "Confirmed risk level as Moderate Risk", subject: "Carlos Dela Torre", dateTime: "2026-06-14 13:25" },
  { id: "ru010", type: "Referral", actor: "Maria Santos", action: "Created referral to Hospital", subject: "Fernando Navarro", dateTime: "2026-06-13 10:15" },
];

export const REFERRED_OFFICES = [
  "Barangay Health Center",
  "Hospital",
  "DSWD",
  "PDAO",
  "Schools",
  "SPED Centers",
];

export const REFERRAL_REASONS = [
  "Medical consultation",
  "Missed checkup",
  "Medication concern",
  "Treatment need",
  "Therapy-related concern",
  "Urgent medical condition",
];

export const REFERRAL_TYPES = [
  "Medical / Health",
  "Educational / SPED",
  "Social Welfare",
  "Financial Assistance",
  "Assistive Device",
  "Legal / Documentation",
];

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
