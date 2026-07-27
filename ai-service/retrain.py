"""
Retrains the SANDIG classifier on real, approved barangay records.

WHEN TO USE THIS
=============================================================================
Only once the data request to the Barangay Captain of New Pandan has been
approved and a validated export of real assessment records is available. Until
then the deployed model is the provisional one trained on synthetic data by
train.py.

WHAT IT EXPECTS
=============================================================================
A CSV with one row per confirmed assessment and these columns:

    unresolved_health_need,pending_referral,missed_checkup,
    medication_concern,treatment_therapy_need,urgent_medical_condition,
    risk_level

  * The six indicator columns are 0 or 1.
  * `risk_level` is the Administrator's CONFIRMED level — "Low Risk",
    "Moderate Risk" or "High Risk" — not the raw rule-based tier. The point of
    the model is to learn from human judgement, so the confirmed column is the
    ground truth.
  * No identifiers, names, addresses, or other personal fields. Export only
    the seven columns above (Section 1.2).

The confirmed labels can be exported from MySQL with:

    mysql -u root sandig -B -e "
      SELECT unresolvedHealthNeed   AS unresolved_health_need,
             pendingReferral        AS pending_referral,
             missedCheckup          AS missed_checkup,
             medicationConcern      AS medication_concern,
             treatmentTherapyNeed   AS treatment_therapy_need,
             urgentMedicalCondition AS urgent_medical_condition,
             confirmedLevel         AS risk_level
      FROM assessments WHERE confirmedLevel IS NOT NULL
    " | sed 's/\\t/,/g' > real_dataset.csv

MySQL booleans come back as 0/1 already, so no cast is needed.

HOW TO RUN
=============================================================================
    python retrain.py --data data/real_dataset.csv --validated

Omitting --validated keeps the "provisional" marker, which is the safe default.
Restart the FastAPI service afterwards so the new model is loaded.
=============================================================================
"""

from __future__ import annotations

import argparse
import csv
import subprocess
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).parent
FEATURES = [
    "unresolved_health_need",
    "pending_referral",
    "missed_checkup",
    "medication_concern",
    "treatment_therapy_need",
    "urgent_medical_condition",
]
CLASSES = {"Low Risk", "Moderate Risk", "High Risk"}
MIN_ROWS = 100
MIN_PER_CLASS = 15

# Columns that must never appear in a training export.
FORBIDDEN = {
    "id", "pwd_id", "pwdid", "name", "full_name", "fullname", "address",
    "contact", "contact_number", "pwd_id_number", "birthdate", "date_of_birth",
}


def validate(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise SystemExit(f"Dataset not found: {path}")

    with path.open(encoding="utf-8") as fh:
        rows = list(csv.DictReader(fh))
    if not rows:
        raise SystemExit("Dataset is empty.")

    headers = {h.strip().lower() for h in rows[0].keys()}

    leaked = headers & FORBIDDEN
    if leaked:
        raise SystemExit(
            f"Refusing to train: the export contains personal fields {sorted(leaked)}.\n"
            "Re-export with only the six indicator columns and risk_level."
        )

    missing = [c for c in [*FEATURES, "risk_level"] if c not in headers]
    if missing:
        raise SystemExit(f"Dataset is missing required columns: {missing}")

    labels = Counter(r["risk_level"].strip() for r in rows)
    unknown = set(labels) - CLASSES
    if unknown:
        raise SystemExit(f"Unrecognised risk_level values: {sorted(unknown)}")

    if len(rows) < MIN_ROWS:
        raise SystemExit(
            f"Only {len(rows)} rows. At least {MIN_ROWS} confirmed assessments are "
            "needed for a meaningful model. Keep using the provisional model for now."
        )

    thin = [c for c in CLASSES if labels.get(c, 0) < MIN_PER_CLASS]
    if thin:
        print(
            f"  WARNING: fewer than {MIN_PER_CLASS} examples for {sorted(thin)}. "
            "The model will be weak for those tiers."
        )

    print(f"Validated {len(rows)} rows.")
    for cls in ["Low Risk", "Moderate Risk", "High Risk"]:
        print(f"  {cls:<14} {labels.get(cls, 0)}")
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--data", type=Path, required=True,
                        help="CSV of confirmed assessments")
    parser.add_argument("--validated", action="store_true",
                        help="mark the model as trained on approved real records")
    parser.add_argument("--trees", type=int, default=300)
    parser.add_argument("--max-depth", type=int, default=10)
    args = parser.parse_args()

    validate(args.data)

    if not args.validated:
        print(
            "\n  NOTE: --validated not passed, so the model stays marked "
            "'provisional'.\n  Pass --validated only for approved barangay records.\n"
        )

    cmd = [
        sys.executable, str(HERE / "train.py"),
        "--data", str(args.data),
        "--trees", str(args.trees),
        "--max-depth", str(args.max_depth),
        "--dataset-label", "barangay-approved" if args.validated else "unlabelled",
    ]
    cmd.append("--validated" if args.validated else "--provisional")

    print("Retraining...\n")
    result = subprocess.run(cmd, check=False)
    if result.returncode != 0:
        raise SystemExit(result.returncode)

    print("\nRestart the FastAPI service to load the new model.")


if __name__ == "__main__":
    main()
