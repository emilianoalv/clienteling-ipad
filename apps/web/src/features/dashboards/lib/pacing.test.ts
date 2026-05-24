import { describe, expect, it } from "vitest";
import { computeForecastWithSimulation, computePacing } from "./pacing";

const APRIL_2026 = {
  from: new Date(2026, 3, 1),
  to: new Date(2026, 4, 1),
};

describe("computePacing", () => {
  it("flags noTarget when target is 0 so the UI hides the pacing line", () => {
    const out = computePacing({
      salesAmount: 100_000,
      monthlyTarget: 0,
      period: APRIL_2026,
      now: new Date(2026, 3, 15),
    });
    expect(out.noTarget).toBe(true);
    expect(out.text).toBe("");
  });

  it('returns "adelantado" when projection ≥ target', () => {
    // Halfway through April with $300K → projection ≈ $600K, target $500K → ahead.
    const out = computePacing({
      salesAmount: 300_000,
      monthlyTarget: 500_000,
      period: APRIL_2026,
      now: new Date(2026, 3, 15),
    });
    expect(out.noTarget).toBe(false);
    expect(out.ratio).toBeGreaterThan(1);
    expect(out.text).toMatch(/adelantado/);
    expect(out.text).toMatch(/sobre meta/);
  });

  it('returns "por debajo" with required daily pace when projection < target', () => {
    // Halfway through April with $100K → projection ≈ $200K, target $500K → behind.
    const out = computePacing({
      salesAmount: 100_000,
      monthlyTarget: 500_000,
      period: APRIL_2026,
      now: new Date(2026, 3, 15),
    });
    expect(out.noTarget).toBe(false);
    expect(out.ratio).toBeLessThan(1);
    expect(out.text).toMatch(/por debajo/);
    expect(out.text).toMatch(/\/día/);
  });

  it("hits the on-pace branch when sales matches a linear ramp", () => {
    // Day 15 / 30 with $250K → projection = $500K = target exactly → ahead branch.
    const out = computePacing({
      salesAmount: 250_000,
      monthlyTarget: 500_000,
      period: APRIL_2026,
      now: new Date(2026, 3, 15),
    });
    expect(out.ratio).toBeCloseTo(1, 1);
    expect(out.text).toMatch(/adelantado|sobre meta/);
  });
});

describe("computeForecastWithSimulation", () => {
  const NOW = new Date(2026, 3, 15);

  it("returns the same base text when no simulation is provided", () => {
    const base = computePacing({
      salesAmount: 100_000,
      monthlyTarget: 500_000,
      period: APRIL_2026,
      now: NOW,
    });
    const out = computeForecastWithSimulation({
      salesAmount: 100_000,
      monthlyTarget: 500_000,
      period: APRIL_2026,
      now: NOW,
    });
    expect(out.text).toBe(base.text);
    expect(out.simulatedProjection).toBeUndefined();
  });

  it("adds a simulation line when worstPerformer.deficit > 0", () => {
    const out = computeForecastWithSimulation({
      salesAmount: 100_000,
      monthlyTarget: 500_000,
      period: APRIL_2026,
      now: NOW,
      worstPerformer: { name: "Diego", deficit: 150_000 },
    });
    expect(out.text).toMatch(/Diego recupera/);
    expect(out.simulatedProjection).toBeGreaterThan(out.projection);
  });

  it("falls back to noTarget when monthlyTarget is 0", () => {
    const out = computeForecastWithSimulation({
      salesAmount: 0,
      monthlyTarget: 0,
      period: APRIL_2026,
      now: NOW,
    });
    expect(out.noTarget).toBe(true);
    expect(out.text).toBe("");
  });
});
