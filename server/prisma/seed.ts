// Seeds the database from the prototype's mock data so the demo has realistic
// content. Risk scores are NOT copied across — they are recomputed by the
// authoritative server-side engine, which uses the manuscript's weights
// (2 per indicator, 4 for urgent, max 14).

import bcrypt from "bcryptjs";
import { PrismaClient, type RiskLevel } from "@prisma/client";
import { computeRuleBasedScore, type Indicators } from "../src/riskEngine";
import { fromApiDisability } from "../src/codecs";

const prisma = new PrismaClient();

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "sandig2026";

const profiles = [
  { key: "pwd001", fullName: "Luisa Magbanua", dateOfBirth: "1982-03-15", sex: "Female", address: "Purok 2, Brgy. New Pandan", contactNumber: "09171234567", civilStatus: "Married", disabilityType: "Physical", pwdIdNumber: "PWD-2021-001", pwdIdStatus: "Active", dateRegistered: "2021-06-10", assistiveDevice: "Wheelchair", householdSize: 5, livingCondition: "Renting", incomeBracket: "Below Minimum Wage", supportSituation: "Has family support", caregiverName: "Roberto Magbanua", caregiverRelationship: "Spouse", caregiverContact: "09177654321", caregiverAvailability: "Full-time", purok: "Purok 2" },
  { key: "pwd002", fullName: "Carlos Dela Torre", dateOfBirth: "1975-08-22", sex: "Male", address: "Purok 4, Brgy. New Pandan", contactNumber: "09281234567", civilStatus: "Single", disabilityType: "Visual", pwdIdNumber: "PWD-2020-002", pwdIdStatus: "Expired", dateRegistered: "2020-03-18", assistiveDevice: "White Cane", householdSize: 2, livingCondition: "Own home", incomeBracket: "Minimum Wage", supportSituation: "Lives with elderly parent", caregiverName: "Remedios Dela Torre", caregiverRelationship: "Mother", caregiverContact: "09282345678", caregiverAvailability: "Part-time", purok: "Purok 4" },
  { key: "pwd003", fullName: "Maria Elena Reyes", dateOfBirth: "2005-11-03", sex: "Female", address: "Purok 1, Brgy. New Pandan", contactNumber: "09331234567", civilStatus: "Single", disabilityType: "Intellectual", pwdIdNumber: "PWD-2022-003", pwdIdStatus: "Active", dateRegistered: "2022-01-25", assistiveDevice: "None", householdSize: 6, livingCondition: "Own home", incomeBracket: "Below Minimum Wage", supportSituation: "Has family support", caregiverName: "Teresita Reyes", caregiverRelationship: "Mother", caregiverContact: "09334567890", caregiverAvailability: "Full-time", purok: "Purok 1" },
  { key: "pwd004", fullName: "Fernando Navarro", dateOfBirth: "1968-07-14", sex: "Male", address: "Purok 3, Brgy. New Pandan", contactNumber: "09451234567", civilStatus: "Widowed", disabilityType: "Hearing", pwdIdNumber: "PWD-2019-004", pwdIdStatus: "Active", dateRegistered: "2019-09-05", assistiveDevice: "Hearing Aid", householdSize: 1, livingCondition: "Renting", incomeBracket: "No income", supportSituation: "Lives alone", caregiverName: "None", caregiverRelationship: "N/A", caregiverContact: "N/A", caregiverAvailability: "No caregiver", purok: "Purok 3" },
  { key: "pwd005", fullName: "Rosa Villanueva", dateOfBirth: "1990-01-28", sex: "Female", address: "Purok 5, Brgy. New Pandan", contactNumber: "09561234567", civilStatus: "Married", disabilityType: "Chronic Illness", pwdIdNumber: "PWD-2023-005", pwdIdStatus: "Active", dateRegistered: "2023-04-12", assistiveDevice: "None", householdSize: 4, livingCondition: "Own home", incomeBracket: "Minimum Wage", supportSituation: "Has family support", caregiverName: "Mario Villanueva", caregiverRelationship: "Spouse", caregiverContact: "09567890123", caregiverAvailability: "Part-time", purok: "Purok 5" },
  { key: "pwd006", fullName: "Antonio Bautista", dateOfBirth: "1955-12-05", sex: "Male", address: "Purok 1, Brgy. New Pandan", contactNumber: "09671234567", civilStatus: "Married", disabilityType: "Physical", pwdIdNumber: "PWD-2018-006", pwdIdStatus: "Active", dateRegistered: "2018-07-20", assistiveDevice: "Crutches", householdSize: 3, livingCondition: "Own home", incomeBracket: "Senior Citizen Pension", supportSituation: "Has family support", caregiverName: "Lourdes Bautista", caregiverRelationship: "Spouse", caregiverContact: "09678901234", caregiverAvailability: "Full-time", purok: "Purok 1" },
  { key: "pwd007", fullName: "Cynthia Mercado", dateOfBirth: "1998-06-17", sex: "Female", address: "Purok 6, Brgy. New Pandan", contactNumber: "09781234567", civilStatus: "Single", disabilityType: "Psychosocial", pwdIdNumber: "PWD-2024-007", pwdIdStatus: "Pending", dateRegistered: "2024-02-14", assistiveDevice: "None", householdSize: 4, livingCondition: "Renting", incomeBracket: "Below Minimum Wage", supportSituation: "Limited family support", caregiverName: "Gloria Mercado", caregiverRelationship: "Mother", caregiverContact: "09789012345", caregiverAvailability: "Part-time", purok: "Purok 6" },
  { key: "pwd008", fullName: "Ernesto Castillo", dateOfBirth: "1980-04-09", sex: "Male", address: "Purok 2, Brgy. New Pandan", contactNumber: "09891234567", civilStatus: "Separated", disabilityType: "Communication", pwdIdNumber: "PWD-2022-008", pwdIdStatus: "Active", dateRegistered: "2022-08-30", assistiveDevice: "Communication Board", householdSize: 2, livingCondition: "Own home", incomeBracket: "Minimum Wage", supportSituation: "Has sibling support", caregiverName: "Mila Castillo", caregiverRelationship: "Sister", caregiverContact: "09890123456", caregiverAvailability: "Part-time", purok: "Purok 2" },
] as const;

const ind = (o: Partial<Indicators>): Indicators => ({
  unresolvedHealthNeed: false, pendingReferral: false, missedCheckup: false,
  medicationConcern: false, treatmentTherapyNeed: false, urgentMedicalCondition: false,
  ...o,
});

// The AI probabilities below are illustrative fixtures for the seed only. Live
// predictions come from the Random Forest service.
const cases = [
  {
    pwdKey: "pwd001", date: "2026-05-10",
    healthConcern: "Recurring back pain and pressure sores",
    checkupAttendance: "Irregular", therapyAttendance: "None",
    medicationAccess: "Difficult — no transport", deviceType: "Wheelchair",
    deviceCondition: "Worn", needsRepair: true, needsReplacement: false,
    urgentNeed: "Wheelchair repair, medical check-up",
    remarks: "PWD has not had a check-up in 8 months. Caregiver is aging.",
    recommendedAction: "Refer to Barangay Health Center",
    indicators: ind({ unresolvedHealthNeed: true, pendingReferral: true, missedCheckup: true, medicationConcern: true, treatmentTherapyNeed: true }),
    ai: { predicted: "HighRisk" as RiskLevel, low: 0.03, moderate: 0.15, high: 0.82 },
    flagReason: "Missed scheduled checkup; medication not being taken regularly; therapy not yet started",
    followUpStatus: "Scheduled" as const, status: "Open" as const,
    confirmedAt: "2026-05-11", confirm: true,
  },
  {
    pwdKey: "pwd004", date: "2026-03-15",
    healthConcern: "Hypertension, no medication",
    checkupAttendance: "None in past year", therapyAttendance: "None",
    medicationAccess: "Cannot afford", deviceType: "Hearing Aid",
    deviceCondition: "Broken", needsRepair: false, needsReplacement: true,
    urgentNeed: "Medical assistance, hearing aid replacement",
    remarks: "Lives alone. Urgent situation — no support network.",
    recommendedAction: "Immediate referral to Hospital — urgent medical condition",
    indicators: ind({ unresolvedHealthNeed: true, pendingReferral: true, missedCheckup: true, medicationConcern: true, urgentMedicalCondition: true }),
    ai: { predicted: "HighRisk" as RiskLevel, low: 0.01, moderate: 0.05, high: 0.94 },
    flagReason: "Urgent medical condition reported; unresolved medication concern; pending Barangay Health Center referral",
    followUpStatus: "Overdue" as const, status: "Open" as const,
    confirmedAt: "2026-03-16", confirm: true,
  },
  {
    pwdKey: "pwd007", date: "2026-05-30",
    healthConcern: "Therapy sessions discontinued",
    checkupAttendance: "Irregular", therapyAttendance: "None",
    medicationAccess: "Accessible", deviceType: "None",
    deviceCondition: "N/A", needsRepair: false, needsReplacement: false,
    urgentNeed: "Psychosocial therapy follow-up",
    remarks: "Missed two consecutive health assessments.",
    recommendedAction: "Coordinate with BHC for therapy session",
    indicators: ind({ unresolvedHealthNeed: true, pendingReferral: true, missedCheckup: true, treatmentTherapyNeed: true }),
    // Rule-based lands on Moderate (8); the model says High — left unconfirmed
    // so the disagreement + confirmation workflow is demonstrable.
    ai: { predicted: "HighRisk" as RiskLevel, low: 0.05, moderate: 0.34, high: 0.61 },
    flagReason: "Therapy follow-up overdue; treatment not yet received; missed two consecutive health assessments",
    followUpStatus: "Missed" as const, status: "Open" as const,
    confirmedAt: null, confirm: false,
  },
  {
    pwdKey: "pwd002", date: "2026-04-20",
    healthConcern: "Routine consultation not completed",
    checkupAttendance: "Irregular", therapyAttendance: "N/A",
    medicationAccess: "Accessible", deviceType: "White Cane",
    deviceCondition: "Good", needsRepair: false, needsReplacement: false,
    urgentNeed: "Routine medical consultation",
    remarks: "Treatment not yet received following last assessment recommendation.",
    recommendedAction: "Refer to Barangay Health Center",
    indicators: ind({ missedCheckup: true, treatmentTherapyNeed: true }),
    ai: { predicted: "LowRisk" as RiskLevel, low: 0.58, moderate: 0.34, high: 0.08 },
    flagReason: "Missed scheduled checkup; treatment not yet received following last assessment recommendation",
    followUpStatus: "Completed" as const, status: "Reviewed" as const,
    confirmedAt: "2026-04-21", confirm: true,
  },
];

const referrals = [
  { pwdKey: "pwd001", referralType: "Medical / Health", identifiedNeed: "Medical consultation and wheelchair assessment", referralReason: "Missed checkup", referredOffice: "Barangay Health Center", receiverName: "BHC Nurse-in-Charge", referralDate: "2026-05-12", followUpDate: "2026-05-26", followUpStatus: "Overdue" as const, status: "InProgress" as const, outcome: "", remarks: "Has not had a check-up in 8 months; wheelchair condition worsening" },
  { pwdKey: "pwd004", referralType: "Medical / Health", identifiedNeed: "Urgent medical treatment for hypertension", referralReason: "Urgent medical condition", referredOffice: "Hospital", receiverName: "Hospital Social Worker", referralDate: "2026-03-18", followUpDate: "2026-04-01", followUpStatus: "Overdue" as const, status: "Escalated" as const, outcome: "Initial contact made, awaiting schedule", remarks: "Escalated to Hospital — untreated hypertension, lives alone" },
  { pwdKey: "pwd002", referralType: "Medical / Health", identifiedNeed: "Routine medical consultation", referralReason: "Missed checkup", referredOffice: "Barangay Health Center", receiverName: "BHC Physician", referralDate: "2026-04-22", followUpDate: "2026-05-06", followUpStatus: "Completed" as const, status: "Completed" as const, outcome: "Consultation completed; follow-up prescription issued", remarks: "" },
  { pwdKey: "pwd007", referralType: "Medical / Health", identifiedNeed: "Therapy follow-up", referralReason: "Therapy-related concern", referredOffice: "Barangay Health Center", receiverName: "BHC Nurse-in-Charge", referralDate: "2026-06-01", followUpDate: "2026-06-15", followUpStatus: "Missed" as const, status: "Pending" as const, outcome: "", remarks: "Coordinate with BHC for psychosocial therapy session" },
  { pwdKey: "pwd003", referralType: "Medical / Health", identifiedNeed: "Medication review and health monitoring", referralReason: "Medication concern", referredOffice: "Barangay Health Center", receiverName: "BHC Nurse-in-Charge", referralDate: "2026-05-28", followUpDate: "2026-06-18", followUpStatus: "Scheduled" as const, status: "Received" as const, outcome: "", remarks: "Parent confirmed availability for scheduled visit" },
];

const updates = [
  { type: "Assessment" as const, actor: "Maria Santos", action: "Submitted health assessment", subject: "Cynthia Mercado", dateTime: "2026-06-17T08:55:00Z" },
  { type: "Risk" as const, actor: "Maria Santos", action: "Confirmed risk level as High Risk", subject: "Luisa Magbanua", dateTime: "2026-06-17T08:40:00Z" },
  { type: "Referral" as const, actor: "Maria Santos", action: "Created referral to Barangay Health Center", subject: "Cynthia Mercado", dateTime: "2026-06-16T15:20:00Z" },
  { type: "Status" as const, actor: "BHC Nurse-in-Charge", action: "Referral status changed to Received", subject: "Maria Elena Reyes", dateTime: "2026-06-16T11:05:00Z" },
  { type: "Status" as const, actor: "Maria Santos", action: "Referral status changed to Escalated", subject: "Fernando Navarro", dateTime: "2026-06-15T16:30:00Z" },
  { type: "Assessment" as const, actor: "Maria Santos", action: "Submitted health assessment", subject: "Rosa Villanueva", dateTime: "2026-06-15T09:30:00Z" },
  { type: "Profile" as const, actor: "Maria Santos", action: "Updated PWD profile", subject: "Ernesto Castillo", dateTime: "2026-06-15T08:45:00Z" },
  { type: "Status" as const, actor: "BHC Physician", action: "Referral status changed to Completed", subject: "Carlos Dela Torre", dateTime: "2026-06-14T16:00:00Z" },
  { type: "Risk" as const, actor: "Maria Santos", action: "Confirmed risk level as Low Risk", subject: "Carlos Dela Torre", dateTime: "2026-06-14T13:25:00Z" },
  { type: "Referral" as const, actor: "Maria Santos", action: "Created referral to Hospital", subject: "Fernando Navarro", dateTime: "2026-06-13T10:15:00Z" },
];

async function main() {
  // Idempotent: clear in FK-safe order so re-seeding is always clean.
  await prisma.auditLog.deleteMany();
  await prisma.recentUpdate.deleteMany();
  await prisma.atRiskCase.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.pwdProfile.deleteMany();
  await prisma.systemUser.deleteMany();

  const admin = await prisma.systemUser.create({
    data: {
      fullName: "Maria Santos",
      username: ADMIN_USERNAME,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "Administrator / Assigned PWD Coordinator",
      status: "Active",
      contactNumber: "09171111111",
      lastLogin: new Date("2026-06-17T08:30:00Z"),
    },
  });

  const idByKey = new Map<string, string>();
  for (const p of profiles) {
    const { key, dateOfBirth, dateRegistered, disabilityType, pwdIdStatus, ...rest } = p;
    const created = await prisma.pwdProfile.create({
      data: {
        ...rest,
        disabilityType: fromApiDisability(disabilityType),
        pwdIdStatus: pwdIdStatus as "Active" | "Expired" | "Pending",
        dateOfBirth: new Date(dateOfBirth),
        dateRegistered: new Date(dateRegistered),
        riskStatus: "LowRisk",
      },
    });
    idByKey.set(key, created.id);
  }

  for (const c of cases) {
    const pwdId = idByKey.get(c.pwdKey)!;
    // Score comes from the authoritative engine, never from a stored constant.
    const rule = computeRuleBasedScore(c.indicators);
    const confirmedLevel = c.confirm ? rule.level : null;

    const assessment = await prisma.assessment.create({
      data: {
        pwdId,
        date: new Date(c.date),
        assessedById: admin.id,
        healthConcern: c.healthConcern,
        checkupAttendance: c.checkupAttendance,
        therapyAttendance: c.therapyAttendance,
        medicationAccess: c.medicationAccess,
        deviceType: c.deviceType,
        deviceCondition: c.deviceCondition,
        needsRepair: c.needsRepair,
        needsReplacement: c.needsReplacement,
        urgentNeed: c.urgentNeed,
        remarks: c.remarks,
        recommendedAction: c.recommendedAction,
        ...c.indicators,
        ruleScore: rule.score,
        ruleLevel: rule.level,
        ruleVersion: rule.ruleVersion,
        triggersImmediateReview: rule.triggersImmediateReview,
        aiPredicted: c.ai.predicted,
        aiProbLow: c.ai.low,
        aiProbModerate: c.ai.moderate,
        aiProbHigh: c.ai.high,
        aiModelVersion: "rf-seed-0.1-provisional",
        aiPredictedAt: new Date(c.date),
        confirmedLevel,
        confirmedById: c.confirm ? admin.id : null,
        confirmedAt: c.confirmedAt ? new Date(c.confirmedAt) : null,
        overridden: c.confirm ? false : null,
      },
    });

    await prisma.atRiskCase.create({
      data: {
        pwdId,
        assessmentId: assessment.id,
        flagReason: c.flagReason,
        dateFlagged: new Date(c.date),
        followUpStatus: c.followUpStatus,
        status: c.status,
      },
    });

    if (confirmedLevel) {
      await prisma.pwdProfile.update({
        where: { id: pwdId },
        data: { riskStatus: confirmedLevel },
      });
    }
  }

  for (const r of referrals) {
    const { pwdKey, referralDate, followUpDate, ...rest } = r;
    await prisma.referral.create({
      data: {
        ...rest,
        pwdId: idByKey.get(pwdKey)!,
        referralDate: new Date(referralDate),
        followUpDate: new Date(followUpDate),
        priorityLevel: (await prisma.pwdProfile.findUnique({ where: { id: idByKey.get(pwdKey)! } }))!.riskStatus,
      },
    });
  }

  for (const u of updates) {
    await prisma.recentUpdate.create({ data: { ...u, dateTime: new Date(u.dateTime) } });
  }

  const counts = {
    users: await prisma.systemUser.count(),
    profiles: await prisma.pwdProfile.count(),
    assessments: await prisma.assessment.count(),
    atRiskCases: await prisma.atRiskCase.count(),
    referrals: await prisma.referral.count(),
    recentUpdates: await prisma.recentUpdate.count(),
  };
  console.log("Seed complete:", counts);
  console.log(`Administrator login — username: ${ADMIN_USERNAME}  password: ${ADMIN_PASSWORD}`);

  for (const a of await prisma.assessment.findMany({ include: { pwd: true } })) {
    console.log(
      `  ${a.pwd.fullName.padEnd(20)} score=${String(a.ruleScore).padStart(2)}/14  rule=${a.ruleLevel.padEnd(12)} ai=${a.aiPredicted}  confirmed=${a.confirmedLevel ?? "(pending)"}`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
