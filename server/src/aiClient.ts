// Internal client for the Python Random Forest service.
//
// This is the ONLY path to the model. The FastAPI service is never exposed to
// the browser — it sits behind Express, preserving the AI Processing Layer
// boundary described in manuscript Section 4.4.6.
//
// Only the six coded indicator flags are sent. No identifiers, names, or other
// personal information leave this process (Section 1.2).

import type { RiskLevel } from "@prisma/client";
import { env } from "./env";
import { toFeatureVector, type Indicators } from "./riskEngine";

export interface AiResult {
  level: RiskLevel;
  probabilities: Record<RiskLevel, number>;
  modelVersion: string;
}

const CLASS_TO_PRISMA: Record<string, RiskLevel> = {
  "Low Risk": "LowRisk",
  "Moderate Risk": "ModerateRisk",
  "High Risk": "HighRisk",
};

interface AiResponse {
  predicted_class: string;
  class_probabilities: Record<string, number>;
  model_version: string;
}

const TIMEOUT_MS = 4000;

/**
 * Returns the model's advisory prediction, or throws if the service is
 * unreachable. Callers treat a failure as non-fatal: the rule-based score is
 * authoritative and stands on its own.
 */
export async function predictRisk(indicators: Partial<Indicators>): Promise<AiResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${env.aiServiceUrl}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features: toFeatureVector(indicators) }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`AI service returned ${res.status}`);
    }

    const data = (await res.json()) as AiResponse;
    const level = CLASS_TO_PRISMA[data.predicted_class];
    if (!level) {
      throw new Error(`AI service returned unknown class "${data.predicted_class}"`);
    }

    return {
      level,
      probabilities: {
        LowRisk: data.class_probabilities["Low Risk"] ?? 0,
        ModerateRisk: data.class_probabilities["Moderate Risk"] ?? 0,
        HighRisk: data.class_probabilities["High Risk"] ?? 0,
      },
      modelVersion: data.model_version,
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Liveness probe surfaced on /api/health. */
export async function aiServiceHealthy(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch(`${env.aiServiceUrl}/health`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
