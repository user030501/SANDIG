"""
Generates the PROVISIONAL synthetic training dataset for the SANDIG Random
Forest classifier.

IMPORTANT — this is NOT real barangay data.
=============================================================================
No validated dataset exists yet: the data request letter to the Barangay
Captain of New Pandan is still pending approval. Every row produced here is
synthetic, generated from plausible combinations of the six coded indicators
so that the end-to-end prediction pipeline is functional and demonstrable now.

Any model trained on this file is labelled "provisional / pending validated
dataset" and must be retrained on approved records before its output is
treated as meaningful. See retrain.py and README.md.
=============================================================================

The feature set is deliberately limited to the six coded indicators. No
identifiers, names, addresses, or other personal information are included,
per manuscript Section 1.2.
"""

from __future__ import annotations

import argparse
import csv
import random
from pathlib import Path

FEATURES = [
    "unresolved_health_need",
    "pending_referral",
    "missed_checkup",
    "medication_concern",
    "treatment_therapy_need",
    "urgent_medical_condition",
]

# Mirrors server/src/riskEngine.ts and src/app/data/riskModel.ts.
WEIGHTS = {
    "unresolved_health_need": 2,
    "pending_referral": 2,
    "missed_checkup": 2,
    "medication_concern": 2,
    "treatment_therapy_need": 2,
    "urgent_medical_condition": 4,
}
MAX_SCORE = sum(WEIGHTS.values())  # 14


def rule_score(row: dict[str, int]) -> int:
    return sum(WEIGHTS[f] for f in FEATURES if row[f] == 1)


def rule_tier(score: int) -> str:
    if score >= 9:
        return "High Risk"
    if score >= 5:
        return "Moderate Risk"
    return "Low Risk"


def generate(n: int, noise: float, seed: int) -> list[dict]:
    """
    Builds a labelled dataset.

    Labels are anchored to the rule-based tier so the model learns the
    documented clinical logic rather than an arbitrary mapping. A small amount
    of label noise is injected to reflect the reality that a coordinator's
    confirmed judgement does not always match the raw score — without it the
    Random Forest would simply memorise a deterministic function and report a
    meaningless 100% accuracy.
    """
    rng = random.Random(seed)
    tiers = ["Low Risk", "Moderate Risk", "High Risk"]

    # Enumerate all 64 indicator combinations so every reachable state appears
    # at least once.
    all_combos = [
        {f: (mask >> i) & 1 for i, f in enumerate(FEATURES)} for mask in range(64)
    ]
    rows: list[dict] = list(all_combos)

    # Then sample the remainder stratified by tier. Naive prevalence sampling
    # produces very few High Risk rows (they need several indicators at once),
    # which leaves the model weak on the class that matters most. Drawing an
    # even number per tier keeps recall usable across all three.
    by_tier: dict[str, list[dict]] = {t: [] for t in tiers}
    for combo in all_combos:
        by_tier[rule_tier(rule_score(combo))].append(combo)

    remaining = max(0, n - len(rows))
    per_tier = remaining // len(tiers)
    for tier in tiers:
        pool = by_tier[tier]
        if not pool:
            continue
        for _ in range(per_tier):
            rows.append(dict(rng.choice(pool)))
    while len(rows) < n:
        rows.append(dict(rng.choice(all_combos)))

    out = []
    for row in rows:
        score = rule_score(row)
        label = rule_tier(score)

        # Nudge a small fraction of borderline cases to an adjacent tier.
        if rng.random() < noise:
            idx = tiers.index(label)
            shift = rng.choice([-1, 1])
            label = tiers[max(0, min(2, idx + shift))]

        out.append({**row, "rule_score": score, "risk_level": label})

    rng.shuffle(out)
    return out


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rows", type=int, default=1200)
    parser.add_argument("--noise", type=float, default=0.08,
                        help="fraction of labels nudged to an adjacent tier")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--out", type=Path,
                        default=Path(__file__).parent / "data" / "seed_dataset.csv")
    args = parser.parse_args()

    rows = generate(args.rows, args.noise, args.seed)
    args.out.parent.mkdir(parents=True, exist_ok=True)

    with args.out.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=[*FEATURES, "rule_score", "risk_level"])
        writer.writeheader()
        writer.writerows(rows)

    counts: dict[str, int] = {}
    for r in rows:
        counts[r["risk_level"]] = counts.get(r["risk_level"], 0) + 1

    print(f"SYNTHETIC seed dataset written to {args.out}")
    print(f"  rows: {len(rows)}   label noise: {args.noise:.0%}")
    for tier in ["Low Risk", "Moderate Risk", "High Risk"]:
        print(f"  {tier:<14} {counts.get(tier, 0)}")
    print("\n  NOTE: synthetic data only — not real barangay records.")


if __name__ == "__main__":
    main()
