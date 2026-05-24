import { describe, expect, it } from "vitest";
import { parseFilters } from "./parse-filters";

const NOW = new Date(2026, 4, 15, 12, 0, 0); // 15 May 2026 mid-day

describe("parseFilters", () => {
  it("defaults to MTD when no period param is provided", () => {
    const out = parseFilters({}, { defaultPeriod: "mtd", now: NOW });
    expect(out.period.from).toEqual(new Date(2026, 4, 1));
    expect(out.period.to).toEqual(new Date(2026, 5, 1));
    expect(out.storeIds).toBeUndefined();
    expect(out.brands).toBeUndefined();
    expect(out.baId).toBeUndefined();
  });

  it("returns last-month period for period=last-month", () => {
    const out = parseFilters({ period: "last-month" }, { now: NOW });
    expect(out.period.from).toEqual(new Date(2026, 3, 1));
    expect(out.period.to).toEqual(new Date(2026, 4, 1));
  });

  it("returns YTD period for period=ytd", () => {
    const out = parseFilters({ period: "ytd" }, { now: NOW });
    expect(out.period.from).toEqual(new Date(2026, 0, 1));
    expect(out.period.to).toEqual(new Date(2027, 0, 1));
  });

  it("returns QTD period anchored to current quarter", () => {
    // May → Q2 (April-June)
    const out = parseFilters({ period: "qtd" }, { now: NOW });
    expect(out.period.from).toEqual(new Date(2026, 3, 1));
    expect(out.period.to).toEqual(new Date(2026, 6, 1));
  });

  it("falls back to default for an unknown period value", () => {
    const out = parseFilters(
      { period: "wat" },
      { defaultPeriod: "ytd", now: NOW },
    );
    expect(out.period.from).toEqual(new Date(2026, 0, 1));
  });

  it("propagates scope filters when present", () => {
    const out = parseFilters(
      { storeId: "st-pol", brand: "Lancôme", baId: "us-ba-pol-lcm-1" },
      { now: NOW },
    );
    expect(out.storeIds).toEqual(["st-pol"]);
    expect(out.brands).toEqual(["Lancôme"]);
    expect(out.baId).toBe("us-ba-pol-lcm-1");
  });

  it("ignores invalid brand values", () => {
    const out = parseFilters({ brand: "NotABrand" }, { now: NOW });
    expect(out.brands).toBeUndefined();
  });
});
