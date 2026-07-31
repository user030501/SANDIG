// FR-03 — PWD profile management.

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { asyncHandler, HttpError } from "../middleware/errors";
import { fromApiDisability, fromApiRisk } from "../codecs";
import { serializeProfile } from "../serializers";
import { RISK_SORT_ORDER } from "../ordering";

export const profilesRouter = Router();

const profileSchema = z.object({
  fullName: z.string().min(1),
  dateOfBirth: z.string().min(1),
  sex: z.string().min(1),
  address: z.string().min(1),
  contactNumber: z.string().default(""),
  civilStatus: z.string().default(""),
  disabilityType: z.string(),
  pwdIdNumber: z.string().min(1),
  pwdIdStatus: z.enum(["Active", "Expired", "Pending"]).default("Active"),
  dateRegistered: z.string().min(1),
  assistiveDevice: z.string().default(""),
  // Optional: an unknown household size stays null rather than defaulting to 1.
  householdSize: z.coerce.number().int().min(1).nullish(),
  livingCondition: z.string().default(""),
  incomeBracket: z.string().default(""),
  supportSituation: z.string().default(""),
  caregiverName: z.string().default(""),
  caregiverRelationship: z.string().default(""),
  caregiverContact: z.string().default(""),
  caregiverAvailability: z.string().default(""),
  purok: z.string().min(1),
});

const toRow = (input: z.infer<typeof profileSchema>) => ({
  ...input,
  disabilityType: fromApiDisability(input.disabilityType),
  dateOfBirth: new Date(input.dateOfBirth),
  dateRegistered: new Date(input.dateRegistered),
});

/** Latest assessment date per PWD, for the `lastAssessment` display field. */
async function lastAssessmentDates(ids: string[]): Promise<Map<string, Date>> {
  if (ids.length === 0) return new Map();
  const rows = await prisma.assessment.groupBy({
    by: ["pwdId"],
    where: { pwdId: { in: ids } },
    _max: { date: true },
  });
  return new Map(rows.filter((r) => r._max.date).map((r) => [r.pwdId, r._max.date!]));
}

// FR-18 default ordering: High -> Moderate -> Low, then nearest follow-up date
// within each group. Applied here so every list view inherits it.
profilesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search, disabilityType, purok, riskStatus } = req.query as Record<string, string>;

    const profiles = await prisma.pwdProfile.findMany({
      where: {
        active: true,
        ...(riskStatus ? { riskStatus: fromApiRisk(riskStatus) } : {}),
        ...(purok ? { purok } : {}),
        ...(disabilityType ? { disabilityType: fromApiDisability(disabilityType) } : {}),
        ...(search
          ? {
              OR: [
                // MySQL's default collation is case-insensitive, so `contains`
                // already matches regardless of case. Prisma's `mode` argument
                // is PostgreSQL-only and is not generated for this provider.
                { fullName: { contains: search } },
                { pwdIdNumber: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        referrals: {
          where: { followUpDate: { not: null }, followUpStatus: { not: "Completed" } },
          orderBy: { followUpDate: "asc" },
          take: 1,
        },
      },
    });

    const lastDates = await lastAssessmentDates(profiles.map((p) => p.id));

    const sorted = profiles.sort((a, b) => {
      const byRisk = RISK_SORT_ORDER[a.riskStatus] - RISK_SORT_ORDER[b.riskStatus];
      if (byRisk !== 0) return byRisk;
      const aNext = a.referrals[0]?.followUpDate?.getTime() ?? Infinity;
      const bNext = b.referrals[0]?.followUpDate?.getTime() ?? Infinity;
      if (aNext !== bNext) return aNext - bNext;
      return a.fullName.localeCompare(b.fullName);
    });

    res.json(sorted.map((p) => serializeProfile(p, lastDates.get(p.id) ?? null)));
  })
);

profilesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const profile = await prisma.pwdProfile.findUnique({ where: { id: req.params.id } });
    if (!profile) throw new HttpError(404, "PWD profile not found.");
    const last = await prisma.assessment.findFirst({
      where: { pwdId: profile.id },
      orderBy: { date: "desc" },
      select: { date: true },
    });
    res.json(serializeProfile(profile, last?.date ?? null));
  })
);

profilesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = profileSchema.parse(req.body);
    const existing = await prisma.pwdProfile.findUnique({
      where: { pwdIdNumber: input.pwdIdNumber },
    });
    if (existing) throw new HttpError(409, `PWD ID ${input.pwdIdNumber} is already registered.`);

    const created = await prisma.pwdProfile.create({ data: toRow(input) });
    await prisma.recentUpdate.create({
      data: {
        type: "Profile",
        actor: req.user?.fullName ?? "Administrator",
        action: "Created PWD profile",
        subject: created.fullName,
      },
    });
    res.status(201).json(serializeProfile(created, null));
  })
);

profilesRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = profileSchema.parse(req.body);
    const existing = await prisma.pwdProfile.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "PWD profile not found.");

    const clash = await prisma.pwdProfile.findUnique({
      where: { pwdIdNumber: input.pwdIdNumber },
    });
    if (clash && clash.id !== existing.id) {
      throw new HttpError(409, `PWD ID ${input.pwdIdNumber} belongs to another record.`);
    }

    const updated = await prisma.pwdProfile.update({
      where: { id: existing.id },
      data: toRow(input),
    });
    await prisma.recentUpdate.create({
      data: {
        type: "Profile",
        actor: req.user?.fullName ?? "Administrator",
        action: "Updated PWD profile",
        subject: updated.fullName,
      },
    });
    const last = await prisma.assessment.findFirst({
      where: { pwdId: updated.id },
      orderBy: { date: "desc" },
      select: { date: true },
    });
    res.json(serializeProfile(updated, last?.date ?? null));
  })
);

// Soft delete — assessment and referral history must survive for FR-25.
profilesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.pwdProfile.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "PWD profile not found.");
    await prisma.pwdProfile.update({ where: { id: existing.id }, data: { active: false } });
    res.status(204).end();
  })
);
