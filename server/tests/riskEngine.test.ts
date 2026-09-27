// Tests for the authoritative rule-based scoring engine (FR-07).
//
// riskEngine.ts is a pure function with no database or network dependency, so
// these run standalone: `npm test` in the server folder. They pin the formula
// and the tier boundaries defined in manuscript Section 1.2, so a change to
// either fails here rather than silently altering every stored score.

import test from "node:test";
import assert from "node:assert/strict";

import {
  computeRuleBasedScore,
  tierFromScore,
  toFeatureVector,
  higherTier,
  isDisagreement,
  INDICATOR_KEYS,
  INDICATOR_WEIGHTS,
  MAX_RISK_SCORE,
  RULE_VERSION,
  type Indicators,
} from "../src/riskEngine";

/** All six indicators false. */
const none = (): Indicators =>
  Object.fromEntries(INDICATOR_KEYS.map((k) => [k, false])) as Indicators;

/** All six false except the named ones. */
const only = (...keys: (keyof Indicators)[]): Indicators => {
  const i = none();
  for (const k of keys) i[k] = true;
  return i;
};

// ── The formula ──────────────────────────────────────────────────────────────

test("the five ordinary indicators are weighted 2 and urgent is weighted 4", () => {
  assert.equal(INDICATOR_WEIGHTS.unresolvedHealthNeed, 2);
  assert.equal(INDICATOR_WEIGHTS.pendingReferral, 2);
  assert.equal(INDICATOR_WEIGHTS.missedCheckup, 2);
  assert.equal(INDICATOR_WEIGHTS.medicationConcern, 2);
  assert.equal(INDICATOR_WEIGHTS.treatmentTherapyNeed, 2);
  assert.equal(INDICATOR_WEIGHTS.urgentMedicalCondition, 4);
});

test("the maximum attainable score is 14", () => {
  assert.equal(MAX_RISK_SCORE, 14);
  assert.equal(computeRuleBasedScore(only(...INDICATOR_KEYS)).score, 14);
});

test("no indicators scores 0 and lands in Low Risk", () => {
  const r = computeRuleBasedScore(none());
  assert.equal(r.score, 0);
  assert.equal(r.level, "LowRisk");
  assert.equal(r.triggersImmediateReview, false);
  assert.deepEqual(r.present, []);
});

test("every one of the 64 indicator combinations scores as the sum of its weights", () => {
  for (let mask = 0; mask < 64; mask++) {
    const indicators = none();
    let expected = 0;
    INDICATOR_KEYS.forEach((key, i) => {
      if ((mask >> i) & 1) {
        indicators[key] = true;
        expected += INDICATOR_WEIGHTS[key];
      }
    });
    const r = computeRuleBasedScore(indicators);
    assert.equal(r.score, expected, `combination ${mask} scored ${r.score}, expected ${expected}`);
    assert.equal(r.level, tierFromScore(expected));
  }
});

test("`present` lists exactly the indicators that were set", () => {
  const r = computeRuleBasedScore(only("missedCheckup", "medicationConcern"));
  assert.deepEqual([...r.present].sort(), ["medicationConcern", "missedCheckup"]);
  assert.equal(r.score, 4);
});

test("indicators omitted from the object are treated as false, not as errors", () => {
  // The API layer defaults these, but the engine must not depend on that.
  const r = computeRuleBasedScore({ urgentMedicalCondition: true });
  assert.equal(r.score, 4);
  assert.equal(r.triggersImmediateReview, true);
});

test("the rule version is recorded on every result for traceability (FR-25)", () => {
  assert.equal(computeRuleBasedScore(none()).ruleVersion, RULE_VERSION);
});

// ── Tier boundaries: Low 0-4, Moderate 5-8, High 9+ ──────────────────────────

test("tier boundaries match the manuscript exactly", () => {
  const cases: [number, string][] = [
    [0, "LowRisk"],
    [4, "LowRisk"],
    [5, "ModerateRisk"],
    [8, "ModerateRisk"],
    [9, "HighRisk"],
    [14, "HighRisk"],
  ];
  for (const [score, level] of cases) {
    assert.equal(tierFromScore(score), level, `score ${score} should be ${level}`);
  }
});

test("4 is the last Low score and 5 is the first Moderate score", () => {
  assert.equal(tierFromScore(4), "LowRisk");
  assert.equal(tierFromScore(5), "ModerateRisk");
});

test("8 is the last Moderate score and 9 is the first High score", () => {
  assert.equal(tierFromScore(8), "ModerateRisk");
  assert.equal(tierFromScore(9), "HighRisk");
});

test("two ordinary indicators score 4 and stay Low Risk", () => {
  const r = computeRuleBasedScore(only("missedCheckup", "pendingReferral"));
  assert.equal(r.score, 4);
  assert.equal(r.level, "LowRisk");
});

test("three ordinary indicators score 6 and reach Moderate Risk", () => {
  const r = computeRuleBasedScore(only("missedCheckup", "pendingReferral", "medicationConcern"));
  assert.equal(r.score, 6);
  assert.equal(r.level, "ModerateRisk");
});

test("all five ordinary indicators score 10 and reach High Risk without the urgent flag", () => {
  const r = computeRuleBasedScore(
    only(
      "unresolvedHealthNeed",
      "pendingReferral",
      "missedCheckup",
      "medicationConcern",
      "treatmentTherapyNeed"
    )
  );
  assert.equal(r.score, 10);
  assert.equal(r.level, "HighRisk");
  assert.equal(r.triggersImmediateReview, false);
});

// ── The urgent-condition rule ────────────────────────────────────────────────

test("an urgent-only assessment scores 4, stays Low Risk, and STILL forces review", () => {
  // The documented edge case: the urgent flag is worth 4, which is inside the
  // Low band, so the tier alone would hide it. triggersImmediateReview is what
  // keeps the case visible and blocks closure.
  const r = computeRuleBasedScore(only("urgentMedicalCondition"));
  assert.equal(r.score, 4);
  assert.equal(r.level, "LowRisk");
  assert.equal(r.triggersImmediateReview, true);
});

test("the urgent flag is the only thing that sets triggersImmediateReview", () => {
  for (const key of INDICATOR_KEYS) {
    const r = computeRuleBasedScore(only(key));
    assert.equal(
      r.triggersImmediateReview,
      key === "urgentMedicalCondition",
      `${key} set triggersImmediateReview incorrectly`
    );
  }
});

test("a full-score assessment is High Risk and forces review", () => {
  const r = computeRuleBasedScore(only(...INDICATOR_KEYS));
  assert.equal(r.score, 14);
  assert.equal(r.level, "HighRisk");
  assert.equal(r.triggersImmediateReview, true);
});

// ── The AI feature vector ────────────────────────────────────────────────────

test("the feature vector is six values in the documented order", () => {
  const v = toFeatureVector(only("unresolvedHealthNeed", "urgentMedicalCondition"));
  assert.equal(v.length, 6);
  assert.deepEqual(v, [1, 0, 0, 0, 0, 1]);
});

test("the feature vector is strictly 0 or 1, never booleans", () => {
  for (const value of toFeatureVector(only(...INDICATOR_KEYS))) {
    assert.ok(value === 0 || value === 1, `got ${JSON.stringify(value)}`);
  }
  assert.deepEqual(toFeatureVector(none()), [0, 0, 0, 0, 0, 0]);
});

test("the feature vector carries no personal information — it is six numbers", () => {
  // Section 1.2: only the coded flags may reach the AI service.
  const v = toFeatureVector(only("missedCheckup"));
  assert.equal(v.length, INDICATOR_KEYS.length);
  assert.ok(v.every((x) => typeof x === "number"));
});

// ── Tier comparison helpers ──────────────────────────────────────────────────

test("higherTier returns the more severe of two tiers", () => {
  assert.equal(higherTier("LowRisk", "HighRisk"), "HighRisk");
  assert.equal(higherTier("HighRisk", "LowRisk"), "HighRisk");
  assert.equal(higherTier("ModerateRisk", "HighRisk"), "HighRisk");
  assert.equal(higherTier("LowRisk", "ModerateRisk"), "ModerateRisk");
  assert.equal(higherTier("ModerateRisk", "ModerateRisk"), "ModerateRisk");
});

test("isDisagreement is true only when the two tiers differ", () => {
  assert.equal(isDisagreement("LowRisk", "HighRisk"), true);
  assert.equal(isDisagreement("ModerateRisk", "ModerateRisk"), false);
  assert.equal(isDisagreement("HighRisk", "HighRisk"), false);
});
