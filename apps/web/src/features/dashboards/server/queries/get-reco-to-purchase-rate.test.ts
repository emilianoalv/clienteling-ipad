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
//   rc-1  cl-constanza  POL LCM 2026-04-21 converted (pu-1)
//   rc-3  cl-cristina   PER LCM 2026-04-25 converted (pu-5)
//   rc-5  cl-karla      STF LCM 2026-04-28 converted (pu-9)
//   rc-7  cl-rocio      STF YSL 2026-04-15 converted (pu-17)
//   rc-8  cl-gabriela   PER YSL 2026-04-22 converted (pu-18)
//   rc-9  cl-andrea-pol POL LCM 2026-04-02 pending
//   rc-10 cl-paloma-pol POL YSL 2026-04-19 converted (pu-21)
//   rc-12 cl-yolanda-per PER YSL 2026-04-30 converted (pu-25)
//   rc-13 cl-laura-stf  STF LCM 2026-04-27 converted (pu-28)
// → 9 recs creadas; 8 convertidas; rate global = 8/9.

const marchPeriod = {
  from: new Date("2026-03-01T00:00:00.000Z"),
  to: new Date("2026-04-01T00:00:00.000Z"),
};

describe("getRecoToPurchaseRate", () => {
  it("Admin abril: 9 recs creadas, 8 convertidas → 8/9", async () => {
    expect(await getRecoToPurchaseRate(admin, { period: aprilPeriod })).toBeCloseTo(8 / 9);
  });

  it("Admin marzo: 2 recs creadas (rc-2 + rc-4), 1 convertida (rc-2) → 0.5", async () => {
    expect(await getRecoToPurchaseRate(admin, { period: marchPeriod })).toBe(0.5);
  });

  it("BA Lancôme Polanco abril: rc-1 (conv) + rc-9 (pending) → 1/2 = 0.5", async () => {
    expect(await getRecoToPurchaseRate(baLcmPol, { period: aprilPeriod })).toBe(0.5);
  });

  it("BA YSL Polanco abril: rc-10 conv → 1/1 = 1.0", async () => {
    expect(await getRecoToPurchaseRate(baYslPol, { period: aprilPeriod })).toBe(1);
  });

  it("Supervisor Centro abril excluye Perisur: 6 recs (POL+STF), 5 convertidas → 5/6", async () => {
    expect(
      await getRecoToPurchaseRate(supervisorCentro, { period: aprilPeriod }),
    ).toBeCloseTo(5 / 6);
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
