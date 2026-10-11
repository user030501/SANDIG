// One-off migration helper for the multi-disability feature.
//
// Before this feature, each PWD profile had exactly one `disabilityType`.
// That column is now legacy (nullable) and superseded by `disabilityTypes`,
// a JSON array that can hold more than one. The app already falls back to
// the legacy column for any row where `disabilityTypes` is empty, so running
// this script is NOT required for the app to keep working — it just copies
// each row's existing single value into the new array column so the legacy
// column can eventually be dropped.
//
// Usage (after `npx prisma db push` has added the new column):
//   npx tsx prisma/backfill-disability-types.ts

import { PrismaClient } from "@prisma/client";
import { toApiDisability } from "../src/codecs";

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.pwdProfile.findMany({
    where: { disabilityType: { not: null } },
    select: { id: true, disabilityType: true, disabilityTypes: true },
  });

  const needsBackfill = rows.filter(
    (r) => !Array.isArray(r.disabilityTypes) || r.disabilityTypes.length === 0
  );

  console.log(`${rows.length} rows have a legacy disabilityType; ${needsBackfill.length} need backfilling.`);

  for (const row of needsBackfill) {
    await prisma.pwdProfile.update({
      where: { id: row.id },
      data: { disabilityTypes: [toApiDisability(row.disabilityType!)] },
    });
  }

  console.log(`Backfilled ${needsBackfill.length} profile(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
