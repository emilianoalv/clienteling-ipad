import { describe, expect, it } from "vitest";
import { getUpcomingBirthdays } from "./get-upcoming-birthdays";
import {
  admin,
  aprilPeriodLocal,
  baLcmPol,
  baLcmStf,
  baYslPol,
  gerenteStf,
} from "./_test-fixtures";

// Anchor = aprilPeriodLocal.to = May 1 local midnight.
// Default window=30 → [May 1, May 31).
//
// Clientas con bday en esa ventana:
//   cl-pamela        1999-05-08 → daysAway 7  age 27 (STF LCM)
//   cl-constanza     1988-05-22 → daysAway 21 age 38 (POL multi)
//   cl-mariana-pol   1995-05-28 → daysAway 27 age 31 (POL LCM)
//   cl-fernanda-stf  2000-05-30 → daysAway 29 age 26 (STF YSL)

describe("getUpcomingBirthdays", () => {
  it("Admin default 30d: 4 cumpleaños ordenados por daysAway", async () => {
    const r = await getUpcomingBirthdays(admin, { period: aprilPeriodLocal });
    expect(r).toHaveLength(4);
    expect(r[0]!.name).toBe("Pamela Vázquez");
    expect(r[0]!.daysAway).toBe(7);
    expect(r[0]!.age).toBe(27);
    expect(r[1]!.name).toBe("Constanza Iturbide");
    expect(r[1]!.daysAway).toBe(21);
    expect(r[1]!.age).toBe(38);
    expect(r[2]!.clientId).toBe("cl-mariana-pol");
    expect(r[2]!.daysAway).toBe(27);
    expect(r[3]!.clientId).toBe("cl-fernanda-stf");
    expect(r[3]!.daysAway).toBe(29);
  });

  it("BA Lancôme Polanco: cl-constanza + cl-mariana-pol", async () => {
    const r = await getUpcomingBirthdays(baLcmPol, { period: aprilPeriodLocal });
    expect(r).toHaveLength(2);
    expect(r.map((x) => x.clientId).sort()).toEqual(["cl-constanza", "cl-mariana-pol"]);
  });

  it("Gerente Santa Fe: cl-pamela + cl-fernanda-stf", async () => {
    const r = await getUpcomingBirthdays(gerenteStf, { period: aprilPeriodLocal });
    expect(r).toHaveLength(2);
    expect(r.map((x) => x.clientId).sort()).toEqual(["cl-fernanda-stf", "cl-pamela"]);
  });

  it("BA Lancôme Santa Fe: solo cl-pamela (STF LCM)", async () => {
    const r = await getUpcomingBirthdays(baLcmStf, { period: aprilPeriodLocal });
    expect(r).toHaveLength(1);
  });

  it("cumpleaños HOY: daysAway = 0", async () => {
    const r = await getUpcomingBirthdays(
      admin,
      { period: { ...aprilPeriodLocal, to: new Date(2026, 4, 8) } }, // May 8
      { windowDays: 1 },
    );
    const pamela = r.find((x) => x.clientId === "cl-pamela");
    expect(pamela).toBeDefined();
    expect(pamela!.daysAway).toBe(0);
  });

  it("cumpleaños ya pasó hace 2 días: NO aparece (próximo año fuera del window)", async () => {
    const r = await getUpcomingBirthdays(
      admin,
      { period: { ...aprilPeriodLocal, to: new Date(2026, 4, 10) } }, // May 10
      { windowDays: 1 },
    );
    expect(r.find((x) => x.clientId === "cl-pamela")).toBeUndefined();
  });

  it("cumpleaños cross-year (anchor dic-20, window=45)", async () => {
    // cl-karla 1987-01-29 → 2027-01-29 está en [Dic 20 2026, Feb 3 2027)
    const r = await getUpcomingBirthdays(
      admin,
      {
        period: {
          from: new Date(2026, 11, 1),
          to: new Date(2026, 11, 20), // Dec 20
        },
      },
      { windowDays: 45 },
    );
    const karla = r.find((x) => x.clientId === "cl-karla");
    expect(karla).toBeDefined();
    expect(karla!.daysAway).toBe(40);
    expect(karla!.age).toBe(40); // 2027 - 1987
  });

  it("BA YSL Polanco: cl-constanza visible (multi-brand) — daysAway=21", async () => {
    const r = await getUpcomingBirthdays(baYslPol, { period: aprilPeriodLocal });
    // POL × YSL ve a cl-constanza (multi) y cl-adriana (YSL-only), pero solo
    // cl-constanza tiene bday en window.
    expect(r).toHaveLength(1);
    expect(r[0]!.clientId).toBe("cl-constanza");
  });

  it("scope merge vacío → []", async () => {
    const r = await getUpcomingBirthdays(baLcmPol, {
      period: aprilPeriodLocal,
      brands: ["YSL"],
    });
    expect(r).toEqual([]);
  });

  it("período sin cumpleaños → []", async () => {
    const r = await getUpcomingBirthdays(
      admin,
      { period: { from: new Date(2026, 9, 1), to: new Date(2026, 9, 15) } }, // mid-Oct
      { windowDays: 7 },
    );
    expect(r).toEqual([]);
  });

  it("window personalizado (90d) cubre más cumpleaños", async () => {
    const r = await getUpcomingBirthdays(
      admin,
      { period: aprilPeriodLocal },
      { windowDays: 90 },
    );
    // [May 1, Jul 30): cl-pamela may-8, cl-constanza may-22, cl-ines jun-11, cl-rocio jul-2, cl-lorena jul-9
    expect(r.length).toBeGreaterThanOrEqual(5);
  });

  it("anchor jul-15 2000 local, window=7: cl-yolanda-per (jul-19)", async () => {
    // jul-15 a jul-22 — cl-yolanda-per nace 1979-07-19 (4 días lejos).
    const r = await getUpcomingBirthdays(
      admin,
      { period: { from: new Date(2000, 6, 1), to: new Date(2000, 6, 15) } },
      { windowDays: 7 },
    );
    expect(r).toHaveLength(1);
    expect(r[0]!.clientId).toBe("cl-yolanda-per");
    expect(r[0]!.daysAway).toBe(4);
  });
});
