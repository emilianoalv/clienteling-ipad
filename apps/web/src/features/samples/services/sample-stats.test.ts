import { describe, expect, it } from "vitest";
import type { Sample, SampleId } from "@/types/sample";
import type { Purchase, PurchaseId } from "@/types/purchase";
import type { ClientId } from "@/types/client";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import type { Sku } from "@/types/product";
import { aggregateSampleStats } from "./sample-stats";

function sample(
  id: string,
  givenAt: string,
  converted: boolean,
  purchaseId?: PurchaseId,
): Sample {
  return {
    id: `sp-${id}` as SampleId,
    clientId: "cl-x" as ClientId,
    baId: "ba-x" as StaffId,
    sku: "LC-REN-5" as Sku,
    name: "Sample",
    givenAt,
    converted,
    ...(purchaseId !== undefined && { purchaseId }),
  };
}

function purchase(id: string, total: number): Purchase {
  return {
    id: id as PurchaseId,
    clientId: "cl-x" as ClientId,
    baId: "ba-x" as StaffId,
    storeId: "st-pol" as StoreId,
    at: "2026-05-01T00:00:00.000Z",
    items: [],
    total,
    payment: "card",
  };
}

describe("aggregateSampleStats", () => {
  const now = new Date("2026-05-12T12:00:00.000Z");
  const within = new Date("2026-05-10T10:00:00.000Z").toISOString();
  const outside = new Date("2026-04-20T10:00:00.000Z").toISOString();

  it("returns zeros for empty input", () => {
    const s = aggregateSampleStats([], [], { now });
    expect(s.delivered).toBe(0);
    expect(s.conversionRate).toBe(0);
    expect(s.attributableRevenue).toBe(0);
  });

  it("counts samples within the 7-day window only", () => {
    const stats = aggregateSampleStats(
      [sample("a", within, false), sample("b", outside, false), sample("c", within, false)],
      [],
      { now },
    );
    expect(stats.delivered).toBe(2);
  });

  it("computes conversion rate across the whole set", () => {
    const stats = aggregateSampleStats(
      [sample("a", within, true), sample("b", within, false), sample("c", within, true)],
      [],
      { now },
    );
    expect(stats.conversionRate).toBeCloseTo(2 / 3, 5);
  });

  it("sums revenue from purchases linked by converted samples", () => {
    const stats = aggregateSampleStats(
      [
        sample("a", within, true, "pu-1" as PurchaseId),
        sample("b", within, true, "pu-2" as PurchaseId),
        sample("c", within, false),
      ],
      [purchase("pu-1", 5_000), purchase("pu-2", 12_000), purchase("pu-3", 9_999)],
      { now },
    );
    expect(stats.attributableRevenue).toBe(17_000);
  });
});
