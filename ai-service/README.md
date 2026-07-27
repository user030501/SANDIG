# SANDIG AI Processing Layer

FastAPI + scikit-learn Random Forest classifier that produces an **advisory**
health-risk prediction for a PWD.

## ⚠️ The current model is provisional

**The deployed model is trained on synthetic data, not real barangay records.**

No validated dataset exists yet — the data request letter to the Barangay
Captain of New Pandan is still pending approval. To make the prediction
pipeline complete and demonstrable now, `generate_seed_data.py` produces a
clearly-labelled synthetic dataset from plausible combinations of the six coded
indicators, and the model is trained on that.

This is surfaced everywhere the model is, and never hidden:

- the model version string ends in `-provisional`;
- `/health` and `/predict` both return `"provisional": true`;
- every `/predict` response carries an `advisory_note` saying so;
- `train.py` prints a warning on completion;
- the frontend displays the version string next to the prediction.

Retrain on approved records before treating any prediction as meaningful. See
[Retraining](#retraining).

## Setup

```bash
cd ai-service
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r requirements.txt   # Windows
# source .venv/bin/activate && pip install -r requirements.txt  # macOS/Linux

python generate_seed_data.py     # writes data/seed_dataset.csv
python train.py                  # writes model.joblib + model_metadata.json
python -m uvicorn app:app --host 127.0.0.1 --port 8000
```

## API

This service is **internal**. Only the Express backend calls it; it is never
exposed to the browser, which preserves the AI Processing Layer boundary in
manuscript Section 4.4.6.

### `POST /predict`

```jsonc
// request — the six coded indicators, in this fixed order
{ "features": [1, 1, 1, 1, 1, 0] }
```

| # | Indicator                  |
| - | -------------------------- |
| 0 | `unresolved_health_need`   |
| 1 | `pending_referral`         |
| 2 | `missed_checkup`           |
| 3 | `medication_concern`       |
| 4 | `treatment_therapy_need`   |
| 5 | `urgent_medical_condition` |

```jsonc
// response
{
  "predicted_class": "High Risk",
  "class_probabilities": { "Low Risk": 0.0, "Moderate Risk": 0.075, "High Risk": 0.925 },
  "model_version": "rf-20260727-provisional",
  "provisional": true,
  "advisory_note": "Advisory only. ..."
}
```

Malformed input (wrong length, non-binary values) is rejected with `422`.

### `GET /health`

Liveness plus the loaded model version. Surfaced on the backend's `/api/health`.

### `GET /model-info`

Full training metadata — dataset, hyperparameters, accuracy, feature
importances. Used for the FR-25 traceability record.

## Privacy

The feature set is **only** the six coded flags. No identifiers, names,
addresses, birthdates, or any other personal information are sent to, accepted
by, or logged in this service (manuscript Section 1.2). `retrain.py` actively
refuses to train on a CSV containing recognisable personal columns.

## Retraining

Once the barangay data request is approved:

1. Export confirmed assessments — **only the seven required columns**:

   ```sql
   \copy (
     SELECT "unresolvedHealthNeed"::int   AS unresolved_health_need,
            "pendingReferral"::int        AS pending_referral,
            "missedCheckup"::int          AS missed_checkup,
            "medicationConcern"::int      AS medication_concern,
            "treatmentTherapyNeed"::int   AS treatment_therapy_need,
            "urgentMedicalCondition"::int AS urgent_medical_condition,
            "confirmedLevel"              AS risk_level
     FROM assessments WHERE "confirmedLevel" IS NOT NULL
   ) TO 'ai-service/data/real_dataset.csv' WITH CSV HEADER;
   ```

   The label is the Administrator's **confirmed** level, not the raw rule-based
   tier — the model should learn from human judgement.

2. Retrain and mark the model as validated:

   ```bash
   python retrain.py --data data/real_dataset.csv --validated
   ```

   `retrain.py` refuses to proceed if the export contains personal columns, has
   fewer than 100 rows, or uses unrecognised labels, and warns when a tier has
   fewer than 15 examples. Omitting `--validated` keeps the provisional marker,
   which is the safe default.

3. Restart the service to load the new model.

## Why labels are noisy by design

`generate_seed_data.py` injects ~8% label noise and draws combinations
stratified across the three tiers. Without noise the Random Forest would simply
memorise the deterministic rule-based formula and report a meaningless 100%
accuracy — the model would add nothing over the rule engine that already exists.
Without stratification, High Risk rows are rare enough that recall on the most
consequential class collapses. Both are artefacts of synthetic data and go away
once real records are used.

Current provisional metrics: **0.96 holdout accuracy, 0.94 5-fold CV**, macro
F1 0.96 across the three tiers. These describe how well the model reproduces
synthetic labels — they say nothing about real-world performance.
