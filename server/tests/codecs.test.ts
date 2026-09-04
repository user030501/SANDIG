// Tests for the API-boundary enum translation and validation.
//
// codecs.ts is the edge where untrusted strings become database enums. Every
// `fromApi*` must reject anything it does not recognise, so a malformed value
// is refused with a 400 instead of reaching MySQL. These tests pin that.

import test from "node:test";
import assert from "node:assert/strict";

import {
  toApiRisk,
  toApiReferralStatus,
  toApiDisability,
  fromApiRisk,
  fromApiReferralStatus,
  fromApiDisability,
  fromApiFollowUp,
  BadEnumError,
  toIsoDate,
  toIsoDateTime,
} from "../src/codecs";

// ── Round-tripping ───────────────────────────────────────────────────────────

test("risk levels round-trip between the API strings and the Prisma enum", () => {
  for (const api of ["Low Risk", "Moderate Risk", "High Risk"] as const) {
    assert.equal(toApiRisk(fromApiRisk(api)), api);
  }
});

test("referral statuses round-trip, including the one with a space", () => {
  for (const api of [
    "Pending", "Received", "In Progress", "Completed", "Escalated", "Cancelled",
  ] as const) {
    assert.equal(toApiReferralStatus(fromApiReferralStatus(api)), api);
  }
});

test("disability types round-trip, including the two-word statutory categories", () => {
  for (const api of ["Physical", "Cancer", "Rare Disease", "Chronic Illness"] as const) {
    assert.equal(toApiDisability(fromApiDisability(api)), api);
  }
});

test("the spaced API strings map to space-free Prisma identifiers", () => {
  // Prisma enum identifiers cannot contain spaces — this is the whole reason
  // the codec layer exists.
  assert.equal(fromApiRisk("Low Risk"), "LowRisk");
  assert.equal(fromApiReferralStatus("In Progress"), "InProgress");
  assert.equal(fromApiDisability("Chronic Illness"), "ChronicIllness");
  assert.equal(fromApiDisability("Rare Disease"), "RareDisease");
});

// ── Rejection of bad input ───────────────────────────────────────────────────

test("an unknown risk level is rejected rather than passed through", () => {
  assert.throws(() => fromApiRisk("Elevated"), BadEnumError);
  assert.throws(() => fromApiRisk("LowRisk"), BadEnumError); // Prisma form, not API form
  assert.throws(() => fromApiRisk(""), BadEnumError);
});

test("an unknown referral status is rejected", () => {
  assert.throws(() => fromApiReferralStatus("Closed"), BadEnumError);
  assert.throws(() => fromApiReferralStatus("in progress"), BadEnumError); // case-sensitive
});

test("an unknown follow-up status is rejected", () => {
  assert.throws(() => fromApiFollowUp("Escalated"), BadEnumError); // referral vocabulary
  assert.throws(() => fromApiFollowUp("Pending"), BadEnumError);
});

test("the follow-up and referral vocabularies stay separate", () => {
  // Deliberately distinct sets — a value from one must not validate in the other.
  assert.throws(() => fromApiFollowUp("In Progress"), BadEnumError);
  assert.throws(() => fromApiReferralStatus("Overdue"), BadEnumError);
  // "Completed" is the one value legitimately in both.
  assert.equal(fromApiFollowUp("Completed"), "Completed");
  assert.equal(fromApiReferralStatus("Completed"), "Completed");
});

test("a rejection names the field and lists the accepted values", () => {
  try {
    fromApiRisk("Critical");
    assert.fail("should have thrown");
  } catch (err) {
    assert.ok(err instanceof BadEnumError);
    assert.equal(err.status, 400);
    assert.match(err.message, /Critical/);
    assert.match(err.message, /Low Risk/);
  }
});

test("injection-shaped input is rejected like any other unknown value", () => {
  assert.throws(() => fromApiRisk("'; DROP TABLE assessments;--"), BadEnumError);
  assert.throws(() => fromApiDisability("<script>alert(1)</script>"), BadEnumError);
});

// ── Date formatting ──────────────────────────────────────────────────────────

test("dates render as YYYY-MM-DD and null renders as an empty string", () => {
  assert.equal(toIsoDate(new Date("2026-03-14T09:30:00Z")), "2026-03-14");
  assert.equal(toIsoDate(null), "");
  assert.equal(toIsoDate(undefined), "");
});

test("timestamps render as YYYY-MM-DD HH:mm", () => {
  assert.equal(toIsoDateTime(new Date("2026-03-14T09:30:00Z")), "2026-03-14 09:30");
  assert.equal(toIsoDateTime(null), "");
});
