# SANDIG Server

Express + TypeScript + Prisma backend for the SANDIG PWD welfare system.

## Prerequisites

- Node.js 20+
- XAMPP (MySQL/MariaDB 10.4+)

## Getting started

```bash
# 1. Start MySQL from the XAMPP Control Panel, then create the database
"C:/xampp/mysql/bin/mysql.exe" -u root -e \
  "CREATE DATABASE IF NOT EXISTS sandig CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Configure
cp .env.example .env      # then fill in DATABASE_URL and JWT_SECRET

# 3. Install, create the schema, load demo data
npm install
npx prisma db push
npm run seed

# 4. Run
npm run dev               # http://localhost:3000
```

XAMPP's `root` account has no password by default, which is why `DATABASE_URL`
is `mysql://root@localhost:3306/sandig`. Set a password before any deployment.

### Importing the database instead

`prisma/sandig.sql` is a full `mysqldump` (structure + seed data) for import via
phpMyAdmin or the CLI, for when you want the database without running Node:

```bash
"C:/xampp/mysql/bin/mysql.exe" -u root < prisma/sandig.sql
```

Regenerate it after schema or seed changes:

```bash
"C:/xampp/mysql/bin/mysqldump.exe" -u root --databases sandig \
  --add-drop-database --default-character-set=utf8mb4 --result-file=prisma/sandig.sql
```

`schema.prisma` remains the source of truth — the dump is an export of it, not a
replacement. Avoid editing tables by hand in phpMyAdmin, or the database and the
Prisma client will drift apart.

The frontend (`npm run dev` in the repo root) proxies `/api` to this server, so
run both together and browse to <http://localhost:5173>.

### Demo credentials

| Username | Password     |
| -------- | ------------ |
| `admin`  | `sandig2026` |

Seed data only. Change it before any real deployment.

## Architecture

Three layers, matching manuscript Section 4.4.6:

```
React frontend (:5173)  ->  Express API (:3000)  ->  MySQL/MariaDB (:3306)
                                    |
                                    +-----------> FastAPI Random Forest (:8000)
```

The AI service is reachable **only** from Express — it is never exposed to the
browser, preserving the AI Processing Layer boundary.

## Design notes

### Enum mapping

Several frontend union members contain spaces (`"Low Risk"`, `"In Progress"`,
`"Chronic Illness"`), which are not legal Prisma enum identifiers. Each value is
declared PascalCase and `@map`-ed to the exact frontend string, so MySQL stores
the literal the frontend expects. `src/codecs.ts` translates at the API
boundary — every value the API emits or accepts passes through it, so a
malformed string is rejected at the edge rather than reaching the database.

### Risk indicators: six columns, not a JSON blob

The six scoring indicators are stored as six discrete boolean columns on
`assessments` rather than a single JSON field. The set is fixed and closed, and
the FR-19 "common health concerns" aggregate becomes a plain `COUNT` per column
instead of JSON extraction. This is both simpler and faster here.

### One source of truth for a score

`at_risk_cases` holds only case-management state (flag reason, follow-up status,
open/reviewed/closed). The risk numbers live on `assessments` and are read
through the relation, so a score is never duplicated and cannot drift. The API
composes the frontend's `AtRiskCase` shape by joining the two.

### Rule-based scoring

`src/riskEngine.ts` is authoritative (FR-07). Per manuscript Section 1.2:

```
Health Risk Score = (Unresolved Health Need   x 2)
                  + (Pending Referral         x 2)
                  + (Missed Checkup           x 2)
                  + (Medication Concern       x 2)
                  + (Treatment/Therapy Need   x 2)
                  + (Urgent Medical Condition x 4)     max 14
```

Tiers: Low 0–4 · Moderate 5–8 · High 9+. The frontend keeps an identical live
preview for UX, but the stored score always comes from here.

### Audit logging (FR-22)

`src/middleware/audit.ts` runs in front of the whole API rather than per route,
so any route added later is covered automatically. It records every
state-changing request plus authentication and report generation. Reads are not
logged. An audit write failure is logged to stderr but never fails the request
it describes.

### Authentication

Single-Administrator model (Section 1.5, FR-23). One user type: the
Administrator / Assigned PWD Coordinator. bcrypt password hashes, JWT in an
httpOnly cookie. Login failures return a uniform message so the form cannot be
used to enumerate usernames.

## Scripts

| Script                | Purpose                              |
| --------------------- | ------------------------------------ |
| `npm run dev`         | Watch mode on :3000                  |
| `npm run build`       | Compile to `dist/`                   |
| `npm start`           | Run the compiled build               |
| `npm run typecheck`   | Types only, no emit                  |
| `npm run seed`        | Reset and reload demo data           |
| `npx prisma db push`  | Sync schema without a migration file |
| `npx prisma studio`   | Browse the database                  |
