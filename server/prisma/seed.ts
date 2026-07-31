// Seeds the database from the real Barangay New Pandan PWD masterlist.
//
// PRIVACY (RA 10173): the source file holds sensitive personal information —
// names, birthdates, contact numbers and disability type for real residents,
// including minors. It lives in prisma/data/, which is gitignored, and must
// never be committed or copied into a database dump that leaves this machine.
//
// The seed loads PROFILES ONLY. Assessments, at-risk cases, referrals and the
// activity feed are operational records produced by the Administrator through
// the app; inventing them would put fabricated health judgements next to real
// people's names. The dashboard therefore starts at 267 registered PWDs with
// zero assessments, which is the true state of the system before use.
//
// Fields the masterlist does not carry (address, household size, income
// bracket, living condition, caregiver details, assistive device) are left
// empty rather than filled in. A blank is recoverable; a guess is not.

import { PrismaClient, DisabilityType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "sandig2026";

// Resolved from the working directory rather than __dirname: both `npm run
// seed` and `prisma db seed` run from the server/ folder, and __dirname is not
// defined when the loader treats this file as an ES module.
const MASTERLIST = join(process.cwd(), "prisma", "data", "PWD_Masterlist_Clean_Text.txt");

/** The masterlist's blank marker. Never coerced into a real value. */
const BLANK = "Not provided";

/**
 * Placeholder IDs/numbers carried over from the source spreadsheet where a
 * value still needs checking against the paper record. Kept verbatim so they
 * stay visible for follow-up instead of silently becoming data.
 */
const isVerifyPlaceholder = (v: string) => /^VERIFY-\d+$/.test(v);

/** Masterlist disability wording -> Prisma enum identifier. */
const DISABILITY: Record<string, DisabilityType> = {
  "Physical Disability": "Physical",
  "Visual Disability": "Visual",
  "Deaf Or Hard Of Hearing": "Hearing",
  "Intellectual Disability": "Intellectual",
  "Psychosocial Disability": "Psychosocial",
  "Speech And Language Impairment": "Communication",
  "Learning Disability": "Learning",
  "Mental Disability": "Mental",
  "Cancer (Ra 11215)": "Cancer",
  "Rare Disease (Ra 10747)": "RareDisease",
};

interface Entry {
  purok: string;
  pwdIdNumber: string;
  fullName: string;
  disabilityType: DisabilityType;
  dateOfBirth: Date | null;
  sex: string;
  civilStatus: string;
  contactNumber: string;
  educationalAttainment: string;
  occupation: string;
  registrationType: string;
}

/** "3/7/1972" -> Date, in UTC so the stored DATE cannot drift a day by zone. */
function parseDob(raw: string): Date | null {
  if (raw === BLANK) return null;
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) throw new Error(`Unparseable date of birth: "${raw}"`);
  const [, month, day, year] = m;
  const d = new Date(Date.UTC(+year, +month - 1, +day));
  if (d.getUTCMonth() !== +month - 1 || d.getUTCDate() !== +day) {
    throw new Error(`Impossible date of birth: "${raw}"`);
  }
  return d;
}

/**
 * Mobile numbers appear as 9 digits followed by the subscriber number, i.e.
 * the leading 0 has been stripped by the spreadsheet. Restore it so the value
 * is dialable, and leave anything unexpected untouched rather than reshaping
 * a number we do not understand.
 */
function normalizeMobile(raw: string): string {
  if (raw === BLANK || isVerifyPlaceholder(raw)) return "";
  const digits = raw.replace(/\D/g, "");
  if (/^9\d{9}$/.test(digits)) return `0${digits}`;
  return raw;
}

function parseMasterlist(text: string): Entry[] {
  const entries: Entry[] = [];
  // Records start with "<n>. Purok/St.: <value>" and run to the next such line.
  const blocks = text.split(/^\s*\d+\.\s+Purok\/St\.:/m).slice(1);

  for (const block of blocks) {
    const field = (label: string): string => {
      const m = block.match(new RegExp(`^\\s*${label}:\\s*(.*)$`, "m"));
      return m ? m[1].trim() : BLANK;
    };

    const purok = block.split("\n")[0].trim();
    const disabilityRaw = field("Disability");
    const disabilityType = DISABILITY[disabilityRaw];
    if (!disabilityType) throw new Error(`Unmapped disability: "${disabilityRaw}"`);

    const sex = field("Sex");
    const civilStatus = field("Status");
    const registration = field("Registration");

    entries.push({
      purok,
      pwdIdNumber: field("ID No\\."),
      fullName: field("Name"),
      disabilityType,
      dateOfBirth: parseDob(field("DOB")),
      sex: sex === BLANK ? "" : sex,
      civilStatus: civilStatus === BLANK ? "" : civilStatus,
      contactNumber: normalizeMobile(field("Mobile #")),
      educationalAttainment: field("Education") === "NONE" ? "" : field("Education"),
      occupation: field("Occupation") === "NONE" ? "" : field("Occupation"),
      registrationType: registration === BLANK ? "" : registration,
    });
  }
  return entries;
}

async function main() {
  if (!existsSync(MASTERLIST)) {
    throw new Error(
      `Masterlist not found at ${MASTERLIST}\n` +
        `It is deliberately gitignored (sensitive personal information), so a ` +
        `fresh clone will not have it. Copy the file into prisma/data/ before seeding.`
    );
  }
  const entries = parseMasterlist(readFileSync(MASTERLIST, "utf8"));

  // pwdIdNumber is unique. The masterlist repeats one PWD ID across two rows
  // for the same person (same name, birthdate and mobile) with a different
  // purok and disability. Keep the first occurrence and report the collision
  // rather than dropping it silently or minting a fake ID to keep both.
  const seen = new Map<string, Entry>();
  const duplicates: Entry[] = [];
  for (const e of entries) {
    if (seen.has(e.pwdIdNumber)) duplicates.push(e);
    else seen.set(e.pwdIdNumber, e);
  }

  // Idempotent: clear in FK-safe order so re-seeding is always clean.
  await prisma.auditLog.deleteMany();
  await prisma.recentUpdate.deleteMany();
  await prisma.atRiskCase.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.pwdProfile.deleteMany();
  await prisma.systemUser.deleteMany();

  await prisma.systemUser.create({
    data: {
      fullName: "Barangay PWD Coordinator",
      username: ADMIN_USERNAME,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "Administrator / Assigned PWD Coordinator",
      status: "Active",
      contactNumber: "",
    },
  });

  for (const e of seen.values()) {
    await prisma.pwdProfile.create({
      data: {
        fullName: e.fullName,
        dateOfBirth: e.dateOfBirth,
        sex: e.sex,
        // Not on the masterlist — purok is the only location recorded.
        address: "",
        contactNumber: e.contactNumber,
        civilStatus: e.civilStatus,
        disabilityType: e.disabilityType,
        pwdIdNumber: e.pwdIdNumber,
        pwdIdStatus: "Active",
        dateRegistered: null,
        educationalAttainment: e.educationalAttainment,
        occupation: e.occupation,
        registrationType: e.registrationType,
        purok: e.purok,
        // No assessment exists yet, so no risk has been established. LowRisk is
        // the schema's default placeholder, not a clinical finding.
        riskStatus: "LowRisk",
        active: true,
      },
    });
  }

  const total = await prisma.pwdProfile.count();
  console.log(`Seed complete: ${total} PWD profiles from the Barangay New Pandan masterlist.`);
  console.log(`Administrator login — username: ${ADMIN_USERNAME}  password: ${ADMIN_PASSWORD}`);

  const byDisability = await prisma.pwdProfile.groupBy({
    by: ["disabilityType"],
    _count: true,
    orderBy: { _count: { disabilityType: "desc" } },
  });
  console.log("\nBy disability type:");
  for (const row of byDisability) {
    console.log(`  ${row.disabilityType.padEnd(16)} ${row._count}`);
  }

  const missingDob = await prisma.pwdProfile.count({ where: { dateOfBirth: null } });
  const missingMobile = await prisma.pwdProfile.count({ where: { contactNumber: "" } });
  console.log(
    `\nGaps carried over from the source: ${missingDob} without a birthdate, ` +
      `${missingMobile} without a contact number.`
  );
  if (duplicates.length) {
    console.log("\nDuplicate PWD ID in the masterlist — first occurrence kept, please verify:");
    for (const d of duplicates) {
      console.log(`  ${d.pwdIdNumber}  ${d.fullName}  (${d.purok}, ${d.disabilityType})`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
