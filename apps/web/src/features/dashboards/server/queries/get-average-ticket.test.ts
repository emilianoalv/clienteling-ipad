import { describe, expect, it } from "vitest";
import { getAverageTicket } from "./get-average-ticket";
import {
  admin,
  aprilPeriod,
  baLcmPol,
  baYslPol,
  emptyPeriod,
  gerentePol,
  ST_PER,
  supervisorCentro,
} from "./_test-fixtures";

describe("getAverageTicket", () => {
  it("Admin abril: 125,980 / 18 = 6,998.888…", async () => {
    // Total April 2026: 18 transactions, sum 125,980 → 125980 / 18 = 6998.888…
    expect(await getAverageTicket(admin, { period: aprilPeriod })).toBeCloseTo(
      125_980 / 18,
    );
  });

  it("BA Lancôme Polanco abril: POL × LCM = 40,500 / 4 = 10,125", async () => {
    // POL × LCM en abril = pu-1 + pu-3 + pu-20 + pu-23 = 40,500.
    expect(await getAverageTicket(baLcmPol, { period: aprilPeriod })).toBe(10_125);
  });

  it("BA YSL Polanco abril: solo pu-21 = 5,110", async () => {
    // POL × YSL en abril = pu-21 (5,110).
    expect(await getAverageTicket(baYslPol, { period: aprilPeriod })).toBe(5_110);
  });

  it("período sin compras → 0 (no NaN)", async () => {
    expect(await getAverageTicket(admin, { period: emptyPeriod })).toBe(0);
  });

  it("Supervisor Centro abril: 94,720 / 12 = 7,893.333…", async () => {
    // POL + STF abril = 12 tickets, sum 94,720.
    expect(
      await getAverageTicket(supervisorCentro, { period: aprilPeriod }),
    ).toBeCloseTo(94_720 / 12);
  });

  it("intersección vacía → 0", async () => {
    expect(
      await getAverageTicket(gerentePol, {
        period: aprilPeriod,
        storeIds: [ST_PER],
      }),
    ).toBe(0);
  });

  it("baId única transacción: el ticket promedio es el monto de esa transacción", async () => {
    expect(
      await getAverageTicket(gerentePol, {
        period: aprilPeriod,
        baId: baLcmPol.id,
      }),
    ).toBe(16_200);
  });
});
