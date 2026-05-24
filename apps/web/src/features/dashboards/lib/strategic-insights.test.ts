import { describe, expect, it } from "vitest";
import type { StoreId } from "@/types/store";
import {
  computeStrategicInsights,
  type StrategicInsightsInput,
} from "./strategic-insights";

const ST_A = "st-a" as unknown as StoreId;
const ST_B = "st-b" as unknown as StoreId;

function input(overrides: Partial<StrategicInsightsInput> = {}): StrategicInsightsInput {
  return {
    nationalSales: 5_000_000,
    nationalAvgConvReco: 25,
    nationalAvgTicket: 5_000,
    totalRecommendations: 800,
    stores: [
      { storeId: ST_A, storeName: "Polanco", sales: 1_900_000, convReco: 30 },
      { storeId: ST_B, storeName: "Santa Fe", sales: 1_300_000, convReco: 22 },
    ],
    brandGrowth: { lancome: 12, ysl: 5 },
    ...overrides,
  };
}

describe("computeStrategicInsights", () => {
  it('always emits the "clienteling value" insight when there are recommendations', () => {
    const out = computeStrategicInsights(input());
    expect(out[0]?.icon).toBe("trending-up");
    expect(out[0]?.title).toMatch(/clienteling generó/);
  });

  it("emits the opportunity-gap insight when best store is 20%+ above national avg", () => {
    const out = computeStrategicInsights(
      input({
        nationalAvgConvReco: 20,
        stores: [
          { storeId: ST_A, storeName: "Polanco", sales: 2_000_000, convReco: 35 },
          { storeId: ST_B, storeName: "Santa Fe", sales: 1_000_000, convReco: 18 },
        ],
      }),
    );
    expect(out.find((x) => x.icon === "target")).toBeTruthy();
  });

  it("emits brand strategy insight when growth diff > 5pp", () => {
    const out = computeStrategicInsights(input());
    const brand = out.find((x) => x.icon === "compass");
    expect(brand).toBeTruthy();
    expect(brand?.title).toMatch(/Lancôme/);
    expect(brand?.title).toMatch(/YSL/);
  });

  it("returns at most 3 insights", () => {
    const out = computeStrategicInsights(input());
    expect(out.length).toBeLessThanOrEqual(3);
  });

  it("skips the brand insight when growth is parallel", () => {
    const out = computeStrategicInsights(
      input({ brandGrowth: { lancome: 8, ysl: 7 } }),
    );
    expect(out.find((x) => x.icon === "compass")).toBeUndefined();
  });
});
