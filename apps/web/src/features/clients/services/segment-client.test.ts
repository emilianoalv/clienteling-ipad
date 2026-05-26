import { describe, expect, it } from "vitest";
import type { Client } from "@/types/client";
import type { StoreId } from "@/types/store";
import { segmentClient } from "./segment-client";

function makeClient(overrides: Partial<Client["stats"]> & { lastPurchase?: string | null } = {}): Client {
  return {
    id: "cl-test" as Client["id"],
    name: "Test",
    phone: "5550000000",
    email: "t@t.test",
    birthday: "1990-01-01",
    city: "CDMX",
    age: 30,
    preferredLang: "es-MX",
    since: "2024-01-01",
    tier: "Signature",
    brands: ["Lancôme"],
    storeId: "st-pol" as StoreId,
    skin: { type: "Normal", concerns: [], tone: "medio" },
    allergies: [],
    loyalty: { name: "Luxe Circle", tier: "Signature", points: 0, toNext: 1000 },
    stats: {
      ltv: overrides.ltv ?? 0,
      visits: overrides.visits ?? 0,
      avgTicket: overrides.avgTicket ?? 0,
      lastPurchase: overrides.lastPurchase ?? null,
    },
    affinities: [],
    interests: [],
    routine: "Básica",
    createdByBaId: "us-ba-test" as never,
    assignedBaIds: [],
  };
}

describe("segmentClient", () => {
  it("classifies a high-LTV, high-frequency client as VIP", () => {
    expect(segmentClient(makeClient({ ltv: 200_000, visits: 8 }))).toBe("VIP");
  });

  it("requires both LTV and visits for VIP", () => {
    expect(segmentClient(makeClient({ ltv: 200_000, visits: 4 }))).toBe("Recurrent");
    expect(segmentClient(makeClient({ ltv: 30_000, visits: 8 }))).toBe("Recurrent");
  });

  it("marks dormant high-engagement clients as AtRisk", () => {
    const longAgo = new Date(Date.UTC(2025, 0, 1)).toISOString();
    const now = new Date(Date.UTC(2026, 0, 1));
    expect(segmentClient(makeClient({ ltv: 60_000, visits: 5, lastPurchase: longAgo }), now)).toBe(
      "AtRisk",
    );
  });

  it("classifies low-history clients as New", () => {
    expect(segmentClient(makeClient({ ltv: 1_000, visits: 1 }))).toBe("New");
  });

  it("classifies frequent low-LTV clients as Recurrent", () => {
    expect(segmentClient(makeClient({ ltv: 10_000, visits: 6 }))).toBe("Recurrent");
  });
});
