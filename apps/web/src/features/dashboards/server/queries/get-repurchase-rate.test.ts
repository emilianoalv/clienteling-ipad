import { describe, expect, it } from "vitest";
import { getRepurchaseRate } from "./get-repurchase-rate";
import {
  admin,
  aprilPeriod,
  baLcmPol,
  baYslPol,
  emptyPeriod,
  gerentePer,
  supervisorCentro,
} from "./_test-fixtures";

// Anchor = aprilPeriod.to = 2026-05-01. Defaults: cohort=6mo, lookback=6mo.
//   Cohort   window: [2025-05-01, 2025-11-01)
//   Lookback window: [2025-11-01, 2026-05-01)
//
// Cohort clientas (purchases in cohort window):
//   - cl-elena    via pu-13 (2025-09-15 PER LCM)
//   - cl-gabriela via pu-15 (2025-09-10 PER YSL)
//   - cl-constanza via pu-16 (2025-08-15 POL LCM)
// Repurchased in lookback:
//   - cl-elena    via pu-14 / pu-6 → YES
//   - cl-constanza via pu-1 / pu-2 → YES
//   - cl-gabriela: no further purchases → NO
// Tasa Admin = (2/3) × 100 = 66.7

describe("getRepurchaseRate", () => {
  it("Admin default 6+6: 2 de 3 cohort → 66.7", async () => {
    expect(await getRepurchaseRate(admin, { period: aprilPeriod })).toBe(66.7);
  });

  it("BA Lancôme Polanco: cl-constanza única en cohort, repurchase → 100.0", async () => {
    expect(await getRepurchaseRate(baLcmPol, { period: aprilPeriod })).toBe(100);
  });

  it("BA YSL Polanco: 0 en cohort → 0 (denominador 0)", async () => {
    expect(await getRepurchaseRate(baYslPol, { period: aprilPeriod })).toBe(0);
  });

  it("Gerente Perisur: cl-elena (sí) + cl-gabriela (no) → 50.0", async () => {
    expect(await getRepurchaseRate(gerentePer, { period: aprilPeriod })).toBe(50);
  });

  it("Supervisor Centro (POL+STF) excluye Perisur: 1/1 → 100.0", async () => {
    expect(
      await getRepurchaseRate(supervisorCentro, { period: aprilPeriod }),
    ).toBe(100);
  });

  it("intersección vacía → 0", async () => {
    expect(
      await getRepurchaseRate(baLcmPol, {
        period: aprilPeriod,
        brands: ["YSL"],
      }),
    ).toBe(0);
  });

  it("período sin cohort → 0", async () => {
    expect(await getRepurchaseRate(admin, { period: emptyPeriod })).toBe(0);
  });

  it("opts custom (cohort=2, lookback=2): cohort = {rocio, julieta, elena}; repurchased = {elena} → 33.3", async () => {
    expect(
      await getRepurchaseRate(
        admin,
        { period: aprilPeriod },
        { cohortWindowMonths: 2, lookbackMonths: 2 },
      ),
    ).toBe(33.3);
  });

  it("filtro baId restringe el cohort y repurchase a un solo BA", async () => {
    // Valentina (BA_POL_LCM_1) tiene pu-16 (cohort) + pu-1 (repurchase) de cl-constanza
    expect(
      await getRepurchaseRate(admin, {
        period: aprilPeriod,
        baId: baLcmPol.id,
      }),
    ).toBe(100);
  });
});
