import { describe, expect, it } from "vitest";
import type { ClientStats } from "@/types/client";
import { applyPurchaseToStats, applyVisitToStats } from "./update-client-stats";

const ZERO: ClientStats = { ltv: 0, visits: 0, avgTicket: 0, lastPurchase: null };

describe("applyPurchaseToStats", () => {
  it("increments visits, sums LTV and recomputes avgTicket", () => {
    const at = new Date(Date.UTC(2026, 4, 12));
    const next = applyPurchaseToStats(ZERO, 12_500, at);
    expect(next.visits).toBe(1);
    expect(next.ltv).toBe(12_500);
    expect(next.avgTicket).toBe(12_500);
    expect(next.lastPurchase).toBe(at.toISOString());
  });

  it("rounds avgTicket across multiple purchases", () => {
    const after1 = applyPurchaseToStats(ZERO, 10_000);
    const after2 = applyPurchaseToStats(after1, 5_001);
    expect(after2.visits).toBe(2);
    expect(after2.ltv).toBe(15_001);
    expect(after2.avgTicket).toBe(7_501);
  });

  it("is pure (does not mutate input)", () => {
    const input: ClientStats = { ...ZERO, visits: 3, ltv: 9_000 };
    applyPurchaseToStats(input, 1_000);
    expect(input).toEqual({ ltv: 9_000, visits: 3, avgTicket: 0, lastPurchase: null });
  });
});

describe("applyVisitToStats", () => {
  it("only increments visits", () => {
    const next = applyVisitToStats({ ltv: 50, visits: 2, avgTicket: 25, lastPurchase: "2026-01-01" });
    expect(next).toEqual({ ltv: 50, visits: 3, avgTicket: 25, lastPurchase: "2026-01-01" });
  });
});
