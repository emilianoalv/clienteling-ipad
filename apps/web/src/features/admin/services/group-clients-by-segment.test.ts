import { describe, expect, it } from "vitest";
import type { Client } from "@/types/client";
import { groupClientsBySegment } from "./group-clients-by-segment";

function client(overrides: {
  id: string;
  ltv?: number;
  visits?: number;
  lastPurchase?: string | null;
}): Client {
  return {
    id: overrides.id as Client["id"],
    name: overrides.id,
    phone: "5550000000",
    email: "x@x.test",
    birthday: "1990-01-01",
    city: "CDMX",
    age: 30,
    preferredLang: "es-MX",
    since: "2024-01-01",
    tier: "Atelier",
    brands: ["Lancôme"],
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

describe("groupClientsBySegment", () => {
  it("returns the 4 segments in canonical order even when empty", () => {
    const buckets = groupClientsBySegment([]);
    expect(buckets.map((b) => b.segment)).toEqual(["VIP", "Recurrent", "New", "AtRisk"]);
    expect(buckets.every((b) => b.clients.length === 0)).toBe(true);
  });

  it("places clients in their correct bucket", () => {
    const now = new Date("2026-05-01T00:00:00Z");
    const vip = client({ id: "v1", ltv: 200_000, visits: 8 });
    const newC = client({ id: "n1" });
    const recurrent = client({ id: "r1", ltv: 60_000, visits: 5 });
    const longAgo = new Date(now.getTime() - 200 * 86_400_000).toISOString().slice(0, 10);
    const atRisk = client({ id: "a1", ltv: 60_000, visits: 5, lastPurchase: longAgo });

    const buckets = groupClientsBySegment([vip, newC, recurrent, atRisk], now);
    const counts = Object.fromEntries(buckets.map((b) => [b.segment, b.clients.length]));
    expect(counts).toEqual({ VIP: 1, Recurrent: 1, New: 1, AtRisk: 1 });
  });
});
