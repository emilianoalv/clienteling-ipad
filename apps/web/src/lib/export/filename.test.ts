import { describe, expect, it } from "vitest";
import { buildExportFilename } from "./filename";

describe("buildExportFilename", () => {
  it("slugifies role + identifier + period and appends extension", () => {
    const out = buildExportFilename(
      "reporte-clientes",
      {
        role: "BA",
        identifier: "Valentina Ríos",
        period: { from: new Date(2026, 4, 1), to: new Date(2026, 5, 1) },
      },
      "xlsx",
    );
    expect(out).toBe("reporte-clientes-ba-valentina-rios-2026-05.xlsx");
  });

  it("uses the CSV extension when format is csv", () => {
    const out = buildExportFilename(
      "ranking-bas",
      { role: "Admin", identifier: "Andrea" },
      "csv",
    );
    expect(out).toBe("ranking-bas-admin-andrea.csv");
  });

  it("collapses non-alphanumeric runs into single hyphens", () => {
    const out = buildExportFilename(
      "reporte / agenda",
      { identifier: "Polanco · LCM" },
      "xlsx",
    );
    expect(out).toBe("reporte-agenda-polanco-lcm.xlsx");
  });

  it("formats cross-month periods as YYYY-MM-DD_YYYY-MM-DD", () => {
    const out = buildExportFilename(
      "test",
      {
        period: { from: new Date(2026, 0, 1), to: new Date(2026, 5, 1) },
      },
      "xlsx",
    );
    expect(out).toMatch(/2026-01-01_2026-06-01/);
  });
});
