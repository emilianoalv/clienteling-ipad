import { describe, expect, it } from "vitest";
import { RoleNotPermittedError } from "../errors";
import { getCounterAverages } from "./get-counter-averages";
import {
  admin,
  aprilPeriod,
  baYslAlone,
  baLcmPol,
  baLcmPol2,
  baLcmStf,
  baLcmStf2,
  baYslPol,
  emptyPeriod,
  gerentePol,
  supervisorCentro,
} from "./_test-fixtures";

// Reference (abril 2026):
//
// POL × LCM peers seen from Valentina (= Fernanda):
//   purchases: pu-3 12,100 + pu-20 8,950 + pu-23 3,250 = 24,300 / 3 = 8,100
//   recs:    rc-9 (pending) → 0/1
//   samples: sp-1 (not converted) + sp-15 (conv via pu-23) → 1/2 = 0.5
//   followups: none in abril by Fernanda → 0
//
// POL × LCM peers seen from Fernanda (= Valentina):
//   purchases: pu-1 16,200 → avgTicket=16,200
//   recs:    rc-1 in abril, converted via pu-1 → 1/1 = 1.0
//   samples: sp-2 abr-12, converted via pu-1 → 1/1 = 1.0
//   followups: ft-06 → int-1 in window 30d → 1/1 = 1.0
//
// STF × LCM peers seen from Renata (= Ximena):
//   purchases: pu-10 6,400 + pu-28 9,560 = 15,960 / 2 = 7,980
//   followups: ft-08 → int-20 (Renata, same counter, in window) → 1/1 = 1.0
//
// STF × LCM peers seen from Ximena (= Renata):
//   purchases: pu-9 21,900 + pu-31 2,490 = 24,390 / 2 = 12,195

describe("getCounterAverages", () => {
  it("Valentina ve a su única peer Fernanda en POL LCM abril", async () => {
    const a = await getCounterAverages(baLcmPol, { period: aprilPeriod });
    expect(a.counterHasPeers).toBe(true);
    expect(a.avgTicket).toBe(8_100); // 24,300 / 3
    expect(a.avgReco2PurchaseRate).toBe(0); // rc-9 pending
    expect(a.avgSample2PurchaseRate).toBe(0.5); // sp-1 not conv + sp-15 conv
    expect(a.avgFollowUp2RevisitRate).toBe(0);
  });

  it("Fernanda ve a su peer Valentina (alto desempeño en abril)", async () => {
    const a = await getCounterAverages(baLcmPol2, { period: aprilPeriod });
    expect(a.counterHasPeers).toBe(true);
    expect(a.avgTicket).toBe(16_200);
    expect(a.avgReco2PurchaseRate).toBe(1);
    // Valentina samples abril: sp-2 (converted) + sp-13 (no) → 1/2 = 0.5
    expect(a.avgSample2PurchaseRate).toBe(0.5);
    expect(a.avgFollowUp2RevisitRate).toBe(1);
  });

  it("Renata ve a su peer Ximena en STF LCM abril", async () => {
    const a = await getCounterAverages(baLcmStf, { period: aprilPeriod });
    expect(a.counterHasPeers).toBe(true);
    expect(a.avgTicket).toBe(7_980); // (6400 + 9560) / 2
    expect(a.avgFollowUp2RevisitRate).toBe(1); // ft-08 (Ximena) + int-20 (Renata mismo counter)
  });

  it("Ximena ve a Renata (otra peer del counter STF LCM)", async () => {
    const a = await getCounterAverages(baLcmStf2, { period: aprilPeriod });
    expect(a.counterHasPeers).toBe(true);
    expect(a.avgTicket).toBe(12_195); // (21900 + 2490) / 2
  });

  it("Counter con 1 BA (tienda sintética): counterHasPeers=false, todos 0", async () => {
    const a = await getCounterAverages(baYslAlone, { period: aprilPeriod });
    expect(a.counterHasPeers).toBe(false);
    expect(a.avgTicket).toBe(0);
    expect(a.avgReco2PurchaseRate).toBe(0);
    expect(a.avgSample2PurchaseRate).toBe(0);
    expect(a.avgFollowUp2RevisitRate).toBe(0);
  });

  it("intersección vacía: counterHasPeers=true (peers existen), averages en 0", async () => {
    const a = await getCounterAverages(baLcmPol, {
      period: aprilPeriod,
      brands: ["YSL"], // BA LCM filtra por YSL → intersección vacía
    });
    expect(a.counterHasPeers).toBe(true);
    expect(a.avgTicket).toBe(0);
  });

  it("período sin compras: averages en 0 (denominadores vacíos)", async () => {
    const a = await getCounterAverages(baLcmPol, { period: emptyPeriod });
    expect(a.counterHasPeers).toBe(true);
    expect(a.avgTicket).toBe(0);
    expect(a.avgReco2PurchaseRate).toBe(0);
    expect(a.avgSample2PurchaseRate).toBe(0);
    expect(a.avgFollowUp2RevisitRate).toBe(0);
  });

  it("POL YSL Daniela: peer Sofía con pu-21 → avgTicket 5,110 (counterHasPeers=true)", async () => {
    const a = await getCounterAverages(baYslPol, { period: aprilPeriod });
    expect(a.counterHasPeers).toBe(true);
    expect(a.avgTicket).toBe(5_110);
  });

  it("rol Gerente → RoleNotPermittedError", async () => {
    await expect(
      getCounterAverages(gerentePol, { period: aprilPeriod }),
    ).rejects.toBeInstanceOf(RoleNotPermittedError);
  });

  it("rol Supervisor → RoleNotPermittedError", async () => {
    await expect(
      getCounterAverages(supervisorCentro, { period: aprilPeriod }),
    ).rejects.toBeInstanceOf(RoleNotPermittedError);
  });

  it("rol Admin → RoleNotPermittedError", async () => {
    await expect(
      getCounterAverages(admin, { period: aprilPeriod }),
    ).rejects.toBeInstanceOf(RoleNotPermittedError);
  });
});
