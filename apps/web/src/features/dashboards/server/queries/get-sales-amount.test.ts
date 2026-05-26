import { describe, expect, it } from "vitest";
import { getSalesAmount } from "./get-sales-amount";
import {
  admin,
  aprilPeriod,
  baLcmPer,
  baLcmPol,
  baYslPol,
  emptyPeriod,
  gerentePol,
  ST_PER,
  ST_STF,
  supervisorCentro,
} from "./_test-fixtures";

describe("getSalesAmount", () => {
  it("Admin sin filtros suma TODAS las compras del período", async () => {
    // Abril 2026 (18 tickets): pu-1 16,200 + pu-3 12,100 + pu-5 9,800
    // + pu-7 3,800 + pu-9 21,900 + pu-10 6,400 + pu-17 3,640 + pu-18 3,220
    // + pu-19 2,950 + pu-20 8,950 + pu-21 5,110 + pu-23 3,250 + pu-25 8,770
    // + pu-26 1,550 + pu-27 4,120 + pu-28 9,560 + pu-30 2,170 + pu-31 2,490
    // = 125,980
    const total = await getSalesAmount(admin, { period: aprilPeriod });
    expect(total).toBe(125_980);
  });

  it("BA Lancôme Polanco solo ve compras de su tienda+marca", async () => {
    // Abril POL × LCM: pu-1 16,200 + pu-3 12,100 + pu-20 8,950 + pu-23 3,250 = 40,500
    const total = await getSalesAmount(baLcmPol, { period: aprilPeriod });
    expect(total).toBe(40_500);
  });

  it("BA YSL Polanco abril: solo pu-21 (5,110)", async () => {
    // POL × YSL abril = pu-21 únicamente. Vanessa (pu-22) cae en marzo.
    const total = await getSalesAmount(baYslPol, { period: aprilPeriod });
    expect(total).toBe(5_110);
  });

  it("Gerente Polanco ve ambas marcas de su tienda", async () => {
    // POL todas las marcas: POL LCM 40,500 + POL YSL 5,110 = 45,610
    const total = await getSalesAmount(gerentePol, { period: aprilPeriod });
    expect(total).toBe(45_610);
  });

  it("Supervisor zona Centro NO ve Perisur (fuera de zona)", async () => {
    // Abril POL + STF: POL 45,610 + STF 49,110 = 94,720
    // Excluye PER × * (pu-5, pu-7, pu-18, pu-25, pu-26, pu-27)
    const total = await getSalesAmount(supervisorCentro, { period: aprilPeriod });
    expect(total).toBe(94_720);
  });

  it("filtro storeIds dentro del scope restringe correctamente", async () => {
    // Admin filtrando solo Santa Fe en abril:
    // STF LCM: pu-9 21,900 + pu-10 6,400 + pu-28 9,560 + pu-31 2,490 = 40,350
    // STF YSL: pu-17 3,640 + pu-19 2,950 + pu-30 2,170 = 8,760
    // Total = 49,110
    const total = await getSalesAmount(admin, {
      period: aprilPeriod,
      storeIds: [ST_STF],
    });
    expect(total).toBe(49_110);
  });

  it("filtro storeIds fuera del scope (intersección vacía) → 0", async () => {
    // Gerente Polanco intentando ver Perisur → isEmpty → 0
    const total = await getSalesAmount(gerentePol, {
      period: aprilPeriod,
      storeIds: [ST_PER],
    });
    expect(total).toBe(0);
  });

  it("período sin compras devuelve 0", async () => {
    const total = await getSalesAmount(admin, { period: emptyPeriod });
    expect(total).toBe(0);
  });

  it("filtro baId restringe a las compras de ese BA", async () => {
    // Solo Valentina (BA_POL_LCM_1): pu-1 = 16,200
    const total = await getSalesAmount(gerentePol, {
      period: aprilPeriod,
      baId: baLcmPol.id,
    });
    expect(total).toBe(16_200);
  });

  it("bordes del período: 'to' es exclusivo", async () => {
    // pu-3 cae en 2026-04-02. Período [2026-04-02, 2026-04-21) debe INCLUIR
    // pu-3 (16:11 > 00:00) pero EXCLUIR pu-1 (2026-04-21 18:32).
    const total = await getSalesAmount(admin, {
      period: {
        from: new Date("2026-04-02T00:00:00.000Z"),
        to: new Date("2026-04-21T00:00:00.000Z"),
      },
    });
    // En rango [04-02, 04-21):
    // pu-3 12,100 + pu-7 3,800 + pu-10 6,400 + pu-17 3,640 + pu-21 5,110
    // + pu-23 3,250 + pu-27 4,120 + pu-30 2,170 + pu-31 2,490 = 43,080
    // Excluidos por > to: pu-1, pu-5, pu-9, pu-18, pu-19, pu-20, pu-25, pu-26, pu-28
    expect(total).toBe(43_080);
  });

  it("BA filtrando por marca distinta a la suya → isEmpty → 0", async () => {
    const total = await getSalesAmount(baLcmPol, {
      period: aprilPeriod,
      brands: ["YSL"],
    });
    expect(total).toBe(0);
  });

  it("BA Lancôme Perisur ve solo Perisur LCM", async () => {
    // Abril PER × LCM: pu-5 9,800 + pu-26 1,550 = 11,350
    const total = await getSalesAmount(baLcmPer, { period: aprilPeriod });
    expect(total).toBe(11_350);
  });
});
