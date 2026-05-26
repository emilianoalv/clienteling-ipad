import { describe, expect, it } from "vitest";
import { getEstimatedReplenishments } from "./get-estimated-replenishments";
import {
  admin,
  aprilPeriodLocal,
  baLcmPol,
  baYslPol,
  emptyPeriod,
} from "./_test-fixtures";

// Anchor = May 1 local.
//
// Last purchase per (client, sku) con SKU en product seed. El seed expandido
// añade muchas alertas; las más cercanas:
//   cl-gabriela  YS-LIB-90  pu-15 sep-10 2025 +240d = may-08 2026 (daysAway 7)
//   cl-elena     LC-ABS-50  pu-14 feb-10        +100d = may-21       (daysAway 20)
//   cl-julieta   YS-OR-100  pu-8  feb-22        +100d = jun-02       (daysAway 32)
//   cl-elena     LC-GEN-50  pu-6  mar-10        +90d  = jun-08       (daysAway 38)
//   cl-ofelia    LC-HZN-50  pu-3  abr-02        +75d  = jun-16       (daysAway 46)
//   ... etc.
// Total ventana 100d = 24 alertas. BA Lancôme Polanco (POL × LCM) ventana 100
// = 6 alertas (cl-ofelia LC-HZN-50, cl-andrea-pol LC-REN-50, cl-constanza × 2,
// cl-monica-pol × 2).

describe("getEstimatedReplenishments", () => {
  it("Admin default window=14: 1 alerta (cl-gabriela YS-LIB-90 may-08)", async () => {
    const r = await getEstimatedReplenishments(admin, { period: aprilPeriodLocal });
    expect(r).toHaveLength(1);
    expect(r[0]!.clientId).toBe("cl-gabriela");
    expect(r[0]!.sku).toBe("YS-LIB-90");
    expect(r[0]!.daysAway).toBe(7);
  });

  it("Admin window=30: cl-gabriela YS-LIB-90 (may-08) + cl-elena LC-ABS-50 (may-21)", async () => {
    const r = await getEstimatedReplenishments(
      admin,
      { period: aprilPeriodLocal },
      { windowDays: 30 },
    );
    expect(r).toHaveLength(2);
    expect(r[0]!.clientId).toBe("cl-gabriela");
    expect(r[0]!.sku).toBe("YS-LIB-90");
    expect(r[1]!.clientId).toBe("cl-elena");
    expect(r[1]!.sku).toBe("LC-ABS-50");
    expect(r[1]!.daysAway).toBe(20);
  });

  it("Admin window=100: 24 alertas (excluye SKUs sin product entry y los antes del anchor)", async () => {
    const r = await getEstimatedReplenishments(
      admin,
      { period: aprilPeriodLocal },
      { windowDays: 100 },
    );
    expect(r).toHaveLength(24);
    // Ordenado por daysAway → primero el más cercano (cl-gabriela may-08)
    expect(r[0]!.clientId).toBe("cl-gabriela");
    expect(r[0]!.sku).toBe("YS-LIB-90");
  });

  it("BA Lancôme Polanco window=100: 6 alerts (POL × LCM)", async () => {
    const r = await getEstimatedReplenishments(
      baLcmPol,
      { period: aprilPeriodLocal },
      { windowDays: 100 },
    );
    // cl-ofelia LC-HZN-50, cl-andrea-pol LC-REN-50, cl-constanza LC-GEN-50,
    // cl-monica-pol LC-GEN-50, cl-constanza LC-ABS-50, cl-monica-pol LC-ABS-50.
    expect(r).toHaveLength(6);
    expect(r.every((x) => ["cl-ofelia", "cl-andrea-pol", "cl-constanza", "cl-monica-pol"].includes(x.clientId))).toBe(true);
  });

  it("BA YSL Polanco window=100: 0 (todos los SKUs YSL faltan en product seed)", async () => {
    const r = await getEstimatedReplenishments(
      baYslPol,
      { period: aprilPeriodLocal },
      { windowDays: 100 },
    );
    expect(r).toEqual([]);
  });

  it("una clienta con la misma SKU comprada 2 veces: solo se considera la última", async () => {
    // cl-elena: pu-13 (LC-GEN-50 sep-15 2025) + pu-6 (LC-GEN-50 mar-10 2026)
    // La última (pu-6) genera la alerta, NO pu-13.
    const r = await getEstimatedReplenishments(
      admin,
      { period: aprilPeriodLocal },
      { windowDays: 100 },
    );
    const elenaGEN = r.filter(
      (x) => x.clientId === "cl-elena" && x.sku === "LC-GEN-50",
    );
    expect(elenaGEN).toHaveLength(1);
    // est = mar-10 + 90d = jun-08
    expect(elenaGEN[0]!.estimatedDate.getMonth()).toBe(5); // June
  });

  it("scope merge vacío → []", async () => {
    const r = await getEstimatedReplenishments(baLcmPol, {
      period: aprilPeriodLocal,
      brands: ["YSL"],
    });
    expect(r).toEqual([]);
  });

  it("período sin datos → []", async () => {
    const r = await getEstimatedReplenishments(admin, { period: emptyPeriod });
    expect(r).toEqual([]);
  });

  it("ordenado por daysAway ascendente", async () => {
    const r = await getEstimatedReplenishments(
      admin,
      { period: aprilPeriodLocal },
      { windowDays: 100 },
    );
    for (let i = 1; i < r.length; i++) {
      expect(r[i]!.daysAway).toBeGreaterThanOrEqual(r[i - 1]!.daysAway);
    }
  });
});
