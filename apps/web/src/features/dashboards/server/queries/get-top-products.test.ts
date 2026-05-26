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

// Abril 2026 — items con SKU en product seed:
//   LC-ABS-50  pu-1 + pu-5 + pu-9     = 3 units, $29,400
//   LC-GEN-50  pu-1 + pu-10           = 2 units, $12,800
//   YS-RPC-01  pu-7 (4×950)           = 4 units,  $3,800
//   YS-Y-60    pu-19 (1×2,950)        = 1 unit,   $2,950
//   YS-BO-50   pu-17 (1×2,650)        = 1 unit,   $2,650
//   YS-PSE-15  pu-18 (1×2,280)        = 1 unit,   $2,280
//   YS-TC-01   pu-17 (1×990)          = 1 unit,     $990
//   YS-LC-01   pu-18 (1×940)          = 1 unit,     $940
// SKUs en purchases pero NO en product (skip silencioso):
//   LC-HYB-30 (pu-3, pu-9), YS-LIB-50 (pu-2, pu-4, pu-12, pu-15)

describe("getTopProducts", () => {
  it("Admin abril top10: 8 productos ordenados por revenue", async () => {
    const r = await getTopProducts(admin, { period: aprilPeriod });
    expect(r).toHaveLength(8);
    expect(r[0]!.sku).toBe("LC-ABS-50");
    expect(r[0]!.revenue).toBe(29_400);
    expect(r[0]!.unitsSold).toBe(3);
    expect(r[0]!.brand).toBe("Lancôme");
    expect(r[1]!.sku).toBe("LC-GEN-50");
    expect(r[1]!.revenue).toBe(12_800);
    expect(r[1]!.unitsSold).toBe(2);
    expect(r[2]!.sku).toBe("YS-RPC-01");
    expect(r[2]!.revenue).toBe(3_800);
    expect(r[2]!.unitsSold).toBe(4);
  });

  it("orden por REVENUE no por unitsSold (YS-LC-01 está último por revenue)", async () => {
    const r = await getTopProducts(admin, { period: aprilPeriod });
    // YS-LC-01 940 es el revenue más bajo de los productos mapeados en abril.
    expect(r[r.length - 1]!.sku).toBe("YS-LC-01");
  });

  it("topN respetado", async () => {
    const r = await getTopProducts(admin, { period: aprilPeriod }, { topN: 2 });
    expect(r).toHaveLength(2);
    expect(r[0]!.sku).toBe("LC-ABS-50");
    expect(r[1]!.sku).toBe("LC-GEN-50");
  });

  it("SKUs no encontrados (Bug A) skip silencioso (LC-HYB-30, YS-LIB-50 ausentes)", async () => {
    const r = await getTopProducts(admin, { period: aprilPeriod });
    expect(r.find((x) => x.sku === "LC-HYB-30")).toBeUndefined();
    expect(r.find((x) => x.sku === "YS-LIB-50")).toBeUndefined();
  });

  it("BA Lancôme Polanco: solo POL × LCM (LC-ABS-50 + LC-GEN-50, LC-HYB-30 skip)", async () => {
    const r = await getTopProducts(baLcmPol, { period: aprilPeriod });
    expect(r.map((x) => x.sku).sort()).toEqual(["LC-ABS-50", "LC-GEN-50"]);
  });

  it("BA YSL Polanco abril: 0 (todas las purchases POL YSL en abril usan YS-LIB-50 skip)", async () => {
    const r = await getTopProducts(baYslPol, { period: aprilPeriod });
    expect(r).toEqual([]);
  });

  it("Gerente Polanco abril (ambas marcas): solo LC-ABS-50 + LC-GEN-50 (POL no tuvo YSL en abril)", async () => {
    const r = await getTopProducts(gerentePol, { period: aprilPeriod });
    expect(r.map((x) => x.sku).sort()).toEqual(["LC-ABS-50", "LC-GEN-50"]);
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
