import { describe, expect, it } from "vitest";
import { RoleNotPermittedError } from "../errors";
import { getBaRankingInCounter } from "./get-ba-ranking-in-counter";
import {
  admin,
  aprilPeriod,
  baKiehlsAlone,
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
//   POL × LCM: Valentina 16,200 (pu-1) · Fernanda 12,100 (pu-3)
//   POL × YSL: Daniela 0 · Sofía 0  (sin compras POL YSL en abril)
//   STF × LCM: Renata 21,900 (pu-9) · Ximena 6,400 (pu-10)

describe("getBaRankingInCounter", () => {
  it("Valentina POL LCM: rank 1 de 2 (top seller)", async () => {
    const r = await getBaRankingInCounter(baLcmPol, { period: aprilPeriod });
    expect(r.myRank).toBe(1);
    expect(r.totalInCounter).toBe(2);
    expect(r.topThree).toHaveLength(2);
    expect(r.topThree[0]!.name).toBe("Valentina Ríos");
    expect(r.topThree[0]!.salesAmount).toBe(16_200);
    expect(r.topThree[1]!.name).toBe("Fernanda Oliveros");
    expect(r.topThree[1]!.salesAmount).toBe(12_100);
  });

  it("Fernanda POL LCM: rank 2 de 2 (segundo)", async () => {
    const r = await getBaRankingInCounter(baLcmPol2, { period: aprilPeriod });
    expect(r.myRank).toBe(2);
    expect(r.totalInCounter).toBe(2);
  });

  it("Renata STF LCM: rank 1 con 21,900; Ximena queda en 2", async () => {
    const r = await getBaRankingInCounter(baLcmStf, { period: aprilPeriod });
    expect(r.myRank).toBe(1);
    expect(r.topThree[0]!.salesAmount).toBe(21_900);
    expect(r.topThree[1]!.salesAmount).toBe(6_400);
  });

  it("Ximena STF LCM: rank 2 de 2", async () => {
    const r = await getBaRankingInCounter(baLcmStf2, { period: aprilPeriod });
    expect(r.myRank).toBe(2);
  });

  it("Empate en 0 → orden alfabético por nombre (Daniela antes que Sofía)", async () => {
    const r = await getBaRankingInCounter(baYslPol, { period: aprilPeriod });
    expect(r.topThree[0]!.name).toBe("Daniela Castro");
    expect(r.topThree[1]!.name).toBe("Sofía Marín");
    expect(r.myRank).toBe(1); // Daniela
  });

  it("Sofía POL YSL: rank 2 por orden alfabético en empate", async () => {
    const r = await getBaRankingInCounter(baYslPol2, { period: aprilPeriod });
    expect(r.myRank).toBe(2);
  });

  it("Counter con 1 BA (Kiehl's sintético): myRank=1, total=1, topThree=[staff]", async () => {
    const r = await getBaRankingInCounter(baKiehlsAlone, { period: aprilPeriod });
    expect(r.totalInCounter).toBe(1);
    expect(r.myRank).toBe(1);
    expect(r.topThree).toHaveLength(1);
    expect(r.topThree[0]!.baId).toBe(baKiehlsAlone.id);
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
