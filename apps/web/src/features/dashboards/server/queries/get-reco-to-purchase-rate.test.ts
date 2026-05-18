import { describe, expect, it } from "vitest";
import { getRecoToPurchaseRate } from "./get-reco-to-purchase-rate";
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

// Reference seed (abril 2026):
//   rc-1 cl-constanza POL LCM 2026-04-21 converted (pu-1 abr-21)
//   rc-3 cl-cristina  PER LCM 2026-04-25 converted (pu-5 abr-25)
//   rc-5 cl-karla     STF LCM 2026-04-28 converted (pu-9 abr-28)
// All 3 recs are LCM and all 3 convert inside April → tasa = 1.0 globally.

const marchPeriod = {
  from: new Date("2026-03-01T00:00:00.000Z"),
  to: new Date("2026-04-01T00:00:00.000Z"),
};

describe("getRecoToPurchaseRate", () => {
  it("Admin abril: 3 recs creadas, 3 convertidas → 1.0", async () => {
    expect(await getRecoToPurchaseRate(admin, { period: aprilPeriod })).toBe(1);
  });

  it("Admin marzo: 2 recs creadas (rc-2 + rc-4), 1 convertida (rc-2) → 0.5", async () => {
    expect(await getRecoToPurchaseRate(admin, { period: marchPeriod })).toBe(0.5);
  });

  it("BA Lancôme Polanco abril: solo rc-1 → 1/1 = 1.0", async () => {
    expect(await getRecoToPurchaseRate(baLcmPol, { period: aprilPeriod })).toBe(1);
  });

  it("BA YSL Polanco abril: 0 recs creadas → 0 (denominador 0)", async () => {
    expect(await getRecoToPurchaseRate(baYslPol, { period: aprilPeriod })).toBe(0);
  });

  it("Supervisor Centro abril excluye Perisur (rc-3 fuera): 2/2 = 1.0", async () => {
    expect(
      await getRecoToPurchaseRate(supervisorCentro, { period: aprilPeriod }),
    ).toBe(1);
  });

  it("intersección vacía → 0", async () => {
    expect(
      await getRecoToPurchaseRate(gerentePol, {
        period: aprilPeriod,
        storeIds: [ST_PER],
      }),
    ).toBe(0);
  });

  it("período sin recs → 0", async () => {
    expect(await getRecoToPurchaseRate(admin, { period: emptyPeriod })).toBe(0);
  });

  it("filtro baId restringe", async () => {
    // baId = Valentina (BA_POL_LCM_1): rc-1 (creada y convertida en abril)
    expect(
      await getRecoToPurchaseRate(gerentePol, {
        period: aprilPeriod,
        baId: baLcmPol.id,
      }),
    ).toBe(1);
  });
});
