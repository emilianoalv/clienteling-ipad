import { describe, expect, it } from "vitest";
import { getTransactionsCount } from "./get-transactions-count";
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

describe("getTransactionsCount", () => {
  it("Admin sin filtros cuenta TODAS las compras del período", async () => {
    // Abril 2026: pu-1, pu-3, pu-5, pu-7, pu-9, pu-10, pu-17, pu-18, pu-19 = 9
    expect(await getTransactionsCount(admin, { period: aprilPeriod })).toBe(9);
  });

  it("BA Lancôme Polanco cuenta solo POL × LCM", async () => {
    // Abril POL × LCM: pu-1 + pu-3 = 2
    expect(await getTransactionsCount(baLcmPol, { period: aprilPeriod })).toBe(2);
  });

  it("BA YSL Polanco no tiene transacciones en abril", async () => {
    expect(await getTransactionsCount(baYslPol, { period: aprilPeriod })).toBe(0);
  });

  it("Supervisor Centro (POL + STF) excluye Perisur", async () => {
    // Abril POL + STF: pu-1, pu-3, pu-9, pu-10, pu-17, pu-19 = 6
    expect(
      await getTransactionsCount(supervisorCentro, { period: aprilPeriod }),
    ).toBe(6);
  });

  it("intersección vacía → 0", async () => {
    expect(
      await getTransactionsCount(gerentePol, {
        period: aprilPeriod,
        storeIds: [ST_PER],
      }),
    ).toBe(0);
  });

  it("período sin compras → 0", async () => {
    expect(await getTransactionsCount(admin, { period: emptyPeriod })).toBe(0);
  });

  it("filtro baId restringe a las compras de ese BA", async () => {
    expect(
      await getTransactionsCount(gerentePol, {
        period: aprilPeriod,
        baId: baLcmPol.id,
      }),
    ).toBe(1);
  });
});
