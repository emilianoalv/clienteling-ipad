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
// Last purchase per (client, sku) with SKU in product seed
// (Bug A: YS-LIB-50, LC-HYB-30 are NOT in product seed → skipped):
//   cl-constanza LC-ABS-50  pu-1  abr-21 → +100d = ago-09
//   cl-constanza LC-GEN-50  pu-1  abr-21 → +90d  = jul-20
//   cl-cristina  LC-ABS-50  pu-5  abr-25 → +100d = ago-03
//   cl-elena     LC-GEN-50  pu-6  mar-10 → +90d  = jun-08
//   cl-elena     LC-ABS-50  pu-14 feb-10 → +100d = may-21
//   cl-gabriela  YS-LC-01   pu-18 abr-22 → +90d  = jul-21
//   cl-gabriela  YS-PSE-15  pu-18 abr-22 → +90d  = jul-21
//   cl-ines      YS-RPC-01  pu-7  abr-12 → +240d = dec-08
//   cl-julieta   YS-OR-100  pu-8  feb-22 → +100d = jun-02
//   cl-karla     LC-ABS-50  pu-9  abr-28 → +100d = ago-06
//   cl-karla     YS-Y-60    pu-19 abr-29 → +180d ← FUERA de window=100
//   cl-marina    LC-GEN-50  pu-10 abr-18 → +90d  = jul-17
//   cl-nadia     YS-OR-100  pu-11 dic-10 → +100d = mar-20 ← BEFORE anchor
//   cl-rocio     YS-BO-50   pu-17 abr-15 → +180d ← FUERA de window=100
//   cl-rocio     YS-TC-01   pu-17 abr-15 → +200d ← FUERA de window=100

describe("getEstimatedReplenishments", () => {
  it("Admin default window=14: ninguno (más cercano = may-21)", async () => {
    const r = await getEstimatedReplenishments(admin, { period: aprilPeriodLocal });
    expect(r).toEqual([]);
  });

  it("Admin window=30: solo cl-elena LC-ABS-50 (may-21)", async () => {
    const r = await getEstimatedReplenishments(
      admin,
      { period: aprilPeriodLocal },
      { windowDays: 30 },
    );
    expect(r).toHaveLength(1);
    expect(r[0]!.clientId).toBe("cl-elena");
    expect(r[0]!.sku).toBe("LC-ABS-50");
    expect(r[0]!.daysAway).toBe(20); // may-21 - may-1 = 20
  });

  it("Admin window=100: 10 alertas (excluye SKUs sin product entry y los antes del anchor)", async () => {
    const r = await getEstimatedReplenishments(
      admin,
      { period: aprilPeriodLocal },
      { windowDays: 100 },
    );
    expect(r).toHaveLength(10);
    // Ordenado por daysAway → primero el más cercano (cl-elena may-21)
    expect(r[0]!.clientId).toBe("cl-elena");
    expect(r[0]!.sku).toBe("LC-ABS-50");
  });

  it("BA Lancôme Polanco window=100: 2 alerts (cl-constanza × 2 SKUs)", async () => {
    const r = await getEstimatedReplenishments(
      baLcmPol,
      { period: aprilPeriodLocal },
      { windowDays: 100 },
    );
    expect(r).toHaveLength(2);
    expect(r.every((x) => x.clientId === "cl-constanza")).toBe(true);
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
