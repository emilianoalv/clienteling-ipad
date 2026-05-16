import { describe, expect, it } from "vitest";
import type { Client } from "@/types/client";
import type { StoreId } from "@/types/store";
import { listUpcomingEvents } from "./list-upcoming-events";

function client(overrides: Partial<Pick<Client, "birthday" | "since">> & { lastPurchase?: string | null } = {}): Client {
  return {
    id: "cl-x" as Client["id"],
    name: "X",
    phone: "5550000000",
    email: "x@x.test",
    birthday: overrides.birthday ?? "1990-06-15",
    city: "CDMX",
    age: 35,
    preferredLang: "es-MX",
    since: overrides.since ?? "2020-06-15",
    tier: "Signature",
    brands: ["Lancôme"],
    storeId: "st-pol" as StoreId,
    skin: { type: "Normal", concerns: [], tone: "medio" },
    allergies: [],
    loyalty: { name: "Luxe Circle", tier: "Signature", points: 0, toNext: 0 },
    stats: {
      ltv: 0,
      visits: 0,
      avgTicket: 0,
      lastPurchase: overrides.lastPurchase ?? null,
    },
    affinities: [],
    interests: [],
    routine: "Básica",
  };
}

describe("listUpcomingEvents", () => {
  it("includes birthday inside window", () => {
    const now = new Date(Date.UTC(2026, 5, 1));
    const events = listUpcomingEvents(client({ birthday: "1990-06-15" }), { windowDays: 60, now });
    expect(events.some((e) => e.kind === "birthday")).toBe(true);
  });

  it("excludes events outside the window", () => {
    const now = new Date(Date.UTC(2026, 0, 1));
    const events = listUpcomingEvents(client({ birthday: "1990-09-15" }), { windowDays: 10, now });
    expect(events.find((e) => e.kind === "birthday")).toBeUndefined();
  });

  it("suggests replenishment 60 days after last purchase", () => {
    const now = new Date(Date.UTC(2026, 4, 12));
    const events = listUpcomingEvents(
      client({ lastPurchase: "2026-03-13T00:00:00.000Z" }),
      { windowDays: 60, now },
    );
    expect(events.some((e) => e.kind === "replenishment")).toBe(true);
  });

  it("sorts events by daysUntil ascending", () => {
    const now = new Date(Date.UTC(2026, 4, 1));
    const events = listUpcomingEvents(
      client({ birthday: "1990-05-20", since: "2020-06-10", lastPurchase: "2026-03-15T00:00:00.000Z" }),
      { windowDays: 90, now },
    );
    for (let i = 1; i < events.length; i++) {
      expect(events[i - 1]!.daysUntil <= events[i]!.daysUntil).toBe(true);
    }
  });
});
