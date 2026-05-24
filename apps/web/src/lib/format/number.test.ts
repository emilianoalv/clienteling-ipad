import { describe, expect, it } from "vitest";
import {
  formatCount,
  formatCountCompact,
  formatCurrencyCompact,
  formatCurrencyFull,
  formatPercent,
  formatPercentChange,
  formatPercentDelta,
} from "./number";

describe("formatCurrencyCompact", () => {
  it("returns $X.YM for values ≥ 1M", () => {
    expect(formatCurrencyCompact(1_234_567)).toBe("$1.2M");
    expect(formatCurrencyCompact(20_170_000)).toBe("$20.2M");
  });

  it("returns $XK for values ≥ 1K", () => {
    expect(formatCurrencyCompact(4567)).toBe("$5K");
    expect(formatCurrencyCompact(486_200)).toBe("$486K");
  });

  it("returns localized $X for values < 1K", () => {
    expect(formatCurrencyCompact(123)).toBe("$123");
  });
});

describe("formatCurrencyFull", () => {
  it("uses es-MX MXN format", () => {
    const out = formatCurrencyFull(486_200);
    // Intl output varies by node version: just assert key segments.
    expect(out).toContain("486,200");
    expect(out).toMatch(/\$/);
  });
});

describe("formatPercent", () => {
  it("rounds to 0 decimals by default", () => {
    expect(formatPercent(72.4)).toBe("72%");
  });

  it("honors the decimals parameter", () => {
    expect(formatPercent(72.34, 1)).toBe("72.3%");
  });
});

describe("formatPercentDelta", () => {
  it("rounds and prefixes positive values with +", () => {
    expect(formatPercentDelta(8.3)).toBe("+8pp");
  });

  it("rounds half away from zero for negative values", () => {
    expect(formatPercentDelta(-4.5)).toBe("-5pp");
  });

  it("returns 0pp for zero (no sign)", () => {
    expect(formatPercentDelta(0)).toBe("0pp");
  });
});

describe("formatPercentChange", () => {
  it("prefixes positive values with + and uses 1 decimal", () => {
    expect(formatPercentChange(12.43)).toBe("+12.4%");
  });

  it("preserves the minus sign on negatives", () => {
    expect(formatPercentChange(-5)).toBe("-5.0%");
  });
});

describe("formatCountCompact", () => {
  it("returns X.YK for values ≥ 1K", () => {
    expect(formatCountCompact(1234)).toBe("1.2K");
  });

  it("returns the raw count for values < 1K", () => {
    expect(formatCountCompact(245)).toBe("245");
  });
});

describe("formatCount", () => {
  it("uses es-MX thousands separator", () => {
    expect(formatCount(1245)).toBe("1,245");
  });
});
