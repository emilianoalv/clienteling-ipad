import { describe, expect, it } from "vitest";
import type { BrandId } from "@/types/brand";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import type { BaRankingEntry } from "../server/queries";
import { computeCounterAveragesByBrand } from "./counter-averages";

const baEntry = (overrides: Partial<BaRankingEntry>): BaRankingEntry => ({
  baId: "u-1" as unknown as StaffId,
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

describe("computeCounterAveragesByBrand", () => {
  it("groups by brand and averages sales + conversion within each", () => {
    const out = computeCounterAveragesByBrand([
      baEntry({ baId: "a" as unknown as StaffId, brand: "Lancôme", salesAmount: 400_000, conversionRate: 30 }),
      baEntry({ baId: "b" as unknown as StaffId, brand: "Lancôme", salesAmount: 600_000, conversionRate: 20 }),
      baEntry({ baId: "c" as unknown as StaffId, brand: "YSL", salesAmount: 300_000, conversionRate: 18 }),
      baEntry({ baId: "d" as unknown as StaffId, brand: "YSL", salesAmount: 500_000, conversionRate: 22 }),
    ]);

    const lcm = out.get("Lancôme" as BrandId)!;
    expect(lcm.avgSales).toBe(500_000);
    expect(lcm.avgConversionRate).toBe(25);
    expect(lcm.baCount).toBe(2);

    const ysl = out.get("YSL" as BrandId)!;
    expect(ysl.avgSales).toBe(400_000);
    expect(ysl.avgConversionRate).toBe(20);
    expect(ysl.baCount).toBe(2);
  });

  it("returns an empty map for empty input", () => {
    expect(computeCounterAveragesByBrand([]).size).toBe(0);
  });

  it("omits brands not represented in the ranking", () => {
    const out = computeCounterAveragesByBrand([
      baEntry({ brand: "Lancôme", salesAmount: 100_000, conversionRate: 25 }),
    ]);
    expect(out.has("Lancôme" as BrandId)).toBe(true);
    expect(out.has("YSL" as BrandId)).toBe(false);
  });
});
