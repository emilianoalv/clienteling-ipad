import { describe, expect, it } from "vitest";
import type { Client } from "@/types/client";
import type { StoreId } from "@/types/store";
import { calculateLevelProgress } from "./level-progress";

function makeClient(overrides: {
  ltv?: number;
  visits?: number;
  lastPurchase?: string | null;
}): Client {
  return {
    id: "cl-x" as Client["id"],
    name: "X",
    phone: "5550000000",
    email: "x@x.test",
    birthday: "1990-01-01",
    city: "CDMX",
    age: 30,
    preferredLang: "es-MX",
    since: "2024-01-01",
    tier: "Atelier",
    brands: ["Lancôme"],
    storeId: "st-pol" as StoreId,
    skin: { type: "Normal", concerns: [], tone: "medio" },
    allergies: [],
    loyalty: { name: "Luxe Circle", tier: "Atelier", points: 0, toNext: 0 },
    stats: {
      ltv: overrides.ltv ?? 0,
      visits: overrides.visits ?? 0,
      avgTicket: overrides.ltv ?? 0,
      lastPurchase: overrides.lastPurchase ?? null,
    },
    affinities: [],
    interests: [],
    routine: "Básica",
  };
}

describe("calculateLevelProgress (segment-based)", () => {
  it("classifies a brand-new client as New with 0% progress and visit hint", () => {
    const r = calculateLevelProgress(makeClient({ ltv: 0, visits: 0 }));
    expect(r.current).toBe("New");
    expect(r.next).toBe("Recurrent");
    expect(r.progress).toBe(0);
    expect(r.hint).toMatch(/visitas? para Recurrente/);
  });

  it("New → Recurrent progress tracks the closer of visits or LTV", () => {
    const r = calculateLevelProgress(makeClient({ ltv: 25_000, visits: 1 }));
    expect(r.current).toBe("New");
    // 25k / 50k = 0.5 is larger than 1/5 = 0.2 — picks the LTV path
    expect(r.progress).toBeCloseTo(0.5, 5);
  });

  it("Recurrent client needs both LTV and visits for VIP", () => {
    const r = calculateLevelProgress(makeClient({ ltv: 80_000, visits: 5 }));
    expect(r.current).toBe("Recurrent");
    expect(r.next).toBe("VIP");
    expect(r.hint).toMatch(/y \d+ visitas? para VIP/);
  });

  it("Recurrent reports remaining LTV when only LTV is missing", () => {
    const r = calculateLevelProgress(makeClient({ ltv: 80_000, visits: 7 }));
    expect(r.current).toBe("Recurrent");
    expect(r.hint).toMatch(/más en compras para VIP/);
  });

  it("VIP returns no next segment and full progress", () => {
    const r = calculateLevelProgress(makeClient({ ltv: 200_000, visits: 10 }));
    expect(r.current).toBe("VIP");
    expect(r.next).toBeNull();
    expect(r.progress).toBe(1);
  });

  it("AtRisk hints at reactivation back to Recurrent", () => {
    const longAgo = new Date(Date.now() - 200 * 86_400_000).toISOString().slice(0, 10);
    const r = calculateLevelProgress(makeClient({ ltv: 60_000, visits: 5, lastPurchase: longAgo }));
    expect(r.current).toBe("AtRisk");
    expect(r.next).toBe("Recurrent");
    expect(r.hint).toMatch(/Reactiva/);
  });
});
