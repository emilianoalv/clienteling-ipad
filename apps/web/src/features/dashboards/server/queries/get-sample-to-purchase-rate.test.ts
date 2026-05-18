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
//   sp-1 cl-ofelia    POL LCM givenAt 2026-04-08  no converted
//   sp-2 cl-constanza POL LCM givenAt 2026-04-12  converted (pu-1 abr-21)
//   sp-4 cl-cristina  PER LCM givenAt 2026-04-18  converted (pu-5 abr-25)
//   sp-7 cl-karla     STF LCM givenAt 2026-04-20  converted (pu-9 abr-28)
//   → denom=4, num=3, tasa=0.75 globally.

describe("getSampleToPurchaseRate", () => {
  it("Admin abril: 4 samples entregadas, 3 convertidas → 0.75", async () => {
    expect(await getSampleToPurchaseRate(admin, { period: aprilPeriod })).toBe(0.75);
  });

  it("BA Lancôme Polanco abril: sp-1 + sp-2, solo sp-2 convirtió → 0.5", async () => {
    expect(await getSampleToPurchaseRate(baLcmPol, { period: aprilPeriod })).toBe(0.5);
  });

  it("BA YSL Polanco abril: 0 samples entregadas → 0 (denominador 0)", async () => {
    expect(await getSampleToPurchaseRate(baYslPol, { period: aprilPeriod })).toBe(0);
  });

  it("Supervisor Centro abril (POL+STF): 3 entregadas, 2 convertidas → 2/3", async () => {
    expect(
      await getSampleToPurchaseRate(supervisorCentro, { period: aprilPeriod }),
    ).toBeCloseTo(2 / 3, 5);
  });

  it("Gerente Santa Fe abril: sp-7 entregada y convertida → 1.0", async () => {
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
    // baId = Valentina (BA_POL_LCM_1): sp-2 sola — entregada y convertida
    expect(
      await getSampleToPurchaseRate(gerentePol, {
        period: aprilPeriod,
        baId: baLcmPol.id,
      }),
    ).toBe(1);
  });
});
