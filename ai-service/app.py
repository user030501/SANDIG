"""
SANDIG AI Processing Layer — Random Forest risk classifier.

Exposes a minimal internal REST API consumed ONLY by the Express backend. It is
never reachable from the browser, which preserves the layer boundary described
in manuscript Section 4.4.6.

Input is the six coded indicator flags and nothing else. No identifiers, names,
or other personal information are accepted or logged (Section 1.2).

Output is advisory. It never replaces the rule-based score or the
Administrator's confirmation.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

HERE = Path(__file__).parent
MODEL_PATH = HERE / "model.joblib"

FEATURES = [
    "unresolved_health_need",
    "pending_referral",
    "missed_checkup",
    "medication_concern",
    "treatment_therapy_need",
    "urgent_medical_condition",
]
CLASSES = ["Low Risk", "Moderate Risk", "High Risk"]

app = FastAPI(
    title="SANDIG Risk Prediction Service",
    description="Internal Random Forest classifier. Advisory output only.",
    version="1.0.0",
)

_bundle: dict[str, Any] | None = None


def load_model() -> dict[str, Any]:
    global _bundle
    if _bundle is None:
        if not MODEL_PATH.exists():
            raise HTTPException(
                status_code=503,
                detail="Model not trained. Run generate_seed_data.py then train.py.",
            )
        _bundle = joblib.load(MODEL_PATH)
    return _bundle


class PredictRequest(BaseModel):
    features: list[int] = Field(
        ...,
        description="Six coded indicator flags (0 or 1), in the documented order.",
    )

    @field_validator("features")
    @classmethod
    def check_shape(cls, v: list[int]) -> list[int]:
        if len(v) != len(FEATURES):
            raise ValueError(f"Expected {len(FEATURES)} features, received {len(v)}.")
        if any(x not in (0, 1) for x in v):
            raise ValueError("Each feature must be 0 or 1.")
        return v


class PredictResponse(BaseModel):
    predicted_class: str
    class_probabilities: dict[str, float]
    model_version: str
    provisional: bool
    advisory_note: str


@app.get("/health")
def health() -> dict[str, Any]:
    if not MODEL_PATH.exists():
        return {"status": "degraded", "model_loaded": False}
    meta = load_model()["metadata"]
    return {
        "status": "ok",
        "model_loaded": True,
        "model_version": meta["model_version"],
        "provisional": meta.get("provisional", True),
    }


@app.get("/model-info")
def model_info() -> dict[str, Any]:
    """Full training metadata — used for the FR-25 traceability record."""
    return load_model()["metadata"]


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    bundle = load_model()
    model = bundle["model"]
    meta = bundle["metadata"]

    proba = model.predict_proba([req.features])[0]
    # Map through model.classes_ rather than assuming ordering.
    probabilities = {cls: 0.0 for cls in CLASSES}
    for cls, p in zip(model.classes_, proba):
        probabilities[str(cls)] = round(float(p), 4)

    predicted = max(probabilities, key=lambda k: probabilities[k])
    provisional = bool(meta.get("provisional", True))

    return PredictResponse(
        predicted_class=predicted,
        class_probabilities=probabilities,
        model_version=meta["model_version"],
        provisional=provisional,
        advisory_note=(
            "Advisory only. Does not replace the rule-based score or the "
            "Administrator's confirmation."
            + (
                " PROVISIONAL: trained on synthetic data pending a validated "
                "barangay dataset."
                if provisional
                else ""
            )
        ),
    )
