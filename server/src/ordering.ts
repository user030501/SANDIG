import type { RiskLevel } from "@prisma/client";

/**
 * FR-18 default ordering: High Risk first, then Moderate, then Low. Callers
 * break ties on the nearest follow-up date within each group.
 */
export const RISK_SORT_ORDER: Record<RiskLevel, number> = {
  HighRisk: 0,
  ModerateRisk: 1,
  LowRisk: 2,
};
