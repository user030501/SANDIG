"""
Trains the SANDIG Random Forest risk classifier.

The model produced by this script from the synthetic seed dataset is
PROVISIONAL. It exists so the prediction pipeline is complete and demonstrable
before real barangay records are available. Its version string carries the
"provisional" marker, which the API returns and the UI displays, so a
seed-trained model can never be mistaken for one validated on real data.

Run `retrain.py` once approved records arrive.
"""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import cross_val_score, train_test_split

FEATURES = [
    "unresolved_health_need",
    "pending_referral",
    "missed_checkup",
    "medication_concern",
    "treatment_therapy_need",
    "urgent_medical_condition",
]
CLASSES = ["Low Risk", "Moderate Risk", "High Risk"]

HERE = Path(__file__).parent
DEFAULT_DATA = HERE / "data" / "seed_dataset.csv"
MODEL_PATH = HERE / "model.joblib"
METADATA_PATH = HERE / "model_metadata.json"


def load(path: Path) -> tuple[list[list[int]], list[str]]:
    if not path.exists():
        raise SystemExit(
            f"Dataset not found: {path}\n"
            "Run `python generate_seed_data.py` first, or pass --data."
        )
    X: list[list[int]] = []
    y: list[str] = []
    with path.open(encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            X.append([int(row[f]) for f in FEATURES])
            y.append(row["risk_level"])
    return X, y


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--trees", type=int, default=200)
    parser.add_argument("--max-depth", type=int, default=8)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument(
        "--provisional",
        dest="provisional",
        action="store_true",
        default=True,
        help="mark the model as trained on unvalidated data (default)",
    )
    parser.add_argument(
        "--validated",
        dest="provisional",
        action="store_false",
        help="ONLY pass this when training on approved barangay records",
    )
    parser.add_argument("--dataset-label", default="synthetic-seed")
    args = parser.parse_args()

    X, y = load(args.data)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=args.seed, stratify=y
    )

    clf = RandomForestClassifier(
        n_estimators=args.trees,
        max_depth=args.max_depth,
        random_state=args.seed,
        class_weight="balanced",
    )
    clf.fit(X_train, y_train)

    accuracy = clf.score(X_test, y_test)
    cv = cross_val_score(clf, X, y, cv=5)

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    suffix = "provisional" if args.provisional else "validated"
    version = f"rf-{stamp}-{suffix}"

    metadata = {
        "model_version": version,
        "provisional": args.provisional,
        "dataset": args.dataset_label,
        "data_source": (
            "SYNTHETIC — generated indicator combinations. Not real barangay "
            "records. Pending approval of the data request to the Barangay "
            "Captain of New Pandan."
            if args.provisional
            else "Approved barangay records."
        ),
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "n_samples": len(X),
        "features": FEATURES,
        "classes": CLASSES,
        "hyperparameters": {"n_estimators": args.trees, "max_depth": args.max_depth},
        "holdout_accuracy": round(float(accuracy), 4),
        "cv_accuracy_mean": round(float(cv.mean()), 4),
        "cv_accuracy_std": round(float(cv.std()), 4),
        "feature_importances": {
            f: round(float(i), 4) for f, i in zip(FEATURES, clf.feature_importances_)
        },
    }

    joblib.dump({"model": clf, "metadata": metadata}, MODEL_PATH)
    METADATA_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    print(f"Model written to {MODEL_PATH}")
    print(f"  version         : {version}")
    print(f"  holdout accuracy: {accuracy:.3f}")
    print(f"  5-fold CV       : {cv.mean():.3f} (+/- {cv.std():.3f})")
    print("\nFeature importances:")
    for f, i in sorted(metadata["feature_importances"].items(), key=lambda kv: -kv[1]):
        print(f"  {f:<26} {i:.4f}")
    print("\nHoldout classification report:")
    print(classification_report(y_test, clf.predict(X_test), zero_division=0))
    print("Confusion matrix (rows = actual, order: Low, Moderate, High):")
    print(confusion_matrix(y_test, clf.predict(X_test), labels=CLASSES))

    if args.provisional:
        print(
            "\n  WARNING: PROVISIONAL MODEL — trained on synthetic data.\n"
            "  Advisory output only. Retrain on approved barangay records\n"
            "  before relying on these predictions."
        )


if __name__ == "__main__":
    main()
