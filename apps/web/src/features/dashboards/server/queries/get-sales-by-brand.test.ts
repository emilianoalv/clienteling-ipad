import { describe, expect, it } from "vitest";
import { RoleNotPermittedError } from "../errors";
import { getSalesByBrand } from "./get-sales-by-brand";
import {
  admin,
  aprilPeriod,
  baLcmPol,
  gerentePol,
  supervisorCentro,
} from "./_test-fixtures";

// Reference (abril 2026, seed expandido):
// Lancôme:
//   sales = 92,200 (10 transacciones)
//   avg = 9,220
//   reco = 4/5 (rc-1,3,5,13 converted + rc-9 pending)
//   activeClients (interactions LCM en abril): constanza, ofelia, cristina, karla, marina = 5
//   topProducts: LC-ABS-50 42,800, LC-HZN-50 27,300, LC-GEN-50 15,050
// YSL:
//   sales = 33,780 (8 tx)
//   avg = 4,222.5
//   reco = 1.0 (rc-7,8,10,12 todas converted)
//   activeClients (interactions YSL en abril): ines, gabriela = 2
//   topProducts: YS-LIB-90 8,240, YS-OR-100 6,490, YS-PSE-15 4,560 (top 3)

describe("getSalesByBrand", () => {
  it("Admin abril: Lancôme y YSL con stats correctas", async () => {
    const r = await getSalesByBrand(admin, { period: aprilPeriod });

    expect(r.Lancome.salesAmount).toBe(92_200);
    expect(r.Lancome.transactionsCount).toBe(10);
    expect(r.Lancome.averageTicket).toBe(9_220);
    expect(r.Lancome.reco2PurchaseRate).toBe(0.8);
    expect(r.Lancome.activeClients).toBe(5);
    expect(r.Lancome.topProducts).toHaveLength(3);
    expect(r.Lancome.topProducts[0]!.sku).toBe("LC-ABS-50");
    expect(r.Lancome.topProducts[0]!.revenue).toBe(42_800);

    expect(r.YSL.salesAmount).toBe(33_780);
    expect(r.YSL.transactionsCount).toBe(8);
    expect(r.YSL.activeClients).toBe(2);
    expect(r.YSL.topProducts).toHaveLength(3);
    expect(r.YSL.topProducts[0]!.sku).toBe("YS-LIB-90");
    expect(r.YSL.topProducts[0]!.revenue).toBe(8_240);
  });

  it("Gerente Polanco: solo POL — Lancôme 40,500 + YSL 5,110", async () => {
    const r = await getSalesByBrand(gerentePol, { period: aprilPeriod });
    expect(r.Lancome.salesAmount).toBe(40_500); // POL × LCM abril
    expect(r.Lancome.activeClients).toBe(2); // constanza, ofelia
    expect(r.YSL.salesAmount).toBe(5_110); // pu-21
    expect(r.YSL.activeClients).toBe(0); // sin interactions YSL POL en abril
  });

  it("Supervisor Centro: excluye Perisur", async () => {
    const r = await getSalesByBrand(supervisorCentro, { period: aprilPeriod });
    // LCM POL+STF: 40,500 + 40,350 = 80,850
    expect(r.Lancome.salesAmount).toBe(80_850);
    // YSL POL+STF: 5,110 + 8,760 = 13,870
    expect(r.YSL.salesAmount).toBe(13_870);
  });

  it("topProducts ordenados por revenue desc, máximo 3", async () => {
    const r = await getSalesByBrand(admin, { period: aprilPeriod });
    expect(r.Lancome.topProducts.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < r.Lancome.topProducts.length; i++) {
      expect(r.Lancome.topProducts[i]!.revenue).toBeLessThanOrEqual(
        r.Lancome.topProducts[i - 1]!.revenue,
      );
    }
  });

  it("BA → RoleNotPermittedError", async () => {
    await expect(
      getSalesByBrand(baLcmPol, { period: aprilPeriod }),
    ).rejects.toBeInstanceOf(RoleNotPermittedError);
  });

  it("filtros que restringen a una marca: la otra colapsa a zeros", async () => {
    const r = await getSalesByBrand(admin, {
      period: aprilPeriod,
      brands: ["Lancôme"],
    });
    expect(r.Lancome.salesAmount).toBe(92_200);
    expect(r.YSL.salesAmount).toBe(0); // intersección vacía
    expect(r.YSL.topProducts).toEqual([]);
  });
});
