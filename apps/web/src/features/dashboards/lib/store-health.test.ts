import { describe, expect, it } from "vitest";
import { computeStoreHealth } from "./store-health";

describe("computeStoreHealth", () => {
  it("grades a strong store as verde (≥80)", () => {
    const h = computeStoreHealth({
      salesAmount: 1_900_000,
      monthlyTarget: 2_000_000,
      activeBasCount: 4,
      totalBasCount: 4,
      criticalAlertsCount: 0,
      recentInteractionsCount: 140,
      expectedInteractionsCount: 140,
    });
    expect(h.grade).toBe("verde");
    expect(h.score).toBeGreaterThanOrEqual(80);
  });

  it("grades a struggling store as rojo (<60)", () => {
    const h = computeStoreHealth({
      salesAmount: 500_000,
      monthlyTarget: 2_000_000,
      activeBasCount: 1,
      totalBasCount: 4,
      criticalAlertsCount: 5,
      recentInteractionsCount: 10,
      expectedInteractionsCount: 140,
    });
    expect(h.grade).toBe("rojo");
    expect(h.score).toBeLessThan(60);
  });

  it("respects the 80/60 grade boundaries", () => {
    const ambar = computeStoreHealth({
      salesAmount: 1_400_000,
      monthlyTarget: 2_000_000,
      activeBasCount: 3,
      totalBasCount: 4,
      criticalAlertsCount: 1,
      recentInteractionsCount: 70,
      expectedInteractionsCount: 140,
    });
    expect(ambar.grade).toBe("ambar");
    expect(ambar.score).toBeGreaterThanOrEqual(60);
    expect(ambar.score).toBeLessThan(80);
  });

  it("returns the breakdown clamped to 0-100", () => {
    const h = computeStoreHealth({
      salesAmount: 5_000_000, // would be 250% of target
      monthlyTarget: 2_000_000,
      activeBasCount: 4,
      totalBasCount: 4,
      criticalAlertsCount: 0,
      recentInteractionsCount: 1_000,
      expectedInteractionsCount: 140,
    });
    expect(h.breakdown.targetCompletion).toBe(100);
    expect(h.breakdown.interactionRate).toBe(100);
    expect(h.breakdown.alertsScore).toBe(100);
  });

  it("handles a 0 target gracefully without divide-by-zero", () => {
    const h = computeStoreHealth({
      salesAmount: 500_000,
      monthlyTarget: 0,
      activeBasCount: 2,
      totalBasCount: 4,
      criticalAlertsCount: 0,
      recentInteractionsCount: 50,
      expectedInteractionsCount: 100,
    });
    expect(Number.isFinite(h.score)).toBe(true);
    expect(h.breakdown.targetCompletion).toBe(0);
  });

  it("penalizes 10 points per critical alert (floored at 0)", () => {
    const lo = computeStoreHealth({
      salesAmount: 100,
      monthlyTarget: 100,
      activeBasCount: 1,
      totalBasCount: 1,
      criticalAlertsCount: 20, // would drop alertsScore to -100
      recentInteractionsCount: 0,
      expectedInteractionsCount: 1,
    });
    expect(lo.breakdown.alertsScore).toBe(0);
  });
});
