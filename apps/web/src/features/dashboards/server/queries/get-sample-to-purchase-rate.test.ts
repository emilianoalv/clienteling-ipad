import { describe, expect, it } from "vitest";
import { getSampleToPurchaseRate } from "./get-sample-to-purchase-rate";
import {
  admin,
  aprilPeriod,
  baLcmPol,
  baYslPol,
  emptyPeriod,
  gerentePol,
  gerenteStf,
  ST_PER,
  supervisorCentro,
} from "./_test-fixtures";

// Reference seed (abril 2026):
//   sp-1  cl-ofelia      POL LCM givenAt 2026-04-08  no converted
//   sp-2  cl-constanza   POL LCM givenAt 2026-04-12  converted (pu-1)
//   sp-4  cl-cristina    PER LCM givenAt 2026-04-18  converted (pu-5)
//   sp-7  cl-karla       STF LCM givenAt 2026-04-20  converted (pu-9)
//   sp-11 cl-karla       STF YSL givenAt 2026-04-29  converted (pu-19)
//   sp-13 cl-mariana-pol POL LCM givenAt 2026-04-08  no converted
//   sp-14 cl-paloma-pol  POL YSL givenAt 2026-04-19  converted (pu-21)
//   sp-15 cl-andrea-pol  POL LCM givenAt 2026-04-02  converted (pu-23)
//   sp-18 cl-yolanda-per PER YSL givenAt 2026-04-30  converted (pu-25)
//   sp-20 cl-laura-stf   STF LCM givenAt 2026-04-27  converted (pu-28)
//   → 10 entregadas en abril, 8 convertidas en abril.

describe("getSampleToPurchaseRate", () => {
  it("Admin abril: 10 samples entregadas, 8 convertidas → 0.8", async () => {
    expect(await getSampleToPurchaseRate(admin, { period: aprilPeriod })).toBe(0.8);
  });

  it("BA Lancôme Polanco abril: sp-1, sp-2, sp-13, sp-15 → 2/4 = 0.5", async () => {
    expect(await getSampleToPurchaseRate(baLcmPol, { period: aprilPeriod })).toBe(0.5);
  });

  it("BA YSL Polanco abril: sp-14 → 1/1 = 1.0", async () => {
    expect(await getSampleToPurchaseRate(baYslPol, { period: aprilPeriod })).toBe(1);
  });

  it("Supervisor Centro abril (POL+STF): 8 entregadas, 6 convertidas → 0.75", async () => {
    expect(
      await getSampleToPurchaseRate(supervisorCentro, { period: aprilPeriod }),
    ).toBe(0.75);
  });

  it("Gerente Santa Fe abril: sp-7, sp-11, sp-20 → 3/3 = 1.0", async () => {
    expect(
      await getSampleToPurchaseRate(gerenteStf, { period: aprilPeriod }),
    ).toBe(1);
  });

  it("intersección vacía → 0", async () => {
    expect(
      await getSampleToPurchaseRate(gerentePol, {
        period: aprilPeriod,
        storeIds: [ST_PER],
      }),
    ).toBe(0);
  });

  it("período sin samples → 0", async () => {
    expect(await getSampleToPurchaseRate(admin, { period: emptyPeriod })).toBe(0);
  });

  it("filtro baId restringe", async () => {
    // baId = Valentina (BA_POL_LCM_1): sp-2 (converted) + sp-13 (no) → 0.5
    expect(
      await getSampleToPurchaseRate(gerentePol, {
        period: aprilPeriod,
        baId: baLcmPol.id,
      }),
    ).toBe(0.5);
  });
});
