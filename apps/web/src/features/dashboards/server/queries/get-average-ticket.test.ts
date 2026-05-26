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
  it("Admin abril: 80,010 / 9 = 8,890", async () => {
    expect(await getAverageTicket(admin, { period: aprilPeriod })).toBe(8_890);
  });

  it("BA Lancôme Polanco abril: (16,200 + 12,100) / 2 = 14,150", async () => {
    expect(await getAverageTicket(baLcmPol, { period: aprilPeriod })).toBe(14_150);
  });

  it("sin transacciones → 0 (no NaN)", async () => {
    expect(await getAverageTicket(baYslPol, { period: aprilPeriod })).toBe(0);
    expect(await getAverageTicket(admin, { period: emptyPeriod })).toBe(0);
  });

  it("Supervisor Centro abril: 63,190 / 6 = 10,531.666…", async () => {
    expect(
      await getAverageTicket(supervisorCentro, { period: aprilPeriod }),
    ).toBeCloseTo(63_190 / 6);
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
