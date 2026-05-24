import { describe, expect, it } from "vitest";
import type { BrandId } from "@/types/brand";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import type { BaRankingEntry } from "../server/queries";
import { computeCoachingInsights } from "./coaching-insights";
import type { BrandCounterAverages } from "./counter-averages";

const baEntry = (overrides: Partial<BaRankingEntry>): BaRankingEntry => ({
  baId: "u-default" as unknown as StaffId,
  name: "BA",
  storeId: "st-pol" as unknown as StoreId,
  storeName: "Polanco",
  brand: "Lancôme" as BrandId,
  salesAmount: 0,
  transactionsCount: 0,
  conversionRate: 0,
  rank: 1,
  ...overrides,
});

const lcmBrand = "Lancôme" as BrandId;

describe("computeCoachingInsights", () => {
  it('emits "top growth" for the BA with the largest positive delta', () => {
    const ranking = [
      baEntry({ baId: "vale" as unknown as StaffId, name: "Valentina" }),
      baEntry({ baId: "diego" as unknown as StaffId, name: "Diego" }),
    ];
    const insights = computeCoachingInsights({
      ranking,
      deltas: new Map([
        ["vale" as unknown as StaffId, 5],
        ["diego" as unknown as StaffId, 15],
      ]),
      counterAveragesByBrand: new Map(),
      targetsByBa: new Map(),
    });
    expect(insights[0]?.severity).toBe("info");
    expect(insights[0]?.title).toMatch(/Diego/);
    expect(insights[0]?.title).toMatch(/\+15/);
  });

  it('emits "critical" when % goal < 70%', () => {
    const ranking = [
      baEntry({
        baId: "sofi" as unknown as StaffId,
        name: "Sofía",
        salesAmount: 100_000,
      }),
    ];
    const insights = computeCoachingInsights({
      ranking,
      deltas: new Map(),
      counterAveragesByBrand: new Map(),
      targetsByBa: new Map([
        ["sofi" as unknown as StaffId, 200_000],
      ]),
    });
    expect(insights.some((i) => i.severity === "critical")).toBe(true);
    expect(insights.some((i) => i.title.includes("Sofía"))).toBe(true);
  });

  it('emits "warning" for low conversion vs brand counter average', () => {
    const ranking = [
      baEntry({
        baId: "low" as unknown as StaffId,
        name: "Low conv",
        conversionRate: 12,
        brand: lcmBrand,
      }),
    ];
    const counterAverages = new Map<BrandId, BrandCounterAverages>([
      [
        lcmBrand,
        { avgSales: 400_000, avgConversionRate: 24, baCount: 4 },
      ],
    ]);
    const insights = computeCoachingInsights({
      ranking,
      deltas: new Map(),
      counterAveragesByBrand: counterAverages,
      targetsByBa: new Map(),
    });
    expect(insights.some((i) => i.severity === "warning")).toBe(true);
    expect(insights.some((i) => i.title.includes("Low conv"))).toBe(true);
  });

  it("returns at most 3 insights", () => {
    const ranking = Array.from({ length: 8 }, (_, i) =>
      baEntry({
        baId: `u${i}` as unknown as StaffId,
        name: `BA-${i}`,
        salesAmount: 50_000,
        conversionRate: 5,
      }),
    );
    const deltas = new Map(
      ranking.map((b, i) => [b.baId, 1 + i] as const),
    );
    const targets = new Map(
      ranking.map((b) => [b.baId, 1_000_000] as const),
    );
    const counter = new Map<BrandId, BrandCounterAverages>([
      [lcmBrand, { avgSales: 500_000, avgConversionRate: 25, baCount: 8 }],
    ]);
    const out = computeCoachingInsights({
      ranking,
      deltas,
      counterAveragesByBrand: counter,
      targetsByBa: targets,
    });
    expect(out.length).toBeLessThanOrEqual(3);
  });
});
