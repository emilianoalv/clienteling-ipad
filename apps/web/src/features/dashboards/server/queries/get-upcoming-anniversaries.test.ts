import { describe, expect, it } from "vitest";
import { getUpcomingAnniversaries } from "./get-upcoming-anniversaries";
import {
  admin,
  aprilPeriodLocal,
  baLcmPol,
  emptyPeriod,
} from "./_test-fixtures";

// Anchor = May 1 local. Default window=30, minTenure=30.
//   cl-adriana     since 2024-05-14 → anniv 2026-05-14 daysAway 13 years 2
//   cl-natalia-per since 2018-05-14 → anniv 2026-05-14 daysAway 13 years 8

describe("getUpcomingAnniversaries", () => {
  it("Admin default: cl-adriana + cl-natalia-per (mismo 05-14)", async () => {
    const r = await getUpcomingAnniversaries(admin, { period: aprilPeriodLocal });
    expect(r).toHaveLength(2);
    const adriana = r.find((x) => x.clientId === "cl-adriana");
    expect(adriana).toBeDefined();
    expect(adriana!.daysAway).toBe(13);
    expect(adriana!.yearsAsClient).toBe(2);
    const natalia = r.find((x) => x.clientId === "cl-natalia-per");
    expect(natalia).toBeDefined();
    expect(natalia!.daysAway).toBe(13);
    expect(natalia!.yearsAsClient).toBe(8);
  });

  it("clienta con tenure < 30d EXCLUIDA", async () => {
    // anchor=Feb 25, window=30 → [Feb 25, Mar 27)
    // cl-lorena since 2026-02-12 → tenure 13d < 30 → excluida
    // cl-constanza since 2021-03-14 → 2026-03-14, daysAway=17, years=5
    const r = await getUpcomingAnniversaries(admin, {
      period: { from: new Date(2026, 1, 1), to: new Date(2026, 1, 25) },
    });
    expect(r.find((x) => x.clientId === "cl-lorena")).toBeUndefined();
    const constanza = r.find((x) => x.clientId === "cl-constanza");
    expect(constanza).toBeDefined();
    expect(constanza!.yearsAsClient).toBe(5);
    expect(constanza!.daysAway).toBe(17);
  });

  it("BA Lancôme Polanco: solo clientas POL × LCM", async () => {
    // cl-adriana POL × YSL → no visible para BA LCM POL
    const r = await getUpcomingAnniversaries(baLcmPol, { period: aprilPeriodLocal });
    expect(r.find((x) => x.clientId === "cl-adriana")).toBeUndefined();
    expect(r).toEqual([]);
  });

  it("scope merge vacío → []", async () => {
    const r = await getUpcomingAnniversaries(baLcmPol, {
      period: aprilPeriodLocal,
      brands: ["YSL"],
    });
    expect(r).toEqual([]);
  });

  it("período sin aniversarios → []", async () => {
    const r = await getUpcomingAnniversaries(admin, { period: emptyPeriod });
    expect(r).toEqual([]);
  });

  it("minTenureDays personalizado (365) excluye más clientas", async () => {
    // cl-adriana since 2024-05-14 → tenure ≈ 717d > 365 → INCLUIDA (todavía)
    const r = await getUpcomingAnniversaries(
      admin,
      { period: aprilPeriodLocal },
      { minTenureDays: 365 },
    );
    expect(r.find((x) => x.clientId === "cl-adriana")).toBeDefined();
  });

  it("windowDays más amplio (90) cubre más aniversarios", async () => {
    // [May 1, Jul 30): cl-adriana may-14, cl-cristina jun-1, cl-marina... (sep-08 fuera)
    // cl-cristina since 2022-06-01 → 2026-06-01 daysAway=31, years=4
    const r = await getUpcomingAnniversaries(
      admin,
      { period: aprilPeriodLocal },
      { windowDays: 90 },
    );
    const cristina = r.find((x) => x.clientId === "cl-cristina");
    expect(cristina).toBeDefined();
    expect(cristina!.yearsAsClient).toBe(4);
  });
});
