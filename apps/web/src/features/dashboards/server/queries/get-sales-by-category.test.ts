import { describe, expect, it } from "vitest";
import { getSalesByCategory } from "./get-sales-by-category";
import {
  admin,
  aprilPeriod,
  baLcmPol,
  baYslPol,
  emptyPeriod,
  gerentePol,
} from "./_test-fixtures";

// Abril 2026 expected breakdown (Admin):
//   Skincare: LC-ABS-50 42,800 + LC-HZN-50 27,300 + LC-GEN-50 15,050
//             + LC-REN-50 3,250 + LC-AEC-20 2,860 (todos Sérum/Crema)
//             + YS-OR-100 6,490 (Sérum) + YS-PSE-15 4,560 (Crema)
//             = 102,310
//   Makeup:   YS-RPC-01 3,800 + YS-TC-01 2,970 + YS-TCL-02 1,180
//             (Labial/Corrector) = 7,950
//   Fragancia: YS-LIB-90 8,240 + YS-Y-60 2,950 + YS-BO-50 2,650 = 13,840
//   Unmapped: YS-LC-01 1,880 (Máscara no mapeada, viene en 2 tickets)
//   Total: 125,980 ✓ matches getSalesAmount

describe("getSalesByCategory", () => {
  it("Admin abril: distribución correcta entre categorías", async () => {
    const r = await getSalesByCategory(admin, { period: aprilPeriod });
    expect(r.Skincare).toBe(102_310);
    expect(r.Makeup).toBe(7_950);
    expect(r.Fragancia).toBe(13_840);
    expect(r.Unmapped).toBe(1_880);
  });

  it("suma de las 4 categorías = total ventas del período (sanity)", async () => {
    const r = await getSalesByCategory(admin, { period: aprilPeriod });
    expect(r.Skincare + r.Makeup + r.Fragancia + r.Unmapped).toBe(125_980);
  });

  it("SKUs sin entry/categoría mapeada → Unmapped", async () => {
    // YS-LC-01 (Máscara) está en el product seed pero su `tipo` no tiene
    // categoría macro en el mapping. Su revenue debe aparecer en Unmapped.
    const r = await getSalesByCategory(admin, { period: aprilPeriod });
    expect(r.Unmapped).toBeGreaterThan(0);
  });

  it("BA Lancôme Polanco abril: solo POL × LCM (todo Skincare)", async () => {
    // POL × LCM abril: LC-ABS-50 16,500 + LC-GEN-50 8,650 + LC-HZN-50 12,100
    //                  + LC-REN-50 3,250 = 40,500 Skincare
    const r = await getSalesByCategory(baLcmPol, { period: aprilPeriod });
    expect(r.Skincare).toBe(40_500);
    expect(r.Makeup).toBe(0);
    expect(r.Fragancia).toBe(0);
    expect(r.Unmapped).toBe(0);
  });

  it("BA YSL Polanco abril: pu-21 (YS-LIB-90 + YS-TC-01) → Fragancia + Makeup", async () => {
    // POL × YSL abril = pu-21: YS-LIB-90 4,120 (Fragancia) + YS-TC-01 990 (Labial)
    const r = await getSalesByCategory(baYslPol, { period: aprilPeriod });
    expect(r.Skincare).toBe(0);
    expect(r.Makeup).toBe(990);
    expect(r.Fragancia).toBe(4_120);
    expect(r.Unmapped).toBe(0);
  });

  it("Gerente Polanco abril: ambas marcas POL", async () => {
    const r = await getSalesByCategory(gerentePol, { period: aprilPeriod });
    expect(r.Skincare).toBe(40_500);
    expect(r.Makeup).toBe(990);
    expect(r.Fragancia).toBe(4_120);
    expect(r.Unmapped).toBe(0);
  });

  it("scope merge vacío → todo 0", async () => {
    const r = await getSalesByCategory(baLcmPol, {
      period: aprilPeriod,
      brands: ["YSL"],
    });
    expect(r).toEqual({ Skincare: 0, Makeup: 0, Fragancia: 0, Unmapped: 0 });
  });

  it("período sin compras → todo 0", async () => {
    const r = await getSalesByCategory(admin, { period: emptyPeriod });
    expect(r).toEqual({ Skincare: 0, Makeup: 0, Fragancia: 0, Unmapped: 0 });
  });

  it("período marzo: YS-LIB-90 + YS-BO-50 → Fragancia, LC-GEN-50 → Skincare", async () => {
    // pu-2 cl-constanza YS-LIB-90 8,900 (Fragancia)
    // pu-4 cl-adriana   YS-LIB-90 8,900 (Fragancia)
    // pu-6 cl-elena     LC-GEN-50 6,400 (Skincare/Sérum)
    // pu-22 cl-vanessa  YS-BO-50  2,650 (Fragancia)
    const r = await getSalesByCategory(admin, {
      period: {
        from: new Date("2026-03-01T00:00:00.000Z"),
        to: new Date("2026-04-01T00:00:00.000Z"),
      },
    });
    expect(r.Skincare).toBe(6_400);
    expect(r.Makeup).toBe(0);
    expect(r.Fragancia).toBe(20_450); // 8900 + 8900 + 2650
    expect(r.Unmapped).toBe(0);
    // Total marzo = 26,850 (igual que getSalesAmount Admin marzo)
    expect(r.Skincare + r.Makeup + r.Fragancia + r.Unmapped).toBe(26_850);
  });
});
