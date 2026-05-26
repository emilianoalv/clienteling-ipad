import { describe, expect, it } from "vitest";
import { getTopClients } from "./get-top-clients";
import {
  admin,
  aprilPeriod,
  baLcmPol,
  baYslPol,
  emptyPeriod,
  gerentePol,
  supervisorCentro,
} from "./_test-fixtures";

// Reference (abril 2026):
//   cl-karla     STF · multi · 24,850 (pu-9 21,900 + pu-19 2,950) + int-14
//   cl-constanza POL · LCM · 16,200  (pu-1)    + int-1  purchase abr-21
//   cl-ofelia    POL · LCM · 12,100  (pu-3)    + int-2  sample   abr-08
//   cl-cristina  PER · LCM ·  9,800  (pu-5)    + int-8  purchase abr-25
//   cl-marina    STF · LCM ·  6,400  (pu-10)   + int-15 consult  abr-18
//   cl-ines      PER · YSL ·  3,800  (pu-7)    + int-13 purchase abr-12
//   cl-rocio     STF · YSL ·  3,640  (pu-17)   — sin interaction abr
//   cl-gabriela  PER · YSL ·  3,220  (pu-18)   + int-21 whatsapp abr-25
// = 8 clientas con actividad en abril.

describe("getTopClients", () => {
  it("Admin abril topN=10: 8 clientas, orden por totalSpent desc", async () => {
    const r = await getTopClients(admin, { period: aprilPeriod });
    expect(r).toHaveLength(8);
    expect(r[0]!.clientId).toBe("cl-karla");
    expect(r[0]!.totalSpent).toBe(24_850);
    expect(r[1]!.clientId).toBe("cl-constanza");
    expect(r[1]!.totalSpent).toBe(16_200);
  });

  it("topN respetado (topN=3 → solo 3 entradas)", async () => {
    const r = await getTopClients(admin, { period: aprilPeriod }, { topN: 3 });
    expect(r).toHaveLength(3);
    expect(r[2]!.clientId).toBe("cl-ofelia"); // tercera por totalSpent
  });

  it("visitsCount cuenta SOLO presenciales (whatsapp excluido)", async () => {
    const r = await getTopClients(admin, { period: aprilPeriod });
    const gabriela = r.find((x) => x.clientId === "cl-gabriela");
    expect(gabriela).toBeDefined();
    expect(gabriela!.visitsCount).toBe(0); // solo tiene int-21 whatsapp (no presencial)
    expect(gabriela!.totalSpent).toBe(3_220); // pu-18 abr-22 (purchase sin interaction)
    expect(gabriela!.lastVisitDate).not.toBeNull(); // int-21 abr-25
  });

  it("lastVisitDate es la última interaction (cualquier kind)", async () => {
    const r = await getTopClients(admin, { period: aprilPeriod });
    const karla = r.find((x) => x.clientId === "cl-karla");
    expect(karla!.lastVisitDate?.toISOString()).toBe("2026-04-28T16:00:00.000Z");
  });

  it("BA Lancôme Polanco: solo cl-constanza y cl-ofelia (POL × LCM en abril)", async () => {
    const r = await getTopClients(baLcmPol, { period: aprilPeriod });
    expect(r).toHaveLength(2);
    expect(r.map((x) => x.clientId).sort()).toEqual(["cl-constanza", "cl-ofelia"]);
  });

  it("BA YSL Polanco: 0 clientas con actividad POL × YSL en abril", async () => {
    const r = await getTopClients(baYslPol, { period: aprilPeriod });
    expect(r).toEqual([]);
  });

  it("Gerente Polanco abril: cl-constanza + cl-ofelia (no hay YSL POL en abril)", async () => {
    const r = await getTopClients(gerentePol, { period: aprilPeriod });
    expect(r).toHaveLength(2);
  });

  it("Supervisor Centro (POL + STF) abril excluye Perisur: 5 clientas", async () => {
    const r = await getTopClients(supervisorCentro, { period: aprilPeriod });
    // POL: cl-constanza, cl-ofelia. STF: cl-karla, cl-marina, cl-rocio. = 5
    expect(r).toHaveLength(5);
    expect(r[0]!.clientId).toBe("cl-karla"); // top
  });

  it("scope merge vacío → []", async () => {
    const r = await getTopClients(baLcmPol, {
      period: aprilPeriod,
      brands: ["YSL"],
    });
    expect(r).toEqual([]);
  });

  it("período sin actividad → []", async () => {
    const r = await getTopClients(admin, { period: emptyPeriod });
    expect(r).toEqual([]);
  });

  it("Opción A: cl-constanza multi-brand aparece en AMBOS BAs del store con totalSpent distinto por brand scope", async () => {
    // Período [mar-1, may-1) — cl-constanza tiene pu-1 LCM (abr-21) y pu-2 YSL (mar-12).
    const periodWider = {
      from: new Date("2026-03-01T00:00:00.000Z"),
      to: new Date("2026-05-01T00:00:00.000Z"),
    };
    const lcm = await getTopClients(baLcmPol, { period: periodWider });
    const ysl = await getTopClients(baYslPol, { period: periodWider });
    const constanzaLcm = lcm.find((x) => x.clientId === "cl-constanza");
    const constanzaYsl = ysl.find((x) => x.clientId === "cl-constanza");
    expect(constanzaLcm?.totalSpent).toBe(16_200); // solo pu-1 LCM
    expect(constanzaYsl?.totalSpent).toBe(8_900); // solo pu-2 YSL
  });

  it("filtro baId restringe a un solo BA", async () => {
    // Solo Valentina (BA_POL_LCM_1): pu-1 16,200 + int-1 → 1 clienta cl-constanza
    const r = await getTopClients(admin, {
      period: aprilPeriod,
      baId: baLcmPol.id,
    });
    expect(r).toHaveLength(1);
    expect(r[0]!.clientId).toBe("cl-constanza");
    expect(r[0]!.totalSpent).toBe(16_200);
  });
});
