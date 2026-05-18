import { describe, expect, it } from "vitest";
import { comparePeriods } from "./period-comparison";

describe("comparePeriods", () => {
  it("computes absolute and percentage delta", () => {
    const d = comparePeriods(150, 100);
    expect(d.current).toBe(150);
    expect(d.previous).toBe(100);
    expect(d.deltaAbs).toBe(50);
    expect(d.deltaPct).toBeCloseTo(0.5, 5);
  });

  it("supports negative deltas", () => {
    const d = comparePeriods(80, 100);
    expect(d.deltaAbs).toBe(-20);
    expect(d.deltaPct).toBeCloseTo(-0.2, 5);
  });

  it("returns deltaPct=0 when both sides are zero", () => {
    const d = comparePeriods(0, 0);
    expect(d.deltaAbs).toBe(0);
    expect(d.deltaPct).toBe(0);
  });

  it("returns deltaPct=null when previous is 0 and current is nonzero", () => {
    const d = comparePeriods(42, 0);
    expect(d.deltaAbs).toBe(42);
    expect(d.deltaPct).toBeNull();
  });
});
