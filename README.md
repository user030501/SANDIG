# SANDIG

**System for Assessment, Needs Detection, Intervention, and Guidance** — a PWD
health-welfare referral and risk-monitoring system for Barangay New Pandan.

## Architecture

Three layers, per manuscript Section 4.4.6:

```
React 18 + TypeScript (Vite)      :5173
        │  REST/JSON, /api proxied
        ▼
Express + TypeScript + Prisma     :3000  ──►  MySQL/MariaDB  :3306
        │
        └──────────────────────────────►  FastAPI + scikit-learn  :8000
                                            (internal only)
```

The AI service is never exposed to the browser — Express is the only caller.

## Running the whole stack

Four terminals (or run the first three in the background):

```bash
# 1. Database — start MySQL from the XAMPP Control Panel, then:
"C:/xampp/mysql/bin/mysql.exe" -u root -e \
  "CREATE DATABASE IF NOT EXISTS sandig CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. AI service
cd ai-service
python -m venv .venv && ./.venv/Scripts/python.exe -m pip install -r requirements.txt
./.venv/Scripts/python.exe generate_seed_data.py
./.venv/Scripts/python.exe train.py
./.venv/Scripts/python.exe -m uvicorn app:app --host 127.0.0.1 --port 8000

# 3. Backend
cd server
cp .env.example .env          # fill in DATABASE_URL and JWT_SECRET
npm install
npx prisma db push
npm run seed
npm run dev                   # :3000

# 4. Frontend
npm install
npm run dev                   # :5173
```

Then open <http://localhost:5173>.

| Username | Password     |
| -------- | ------------ |
| `admin`  | `sandig2026` |

Seed credentials — change before any real deployment.

Check everything is connected: `curl http://localhost:5173/api/health` should
report `database: connected` and `aiService: reachable`.

## Key design points

### Health Risk Score (manuscript Section 1.2)

```
Score = (Unresolved Health Need   × 2)
      + (Pending Referral         × 2)
      + (Missed Checkup           × 2)
      + (Medication Concern       × 2)
      + (Treatment/Therapy Need   × 2)
      + (Urgent Medical Condition × 4)      maximum 14
```

Exactly three tiers: **Low 0–4 · Moderate 5–8 · High 9+**.

The score is computed **server-side** and is authoritative (FR-07). A score sent
by the client is ignored. The assessment form keeps an identical live preview
for usability only.

### Rule-based and AI results are never merged

Both are stored and displayed separately (FR-09). The Random Forest output is
advisory and is labelled as such everywhere it appears. When the two disagree,
the case shows a disagreement flag.

### Human confirmation is required (FR-10, FR-11)

The Administrator must confirm or override the final risk level. The system
records who confirmed it, when, and whether it was an override. Enforced by the
backend, not just the UI:

- a referral cannot be created against an unconfirmed assessment (409);
- a case cannot be marked reviewed or closed before confirmation (409).

### Urgent medical condition always forces review

Regardless of the computed total or the AI output, an urgent flag sets
`triggersImmediateReview`, opens a case, and blocks closure until a referral for
that PWD has been completed. An urgent-only assessment scores 4 (Low tier) and
is still flagged.

### The AI model is provisional

It is trained on **synthetic** data. The barangay data request is still pending
approval, so no validated dataset exists yet. The provisional status is visible
in the model version string, the API responses, and the UI. See
[ai-service/README.md](ai-service/README.md) for the retraining procedure.

### Single-Administrator model (Section 1.5, FR-23)

One user type: the Administrator / Assigned PWD Coordinator. The Barangay Health
Center and other referred offices are external entities that never log in.

### Vocabularies are kept distinct

- **Referral status** — Pending, Received, In Progress, Completed, Escalated, Cancelled
- **Follow-up status** — Scheduled, Completed, Overdue, Missed

## Layout

| Path              | Contents                                              |
| ----------------- | ----------------------------------------------------- |
| `src/`            | React frontend (pages, components, API client)        |
| `server/`         | Express API, Prisma schema, risk engine — see its README |
| `ai-service/`     | FastAPI Random Forest service — see its README        |

## Further reading

- [server/README.md](server/README.md) — schema decisions, audit logging, auth
- [ai-service/README.md](ai-service/README.md) — model, privacy, retraining
