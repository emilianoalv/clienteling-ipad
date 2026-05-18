import { describe, expect, it } from "vitest";
import { getActiveClients } from "./get-active-clients";
import {
  admin,
  aprilPeriod,
  baLcmPol,
  baYslPol,
  baYslStf,
  emptyPeriod,
  gerentePol,
  ST_PER,
  supervisorCentro,
} from "./_test-fixtures";

// Anchor = aprilPeriod.to = 2026-05-01. Default activityDays=90 → window
// [2026-02-01, 2026-05-01).
//
// Interactions inside the window, by client (only counts unique clients):
//   POL LCM: int-1 (constanza)   + int-2  (ofelia)
//   POL YSL: int-5 (constanza)   + int-6  (adriana)
//   PER LCM: int-8 (cristina)
//   PER YSL: int-11 (gabriela)   + int-13 (ines)   + int-21 (gabriela)
//   STF LCM: int-14 (karla)      + int-15 (marina)
//   STF YSL: (int-18 enero-25 está antes de feb-1 → fuera)
// Unique Admin = { constanza, ofelia, adriana, cristina, gabriela, ines, karla, marina } = 8

describe("getActiveClients", () => {
  it("Admin abril (90d): 8 clientas únicas", async () => {
    expect(await getActiveClients(admin, { period: aprilPeriod })).toBe(8);
  });

  it("BA Lancôme Polanco: 2 (constanza, ofelia)", async () => {
    expect(await getActiveClients(baLcmPol, { period: aprilPeriod })).toBe(2);
  });

  it("BA YSL Polanco: 2 (constanza, adriana)", async () => {
    expect(await getActiveClients(baYslPol, { period: aprilPeriod })).toBe(2);
  });

  it("Supervisor Centro (POL+STF): 5 únicas — excluye Perisur", async () => {
    // POL: constanza, ofelia, adriana. STF: karla, marina. = 5
    expect(
      await getActiveClients(supervisorCentro, { period: aprilPeriod }),
    ).toBe(5);
  });

  it("BA YSL Santa Fe: 0 (int-18/int-19 fuera de window)", async () => {
    expect(await getActiveClients(baYslStf, { period: aprilPeriod })).toBe(0);
  });

  it("activityDays=30: solo abril → 7 únicas", async () => {
    // [abr-1, may-1): int-1, int-2, int-8, int-13, int-14, int-15, int-21
    // → { constanza, ofelia, cristina, ines, karla, marina, gabriela } = 7
    expect(
      await getActiveClients(admin, { period: aprilPeriod }, { activityDays: 30 }),
    ).toBe(7);
  });

  it("intersección vacía → 0", async () => {
    expect(
      await getActiveClients(gerentePol, {
        period: aprilPeriod,
        storeIds: [ST_PER],
      }),
    ).toBe(0);
  });

  it("período sin actividad reciente → 0", async () => {
    expect(await getActiveClients(admin, { period: emptyPeriod })).toBe(0);
  });

  it("filtro baId restringe a las interactions del BA", async () => {
    // BA_POL_LCM_1 (Valentina) tiene int-1 (constanza) y int-3 (lorena 2026-05-02).
    // Pero int-3 está fuera del window [feb-1, may-1).
    expect(
      await getActiveClients(admin, {
        period: aprilPeriod,
        baId: baLcmPol.id,
      }),
    ).toBe(1);
  });
});
