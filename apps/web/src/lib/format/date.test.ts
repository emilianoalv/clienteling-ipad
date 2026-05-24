import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/date/week";
import {
  formatDateExport,
  formatDateLong,
  formatDateRelative,
  formatDateShort,
  smartFormatDate,
} from "./date";

// Mid-day to dodge DST edges; tests use addDays for deltas.
const NOW = new Date(2026, 4, 24, 12, 0, 0); // 24 May 2026 12:00

describe("formatDateRelative", () => {
  it('returns "ayer" for the previous calendar day', () => {
    expect(formatDateRelative(addDays(NOW, -1), NOW)).toBe("ayer");
  });

  it('returns "hoy" for the same day', () => {
    expect(formatDateRelative(NOW, NOW)).toBe("hoy");
  });

  it('returns "hace N días" for less than a week', () => {
    expect(formatDateRelative(addDays(NOW, -3), NOW)).toBe("hace 3 días");
  });

  it('returns "hace 1 semana" exactly at 7 days', () => {
    expect(formatDateRelative(addDays(NOW, -7), NOW)).toBe("hace 1 semana");
  });

  it('returns "hace N semanas" between 8 and 29 days back', () => {
    expect(formatDateRelative(addDays(NOW, -14), NOW)).toBe("hace 2 semanas");
  });

  it('returns "hace N meses" past 30 days', () => {
    expect(formatDateRelative(addDays(NOW, -35), NOW)).toBe("hace 1 mes");
    expect(formatDateRelative(addDays(NOW, -60), NOW)).toBe("hace 2 meses");
  });
});

describe("formatDateShort", () => {
  it("renders day + abbreviated month with no year (es-MX)", () => {
    const out = formatDateShort(new Date(2026, 3, 15));
    // Intl can output "15 abr" or "15 abr." depending on node version.
    expect(out).toMatch(/^15 abr/);
    expect(out).not.toContain("2026");
  });
});

describe("formatDateLong", () => {
  it("includes day + month + year", () => {
    const out = formatDateLong(new Date(2026, 3, 15));
    expect(out).toMatch(/15/);
    expect(out).toMatch(/abr/);
    expect(out).toContain("2026");
  });
});

describe("formatDateExport", () => {
  it("renders ISO YYYY-MM-DD", () => {
    expect(formatDateExport(new Date(2026, 3, 15))).toBe("2026-04-15");
    expect(formatDateExport(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("smartFormatDate", () => {
  it("uses relative format for ≤30 days", () => {
    expect(smartFormatDate(addDays(NOW, -5), NOW)).toBe("hace 5 días");
  });

  it("uses short format for 31-90 days", () => {
    const out = smartFormatDate(addDays(NOW, -60), NOW);
    expect(out).not.toContain("hace");
    expect(out).not.toContain("2026");
  });

  it("uses long format past 90 days", () => {
    const out = smartFormatDate(addDays(NOW, -120), NOW);
    expect(out).toContain("2026");
  });
});
