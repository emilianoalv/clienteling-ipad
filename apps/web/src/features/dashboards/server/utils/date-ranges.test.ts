import { describe, expect, it } from "vitest";
import {
  comparablePreviousPeriod,
  last7Days,
  last30Days,
  last90Days,
  nextNDays,
  thisMonth,
  today,
} from "./date-ranges";

describe("thisMonth", () => {
  it("returns [first-of-month, first-of-next-month)", () => {
    const now = new Date(2026, 4, 17); // 17 May 2026
    const p = thisMonth(now);
    expect(p.from.getDate()).toBe(1);
    expect(p.from.getMonth()).toBe(4);
    expect(p.to.getDate()).toBe(1);
    expect(p.to.getMonth()).toBe(5);
  });
});

describe("last7Days", () => {
  it("returns a 7-day half-open window ending tomorrow 00:00", () => {
    const now = new Date(2026, 4, 17, 14, 30); // Sun
    const p = last7Days(now);
    expect(p.from.getDate()).toBe(11); // 6 days earlier
    expect(p.to.getDate()).toBe(18);
    // hours zeroed
    expect(p.from.getHours()).toBe(0);
    expect(p.to.getHours()).toBe(0);
  });
});

describe("last30Days", () => {
  it("returns a 30-day half-open window", () => {
    const now = new Date(2026, 4, 17);
    const p = last30Days(now);
    const days = (p.to.getTime() - p.from.getTime()) / 86_400_000;
    expect(days).toBe(30);
  });
});

describe("last90Days", () => {
  it("returns a 90-day half-open window", () => {
    const now = new Date(2026, 4, 17);
    const p = last90Days(now);
    const days = (p.to.getTime() - p.from.getTime()) / 86_400_000;
    expect(days).toBe(90);
  });
});

describe("comparablePreviousPeriod", () => {
  it("returns the immediately-preceding window of the same length", () => {
    const now = new Date(2026, 4, 17);
    const current = last7Days(now);
    const prev = comparablePreviousPeriod(current);
    expect(prev.to.getTime()).toBe(current.from.getTime());
    expect(prev.to.getTime() - prev.from.getTime()).toBe(
      current.to.getTime() - current.from.getTime(),
    );
  });

  it("preserves the half-open contract — no overlap with current", () => {
    const current = { from: new Date(2026, 4, 10), to: new Date(2026, 4, 17) };
    const prev = comparablePreviousPeriod(current);
    expect(prev.to.getTime()).toBe(current.from.getTime());
    expect(prev.from.getTime()).toBeLessThan(current.from.getTime());
  });
});

describe("today", () => {
  it("returns [start-of-day, start-of-next-day)", () => {
    const now = new Date(2026, 4, 17, 14, 30);
    const p = today(now);
    expect(p.from.getDate()).toBe(17);
    expect(p.from.getHours()).toBe(0);
    expect(p.to.getDate()).toBe(18);
    expect(p.to.getHours()).toBe(0);
  });
});

describe("nextNDays", () => {
  it("nextNDays(7) covers today + the following 7 days", () => {
    const now = new Date(2026, 4, 17);
    const p = nextNDays(7, now);
    const days = (p.to.getTime() - p.from.getTime()) / 86_400_000;
    expect(days).toBe(8);
  });
});
