// Free-text case notes against a PWD — a running log independent of the
// scored assessment flow, with full edit/delete since it is field observation
// text rather than an authoritative record.

import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { asyncHandler, HttpError } from "../middleware/errors";
import { toIsoDate } from "../codecs";

export const caseNotesRouter = Router();

const serializeCaseNote = (n: {
  id: string; pwdId: string; note: string; createdAt: Date;
  pwd: { fullName: string }; author: { fullName: string };
}) => ({
  id: n.id,
  pwdId: n.pwdId,
  pwdName: n.pwd.fullName,
  author: n.author.fullName,
  date: toIsoDate(n.createdAt),
  note: n.note,
});

caseNotesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { pwdId } = req.query as Record<string, string>;
    const notes = await prisma.caseNote.findMany({
      where: pwdId ? { pwdId } : undefined,
      include: { pwd: { select: { fullName: true } }, author: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(notes.map(serializeCaseNote));
  })
);

const createSchema = z.object({
  pwdId: z.string().min(1),
  note: z.string().min(1, "Note text is required."),
});

caseNotesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createSchema.parse(req.body);
    const pwd = await prisma.pwdProfile.findUnique({ where: { id: input.pwdId } });
    if (!pwd) throw new HttpError(404, "PWD profile not found.");

    const created = await prisma.caseNote.create({
      data: { pwdId: input.pwdId, note: input.note, authorId: req.user!.id },
      include: { pwd: { select: { fullName: true } }, author: { select: { fullName: true } } },
    });
    res.status(201).json(serializeCaseNote(created));
  })
);

const updateSchema = z.object({ note: z.string().min(1, "Note text is required.") });

caseNotesRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = updateSchema.parse(req.body);
    const existing = await prisma.caseNote.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Case note not found.");

    const updated = await prisma.caseNote.update({
      where: { id: existing.id },
      data: { note: input.note },
      include: { pwd: { select: { fullName: true } }, author: { select: { fullName: true } } },
    });
    res.json(serializeCaseNote(updated));
  })
);

caseNotesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.caseNote.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new HttpError(404, "Case note not found.");
    await prisma.caseNote.delete({ where: { id: existing.id } });
    res.status(204).end();
  })
);
