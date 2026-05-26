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
    // Abril 2026 contiene: pu-1 16,200 + pu-3 12,100 + pu-5 9,800 + pu-7 3,800
    // + pu-9 21,900 + pu-10 6,400 + pu-17 3,640 + pu-18 3,220 + pu-19 2,950
    // = 80,010
    const total = await getSalesAmount(admin, { period: aprilPeriod });
    expect(total).toBe(80_010);
  });

  it("BA Lancôme Polanco solo ve compras de su tienda+marca", async () => {
    // Abril POL × LCM: pu-1 (16,200) + pu-3 (12,100) = 28,300
    const total = await getSalesAmount(baLcmPol, { period: aprilPeriod });
    expect(total).toBe(28_300);
  });

  it("BA YSL Polanco no ve nada en abril (no hay compras YSL Polanco en abril)", async () => {
    const total = await getSalesAmount(baYslPol, { period: aprilPeriod });
    expect(total).toBe(0);
  });

  it("Gerente Polanco ve ambas marcas de su tienda", async () => {
    // Misma data que baLcmPol en abril (no hay YSL Polanco en abril) = 28,300
    const total = await getSalesAmount(gerentePol, { period: aprilPeriod });
    expect(total).toBe(28_300);
  });

  it("Supervisor zona Centro NO ve Perisur (fuera de zona)", async () => {
    // Abril POL + STF: pu-1 16,200 + pu-3 12,100 + pu-9 21,900 + pu-10 6,400
    //                 + pu-17 3,640 + pu-19 2,950 = 63,190
    // Excluye pu-5 (Perisur), pu-7 (Perisur), pu-18 (Perisur)
    const total = await getSalesAmount(supervisorCentro, { period: aprilPeriod });
    expect(total).toBe(63_190);
  });

  it("filtro storeIds dentro del scope restringe correctamente", async () => {
    // Admin filtrando solo Santa Fe en abril:
    // pu-9 21,900 + pu-10 6,400 + pu-17 3,640 + pu-19 2,950 = 34,890
    const total = await getSalesAmount(admin, {
      period: aprilPeriod,
      storeIds: [ST_STF],
    });
    expect(total).toBe(34_890);
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
    // pu-3 12,100 + pu-7 3,800 + pu-10 6,400 + pu-17 3,640 = 25,940
    // (pu-18 abr-22 y pu-19 abr-29 quedan fuera del rango)
    expect(total).toBe(25_940);
  });

  it("BA filtrando por marca distinta a la suya → isEmpty → 0", async () => {
    const total = await getSalesAmount(baLcmPol, {
      period: aprilPeriod,
      brands: ["YSL"],
    });
    expect(total).toBe(0);
  });

  it("BA Lancôme Perisur ve solo Perisur LCM", async () => {
    // Abril PER × LCM: pu-5 = 9,800
    const total = await getSalesAmount(baLcmPer, { period: aprilPeriod });
    expect(total).toBe(9_800);
  });
});
