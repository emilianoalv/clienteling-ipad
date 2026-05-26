import { describe, expect, it } from "vitest";
import { RoleNotPermittedError } from "../errors";
import { getBaRanking } from "./get-ba-ranking";
import {
  admin,
  aprilPeriod,
  baLcmPol,
  gerentePol,
  gerenteStf,
  supervisorCentro,
} from "./_test-fixtures";

// Reference (abril 2026 sales per BA):
//   Renata     (BA_STF_LCM_1) 24,390 (pu-9 + pu-31)
//   Fernanda   (BA_POL_LCM_2) 24,300 (pu-3 + pu-20 + pu-23)
//   Valentina  (BA_POL_LCM_1) 16,200 (pu-1)
//   Ximena     (BA_STF_LCM_2) 15,960 (pu-10 + pu-28)
//   Lucía      (BA_PER_YSL_1) 12,890 (pu-25 + pu-27)
//   Regina     (BA_PER_LCM_1)  9,800 (pu-5)
//   Mariana    (BA_PER_YSL_2)  7,020 (pu-7 + pu-18)
//   Paulina    (BA_STF_YSL_1)  5,810 (pu-17 + pu-30)
//   Sofía      (BA_POL_YSL_2)  5,110 (pu-21)
//   Carolina   (BA_STF_YSL_2)  2,950 (pu-19)
//   Andrea     (BA_PER_LCM_2)  1,550 (pu-26)
//   Daniela    (BA_POL_YSL_1)      0
// 12 BAs en total.

describe("getBaRanking", () => {
  it("Admin abril default topN=10: top 10 ordenados", async () => {
    const r = await getBaRanking(admin, { period: aprilPeriod });
    expect(r).toHaveLength(10);
    expect(r[0]!.name).toBe("Renata Salazar");
    expect(r[0]!.salesAmount).toBe(24_390);
    expect(r[0]!.rank).toBe(1);
    expect(r[1]!.name).toBe("Fernanda Oliveros");
    expect(r[1]!.salesAmount).toBe(24_300);
    expect(r[1]!.rank).toBe(2);
    expect(r[2]!.name).toBe("Valentina Ríos");
    expect(r[3]!.name).toBe("Ximena Pereda");
    expect(r[3]!.salesAmount).toBe(15_960);
  });

  it("Gerente Polanco: 4 BAs POL, Fernanda rank 1", async () => {
    const r = await getBaRanking(gerentePol, { period: aprilPeriod });
    expect(r).toHaveLength(4);
    // Fernanda (24,300) > Valentina (16,200) > Sofía (5,110) > Daniela (0)
    expect(r[0]!.name).toBe("Fernanda Oliveros");
    expect(r[0]!.salesAmount).toBe(24_300);
    expect(r[1]!.name).toBe("Valentina Ríos");
    expect(r[2]!.name).toBe("Sofía Marín");
    expect(r[3]!.name).toBe("Daniela Castro");
  });

  it("Gerente Santa Fe: 4 BAs STF, Renata rank 1", async () => {
    const r = await getBaRanking(gerenteStf, { period: aprilPeriod });
    expect(r[0]!.name).toBe("Renata Salazar");
    expect(r[1]!.name).toBe("Ximena Pereda");
  });

  it("Supervisor Centro (POL+STF, excluye Perisur): 8 BAs", async () => {
    const r = await getBaRanking(supervisorCentro, { period: aprilPeriod });
    expect(r).toHaveLength(8);
    // top: Renata STF (24,390), Fernanda POL (24,300), Valentina POL (16,200),
    //      Ximena STF (15,960), Paulina STF (5,810), Sofía POL (5,110), ...
    expect(r[0]!.name).toBe("Renata Salazar");
    expect(r[1]!.name).toBe("Fernanda Oliveros");
    expect(r[2]!.name).toBe("Valentina Ríos");
    expect(r[3]!.name).toBe("Ximena Pereda");
  });

  it("conversionRate reflejada en cada row", async () => {
    const r = await getBaRanking(gerentePol, { period: aprilPeriod });
    const valentina = r.find((x) => x.name === "Valentina Ríos");
    expect(valentina!.conversionRate).toBe(1); // rc-1 created+converted abril
    const fernanda = r.find((x) => x.name === "Fernanda Oliveros");
    expect(fernanda!.conversionRate).toBe(0); // sin recs
  });

  it("topN respetado", async () => {
    const r = await getBaRanking(admin, { period: aprilPeriod }, { topN: 3 });
    expect(r).toHaveLength(3);
  });

  it("storeName y brand correctos", async () => {
    const r = await getBaRanking(gerentePol, { period: aprilPeriod });
    expect(r[0]!.storeName).toBe("Liverpool Polanco");
    expect(r[0]!.brand).toBe("Lancôme");
  });

  it("BA → RoleNotPermittedError", async () => {
    await expect(
      getBaRanking(baLcmPol, { period: aprilPeriod }),
    ).rejects.toBeInstanceOf(RoleNotPermittedError);
  });

  it("scope merge vacío → []", async () => {
    const r = await getBaRanking(gerentePol, {
      period: aprilPeriod,
      storeIds: ["st-stf" as never],
    });
    expect(r).toEqual([]);
  });
});
