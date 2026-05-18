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
//   Skincare: LC-ABS-50 (Crema) 29,400 + LC-GEN-50 (Sérum) 12,800 = 42,200
//   Makeup:   YS-RPC-01 (Labial) 3,800
//   Fragancia: 0 (no fragrance items sold in April)
//   Unmapped: LC-HYB-30 12,100 (pu-3) + 12,100 (pu-9) = 24,200 (skipped by Bug A → Unmapped)
//   Total: 70,200 ✓ matches getSalesAmount

describe("getSalesByCategory", () => {
  it("Admin abril: distribución correcta entre categorías", async () => {
    const r = await getSalesByCategory(admin, { period: aprilPeriod });
    expect(r.Skincare).toBe(42_200);
    expect(r.Makeup).toBe(3_800);
    expect(r.Fragancia).toBe(0);
    expect(r.Unmapped).toBe(24_200);
  });

  it("suma de las 4 categorías = total ventas del período (sanity)", async () => {
    const r = await getSalesByCategory(admin, { period: aprilPeriod });
    expect(r.Skincare + r.Makeup + r.Fragancia + r.Unmapped).toBe(70_200);
  });

  it("SKUs sin entry en product repo (Bug A) → Unmapped", async () => {
    // LC-HYB-30 está en purchases (pu-3, pu-9) pero ausente del product repo.
    // Su revenue debe aparecer en Unmapped, no en Skincare.
    const r = await getSalesByCategory(admin, { period: aprilPeriod });
    expect(r.Unmapped).toBeGreaterThan(0);
  });

  it("BA Lancôme Polanco abril: solo POL × LCM", async () => {
    // pu-1 cl-constanza: LC-ABS-50 9,800 (Skincare) + LC-GEN-50 6,400 (Skincare) = 16,200 Skincare
    // pu-3 cl-ofelia: LC-HYB-30 12,100 (Unmapped)
    const r = await getSalesByCategory(baLcmPol, { period: aprilPeriod });
    expect(r.Skincare).toBe(16_200);
    expect(r.Makeup).toBe(0);
    expect(r.Fragancia).toBe(0);
    expect(r.Unmapped).toBe(12_100);
  });

  it("BA YSL Polanco abril: 0 ventas POL YSL absolutas → todo 0 excepto Unmapped si aplica", async () => {
    // POL × YSL en abril: NO hay purchases en abril (pu-2 y pu-4 son marzo)
    const r = await getSalesByCategory(baYslPol, { period: aprilPeriod });
    expect(r.Skincare).toBe(0);
    expect(r.Makeup).toBe(0);
    expect(r.Fragancia).toBe(0);
    expect(r.Unmapped).toBe(0);
  });

  it("Gerente Polanco abril: ambas marcas POL (= solo LCM porque no hubo YSL POL en abril)", async () => {
    const r = await getSalesByCategory(gerentePol, { period: aprilPeriod });
    expect(r.Skincare).toBe(16_200);
    expect(r.Makeup).toBe(0);
    expect(r.Unmapped).toBe(12_100);
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

  it("período marzo: pu-2 + pu-4 (YS-LIB-50) → Unmapped, pu-6 (LC-GEN-50) → Skincare", async () => {
    // pu-2 cl-constanza YS-LIB-50 8,900 (Unmapped — no en product)
    // pu-4 cl-adriana   YS-LIB-50 8,900 (Unmapped)
    // pu-6 cl-elena     LC-GEN-50 6,400 (Skincare)
    // (pu-8 julieta YS-OR-100 es FEB-22, fuera de marzo)
    const r = await getSalesByCategory(admin, {
      period: {
        from: new Date("2026-03-01T00:00:00.000Z"),
        to: new Date("2026-04-01T00:00:00.000Z"),
      },
    });
    expect(r.Unmapped).toBe(17_800);
    expect(r.Skincare).toBe(6_400);
    expect(r.Makeup).toBe(0);
    expect(r.Fragancia).toBe(0);
    // Total marzo = 24,200 (igual que getSalesAmount Admin marzo)
    expect(r.Skincare + r.Makeup + r.Fragancia + r.Unmapped).toBe(24_200);
  });
});
