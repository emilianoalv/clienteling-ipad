/**
 * Store Health Score — weighted composite of 4 signals (spec §3.3).
 *
 *   score = 0.40 * targetCompletion
 *         + 0.20 * baAdoption
 *         + 0.20 * alertsScore  // 100 minus a penalty per critical alert
 *         + 0.20 * interactionRate  // proxy for iPad usage
 *
 *   grade = score ≥ 80 → "verde"
 *         | score ≥ 60 → "ambar"
 *         | otherwise  → "rojo"
 *
 * `interactionRate` is intentionally a proxy — we don't have device-session
 * telemetry in the prototype, so we measure recent interactions vs an
 * expected baseline (5 interactions/BA/day over a 7-day window).
 */

export type StoreHealthGrade = "verde" | "ambar" | "rojo";

export interface StoreHealthBreakdown {
  /** 0-100 — % of monthly target achieved. */
  targetCompletion: number;
  /** 0-100 — % of BAs with sales in the period. */
  baAdoption: number;
  /** 0-100 — 100 minus 10 per critical alert, floored at 0. */
  alertsScore: number;
  /** 0-100 — proxy for app/iPad usage based on recent interactions. */
  interactionRate: number;
}

export interface StoreHealth {
  score: number;
  grade: StoreHealthGrade;
  breakdown: StoreHealthBreakdown;
}

export interface StoreHealthInput {
  salesAmount: number;
  monthlyTarget: number;
  activeBasCount: number;
  totalBasCount: number;
  criticalAlertsCount: number;
  recentInteractionsCount: number;
  expectedInteractionsCount: number;
}

export function computeStoreHealth(input: StoreHealthInput): StoreHealth {
  const targetCompletion =
    input.monthlyTarget > 0
      ? clamp((input.salesAmount / input.monthlyTarget) * 100)
      : 0;
  const baAdoption =
    input.totalBasCount > 0
      ? clamp((input.activeBasCount / input.totalBasCount) * 100)
      : 0;
  const alertsScore = Math.max(0, 100 - input.criticalAlertsCount * 10);
  const interactionRate =
    input.expectedInteractionsCount > 0
      ? clamp(
          (input.recentInteractionsCount / input.expectedInteractionsCount) *
            100,
        )
      : 0;

  const score = Math.round(
    0.4 * targetCompletion +
      0.2 * baAdoption +
      0.2 * alertsScore +
      0.2 * interactionRate,
  );
  const grade: StoreHealthGrade =
    score >= 80 ? "verde" : score >= 60 ? "ambar" : "rojo";

  return {
    score,
    grade,
    breakdown: {
      targetCompletion: Math.round(targetCompletion),
      baAdoption: Math.round(baAdoption),
      alertsScore,
      interactionRate: Math.round(interactionRate),
    },
  };
}

function clamp(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}
