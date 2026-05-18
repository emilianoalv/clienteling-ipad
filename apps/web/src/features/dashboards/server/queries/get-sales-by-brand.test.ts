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

// Reference (abril 2026):
// Lancôme:
//   sales = 66,400 (5 transacciones)
//   avg = 13,280
//   reco = 1.0 (3 recs creadas en abril, 3 convirtieron en abril)
//   activeClients (interactions LCM en abril): constanza, ofelia, cristina, karla, marina = 5
//   topProducts: LC-ABS-50 29,400, LC-GEN-50 12,800 (LC-HYB-30 skip Bug A)
// YSL:
//   sales = 3,800 (1 tx — pu-7 cl-ines)
//   avg = 3,800
//   reco = 0 (sin recs YSL creadas en abril)
//   activeClients (interactions YSL en abril): ines, gabriela (int-21 whatsapp) = 2
//   topProducts: YS-RPC-01 3,800 (YS-LIB-50 skip)

describe("getSalesByBrand", () => {
  it("Admin abril: Lancôme y YSL con stats correctas", async () => {
    const r = await getSalesByBrand(admin, { period: aprilPeriod });

    expect(r.Lancome.salesAmount).toBe(66_400);
    expect(r.Lancome.transactionsCount).toBe(5);
    expect(r.Lancome.averageTicket).toBe(13_280);
    expect(r.Lancome.reco2PurchaseRate).toBe(1);
    expect(r.Lancome.activeClients).toBe(5);
    expect(r.Lancome.topProducts).toHaveLength(2);
    expect(r.Lancome.topProducts[0]!.sku).toBe("LC-ABS-50");
    expect(r.Lancome.topProducts[0]!.revenue).toBe(29_400);

    expect(r.YSL.salesAmount).toBe(3_800);
    expect(r.YSL.transactionsCount).toBe(1);
    expect(r.YSL.activeClients).toBe(2);
    expect(r.YSL.topProducts).toHaveLength(1);
    expect(r.YSL.topProducts[0]!.sku).toBe("YS-RPC-01");
  });

  it("Gerente Polanco: solo POL — Lancôme con ventas, YSL en 0", async () => {
    const r = await getSalesByBrand(gerentePol, { period: aprilPeriod });
    expect(r.Lancome.salesAmount).toBe(28_300); // pu-1 + pu-3
    expect(r.Lancome.activeClients).toBe(2); // constanza, ofelia
    expect(r.YSL.salesAmount).toBe(0);
    expect(r.YSL.activeClients).toBe(0);
    expect(r.YSL.topProducts).toEqual([]);
  });

  it("Supervisor Centro: excluye Perisur", async () => {
    const r = await getSalesByBrand(supervisorCentro, { period: aprilPeriod });
    // LCM POL+STF: pu-1 + pu-3 + pu-9 + pu-10 = 56,600 (excluye pu-5 PER)
    expect(r.Lancome.salesAmount).toBe(56_600);
    // YSL POL+STF en abril: 0
    expect(r.YSL.salesAmount).toBe(0);
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
    expect(r.Lancome.salesAmount).toBe(66_400);
    expect(r.YSL.salesAmount).toBe(0); // intersección vacía
    expect(r.YSL.topProducts).toEqual([]);
  });
});
