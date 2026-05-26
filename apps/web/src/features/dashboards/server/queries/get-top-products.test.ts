import { describe, expect, it } from "vitest";
import { getTopProducts } from "./get-top-products";
import {
  admin,
  aprilPeriod,
  baLcmPol,
  baYslPol,
  emptyPeriod,
  gerentePol,
} from "./_test-fixtures";

// Abril 2026 — items con SKU en product seed (14 SKUs distintos):
//   LC-ABS-50   5 units  $42,800
//   LC-HZN-50   4 units  $27,300
//   LC-GEN-50   3 units  $15,050
//   YS-LIB-90   2 units   $8,240
//   YS-OR-100   1 unit    $6,490
//   YS-PSE-15   2 units   $4,560
//   YS-RPC-01   4 units   $3,800
//   LC-REN-50   1 unit    $3,250
//   YS-TC-01    3 units   $2,970
//   YS-Y-60     1 unit    $2,950
//   LC-AEC-20   1 unit    $2,860
//   YS-BO-50    1 unit    $2,650
//   YS-LC-01    2 units   $1,880
//   YS-TCL-02   1 unit    $1,180

describe("getTopProducts", () => {
  it("Admin abril top10: 10 productos ordenados por revenue (14 totales)", async () => {
    const r = await getTopProducts(admin, { period: aprilPeriod });
    expect(r).toHaveLength(10);
    expect(r[0]!.sku).toBe("LC-ABS-50");
    expect(r[0]!.revenue).toBe(42_800);
    expect(r[0]!.unitsSold).toBe(5);
    expect(r[0]!.brand).toBe("Lancôme");
    expect(r[1]!.sku).toBe("LC-HZN-50");
    expect(r[1]!.revenue).toBe(27_300);
    expect(r[2]!.sku).toBe("LC-GEN-50");
    expect(r[2]!.revenue).toBe(15_050);
  });

  it("Admin abril topN=14: el último por revenue es YS-TCL-02", async () => {
    const r = await getTopProducts(admin, { period: aprilPeriod }, { topN: 14 });
    expect(r).toHaveLength(14);
    expect(r[r.length - 1]!.sku).toBe("YS-TCL-02");
  });

  it("topN respetado", async () => {
    const r = await getTopProducts(admin, { period: aprilPeriod }, { topN: 2 });
    expect(r).toHaveLength(2);
    expect(r[0]!.sku).toBe("LC-ABS-50");
    expect(r[1]!.sku).toBe("LC-HZN-50");
  });

  it("SKUs no encontrados en product repo (Bug A) skip silencioso", async () => {
    // El seed limpió los SKUs huérfanos. Igual verificamos que SKUs
    // sintéticos no aparezcan en el resultado.
    const r = await getTopProducts(admin, { period: aprilPeriod });
    expect(r.find((x) => x.sku === "LC-HYB-30")).toBeUndefined();
    expect(r.find((x) => x.sku === "YS-LIB-50")).toBeUndefined();
  });

  it("BA Lancôme Polanco: 4 SKUs POL × LCM ordenados por revenue", async () => {
    const r = await getTopProducts(baLcmPol, { period: aprilPeriod });
    expect(r.map((x) => x.sku)).toEqual([
      "LC-ABS-50",  // 16,500
      "LC-HZN-50",  // 12,100
      "LC-GEN-50",  //  8,650
      "LC-REN-50",  //  3,250
    ]);
  });

  it("BA YSL Polanco abril: pu-21 = YS-LIB-90 + YS-TC-01", async () => {
    const r = await getTopProducts(baYslPol, { period: aprilPeriod });
    expect(r.map((x) => x.sku)).toEqual(["YS-LIB-90", "YS-TC-01"]);
  });

  it("Gerente Polanco abril (ambas marcas): 6 SKUs (4 LCM + 2 YSL)", async () => {
    const r = await getTopProducts(gerentePol, { period: aprilPeriod });
    expect(r.map((x) => x.sku).sort()).toEqual([
      "LC-ABS-50",
      "LC-GEN-50",
      "LC-HZN-50",
      "LC-REN-50",
      "YS-LIB-90",
      "YS-TC-01",
    ]);
  });

  it("scope merge vacío → []", async () => {
    const r = await getTopProducts(baLcmPol, {
      period: aprilPeriod,
      brands: ["YSL"],
    });
    expect(r).toEqual([]);
  });

  it("período sin compras → []", async () => {
    const r = await getTopProducts(admin, { period: emptyPeriod });
    expect(r).toEqual([]);
  });

  it("filtro baId: solo lo que vendió ese BA", async () => {
    // Valentina (BA_POL_LCM_1) tiene pu-1: LC-ABS-50 + LC-GEN-50
    const r = await getTopProducts(admin, {
      period: aprilPeriod,
      baId: baLcmPol.id,
    });
    expect(r).toHaveLength(2);
    expect(r[0]!.revenue).toBe(9_800); // LC-ABS-50 (1 unit)
  });
});
