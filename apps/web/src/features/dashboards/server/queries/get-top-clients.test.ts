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

// Reference (abril 2026, seed expandido = 17 clientas activas):
//   cl-karla       24,850 (pu-9 + pu-19) + int-14
//   cl-constanza   16,200 (pu-1) + int-1
//   cl-ofelia      12,100 (pu-3) + int-2
//   cl-cristina     9,800 (pu-5) + int-8
//   cl-laura-stf    9,560 (pu-28)
//   cl-monica-pol   8,950 (pu-20)
//   cl-yolanda-per  8,770 (pu-25)
//   cl-marina       6,400 (pu-10) + int-15
//   cl-paloma-pol   5,110 (pu-21)
//   cl-veronica-per 4,120 (pu-27)
//   ... y más

describe("getTopClients", () => {
  it("Admin abril topN=10: 10 clientas top, orden por totalSpent desc", async () => {
    const r = await getTopClients(admin, { period: aprilPeriod });
    expect(r).toHaveLength(10);
    expect(r[0]!.clientId).toBe("cl-karla");
    expect(r[0]!.totalSpent).toBe(24_850);
    expect(r[1]!.clientId).toBe("cl-constanza");
    expect(r[1]!.totalSpent).toBe(16_200);
    expect(r[2]!.clientId).toBe("cl-ofelia");
    expect(r[2]!.totalSpent).toBe(12_100);
  });

  it("topN respetado (topN=3 → solo 3 entradas)", async () => {
    const r = await getTopClients(admin, { period: aprilPeriod }, { topN: 3 });
    expect(r).toHaveLength(3);
    expect(r[2]!.clientId).toBe("cl-ofelia"); // tercera por totalSpent
  });

  it("visitsCount cuenta SOLO presenciales (whatsapp excluido)", async () => {
    // cl-gabriela queda fuera del top 10 con el seed expandido; pedimos topN
    // grande para garantizar que aparezca.
    const r = await getTopClients(admin, { period: aprilPeriod }, { topN: 20 });
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

  it("BA Lancôme Polanco: 4 clientas POL × LCM en abril", async () => {
    const r = await getTopClients(baLcmPol, { period: aprilPeriod });
    expect(r).toHaveLength(4);
    expect(r.map((x) => x.clientId).sort()).toEqual([
      "cl-andrea-pol",
      "cl-constanza",
      "cl-monica-pol",
      "cl-ofelia",
    ]);
  });

  it("BA YSL Polanco: cl-paloma-pol (pu-21) en abril", async () => {
    const r = await getTopClients(baYslPol, { period: aprilPeriod });
    expect(r).toHaveLength(1);
    expect(r[0]!.clientId).toBe("cl-paloma-pol");
  });

  it("Gerente Polanco abril: 5 clientas POL (LCM + YSL)", async () => {
    const r = await getTopClients(gerentePol, { period: aprilPeriod });
    expect(r).toHaveLength(5);
  });

  it("Supervisor Centro (POL + STF) abril excluye Perisur: 10 clientas (topN default)", async () => {
    const r = await getTopClients(supervisorCentro, { period: aprilPeriod });
    // POL: cl-constanza, cl-ofelia, cl-monica-pol, cl-paloma-pol, cl-andrea-pol = 5
    // STF: cl-karla, cl-marina, cl-rocio, cl-laura-stf, cl-luisa-stf, cl-tatiana-stf = 6
    // Total = 11. topN default = 10.
    expect(r).toHaveLength(10);
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
