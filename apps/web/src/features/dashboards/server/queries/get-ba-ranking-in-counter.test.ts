import { describe, expect, it } from "vitest";
import { RoleNotPermittedError } from "../errors";
import { getBaRankingInCounter } from "./get-ba-ranking-in-counter";
import {
  admin,
  aprilPeriod,
  baYslAlone,
  baLcmPol,
  baLcmPol2,
  baLcmStf,
  baLcmStf2,
  baYslPol,
  baYslPol2,
  emptyPeriod,
  gerentePol,
  supervisorCentro,
} from "./_test-fixtures";

// Reference (abril 2026):
//   POL × LCM: Fernanda 24,300 (pu-3 + pu-20 + pu-23) · Valentina 16,200 (pu-1)
//   POL × YSL: Sofía 5,110 (pu-21) · Daniela 0
//   STF × LCM: Renata 24,390 (pu-9 + pu-31) · Ximena 15,960 (pu-10 + pu-28)

describe("getBaRankingInCounter", () => {
  it("Valentina POL LCM: rank 2 de 2 (Fernanda lidera)", async () => {
    const r = await getBaRankingInCounter(baLcmPol, { period: aprilPeriod });
    expect(r.myRank).toBe(2);
    expect(r.totalInCounter).toBe(2);
    expect(r.topThree).toHaveLength(2);
    expect(r.topThree[0]!.name).toBe("Fernanda Oliveros");
    expect(r.topThree[0]!.salesAmount).toBe(24_300);
    expect(r.topThree[1]!.name).toBe("Valentina Ríos");
    expect(r.topThree[1]!.salesAmount).toBe(16_200);
  });

  it("Fernanda POL LCM: rank 1 de 2 (lidera con 24,300)", async () => {
    const r = await getBaRankingInCounter(baLcmPol2, { period: aprilPeriod });
    expect(r.myRank).toBe(1);
    expect(r.totalInCounter).toBe(2);
  });

  it("Renata STF LCM: rank 1 con 24,390; Ximena queda en 2 con 15,960", async () => {
    const r = await getBaRankingInCounter(baLcmStf, { period: aprilPeriod });
    expect(r.myRank).toBe(1);
    expect(r.topThree[0]!.salesAmount).toBe(24_390);
    expect(r.topThree[1]!.salesAmount).toBe(15_960);
  });

  it("Ximena STF LCM: rank 2 de 2", async () => {
    const r = await getBaRankingInCounter(baLcmStf2, { period: aprilPeriod });
    expect(r.myRank).toBe(2);
  });

  it("POL × YSL: Sofía 5,110 lidera, Daniela 0 en 2", async () => {
    const r = await getBaRankingInCounter(baYslPol, { period: aprilPeriod });
    expect(r.topThree[0]!.name).toBe("Sofía Marín");
    expect(r.topThree[0]!.salesAmount).toBe(5_110);
    expect(r.topThree[1]!.name).toBe("Daniela Castro");
    expect(r.topThree[1]!.salesAmount).toBe(0);
    expect(r.myRank).toBe(2); // Daniela
  });

  it("Sofía POL YSL: rank 1 con única venta del counter (pu-21)", async () => {
    const r = await getBaRankingInCounter(baYslPol2, { period: aprilPeriod });
    expect(r.myRank).toBe(1);
  });

  it("Counter con 1 BA (tienda sintética): myRank=1, total=1, topThree=[staff]", async () => {
    const r = await getBaRankingInCounter(baYslAlone, { period: aprilPeriod });
    expect(r.totalInCounter).toBe(1);
    expect(r.myRank).toBe(1);
    expect(r.topThree).toHaveLength(1);
    expect(r.topThree[0]!.baId).toBe(baYslAlone.id);
    expect(r.topThree[0]!.salesAmount).toBe(0);
  });

  it("intersección vacía (BA Lancôme filtrando por YSL): rank=1, total=2, top con ceros", async () => {
    // El roster se construye igual, pero todas las ventas son 0 porque no se llama al repo.
    const r = await getBaRankingInCounter(baLcmPol, {
      period: aprilPeriod,
      brands: ["YSL"],
    });
    expect(r.totalInCounter).toBe(2);
    expect(r.topThree[0]!.salesAmount).toBe(0);
    expect(r.topThree[1]!.salesAmount).toBe(0);
  });

  it("período sin ventas: rank por orden alfabético (ambos en 0)", async () => {
    const r = await getBaRankingInCounter(baLcmPol, { period: emptyPeriod });
    expect(r.topThree[0]!.salesAmount).toBe(0);
    expect(r.topThree[1]!.salesAmount).toBe(0);
    // alfabético: Fernanda antes que Valentina
    expect(r.topThree[0]!.name).toBe("Fernanda Oliveros");
    expect(r.myRank).toBe(2);
  });

  it("rol Gerente → RoleNotPermittedError", async () => {
    await expect(
      getBaRankingInCounter(gerentePol, { period: aprilPeriod }),
    ).rejects.toBeInstanceOf(RoleNotPermittedError);
  });

  it("rol Supervisor → RoleNotPermittedError", async () => {
    await expect(
      getBaRankingInCounter(supervisorCentro, { period: aprilPeriod }),
    ).rejects.toBeInstanceOf(RoleNotPermittedError);
  });

  it("rol Admin → RoleNotPermittedError", async () => {
    await expect(
      getBaRankingInCounter(admin, { period: aprilPeriod }),
    ).rejects.toBeInstanceOf(RoleNotPermittedError);
  });
});
