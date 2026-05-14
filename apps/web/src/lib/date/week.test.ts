import { describe, expect, it } from "vitest";
import { addDays, isSameDay, isoWeekNumber, startOfIsoWeek, startOfMonth, endOfMonth } from "./week";

describe("startOfIsoWeek", () => {
  it("returns Monday for a Wednesday", () => {
    const wed = new Date(2026, 4, 6); // Wed 6 May 2026
    const mon = startOfIsoWeek(wed);
    expect(mon.getDay()).toBe(1);
    expect(mon.getDate()).toBe(4);
  });

  it("returns the same date when given a Monday", () => {
    const mon = new Date(2026, 4, 4);
    expect(startOfIsoWeek(mon).getTime()).toBe(new Date(2026, 4, 4).getTime());
  });

  it("returns previous Monday when given a Sunday", () => {
    const sun = new Date(2026, 4, 10);
    const mon = startOfIsoWeek(sun);
    expect(mon.getDate()).toBe(4);
  });
});

describe("isoWeekNumber", () => {
  it("classifies first week of 2026", () => {
    expect(isoWeekNumber(new Date(2026, 0, 2))).toBe(1);
  });

  it("returns 53 for late December of a 53-week year", () => {
    expect(isoWeekNumber(new Date(2020, 11, 31))).toBe(53);
  });
});

describe("isSameDay", () => {
  it("ignores time portion", () => {
    expect(isSameDay(new Date(2026, 4, 12, 9), new Date(2026, 4, 12, 23))).toBe(true);
    expect(isSameDay(new Date(2026, 4, 12), new Date(2026, 4, 13))).toBe(false);
  });
});

describe("addDays", () => {
  it("crosses month boundaries", () => {
    const next = addDays(new Date(2026, 0, 31), 1);
    expect(next.getMonth()).toBe(1);
    expect(next.getDate()).toBe(1);
  });
});

describe("startOfMonth / endOfMonth", () => {
  it("returns first and last day", () => {
    const ref = new Date(2026, 4, 14);
    expect(startOfMonth(ref).getDate()).toBe(1);
    expect(endOfMonth(ref).getDate()).toBe(31);
  });
});
