import { describe, expect, it } from "vitest";
import { RoleNotPermittedError } from "../errors";
import { getStoreRanking } from "./get-store-ranking";
import {
  admin,
  aprilPeriod,
  baLcmPol,
  gerentePol,
  supervisorCentro,
} from "./_test-fixtures";

// Reference (abril 2026, seed expandido):
//   POL: 45,610 (5 tx) — BAs Valentina, Fernanda, Sofía activos = 3
//        interactions abril POL: int-1 (constanza), int-2 (ofelia) = 2
//   STF: 49,110 (7 tx) — BAs Renata, Ximena, Paulina, Carolina activos = 4
//        interactions abril STF: int-14 (karla), int-15 (marina) = 2
//   PER: 31,260 (6 tx) — BAs Regina, Andrea, Mariana, Lucía activos = 4
//        interactions abril PER: int-8 (cristina), int-13 (ines), int-21 (gabriela) = 3

describe("getStoreRanking", () => {
  it("Admin abril: STF (49,110), POL (45,610), PER (31,260)", async () => {
    const r = await getStoreRanking(admin, { period: aprilPeriod });
    expect(r).toHaveLength(3);
    expect(r[0]!.storeName).toBe("Palacio Santa Fe");
    expect(r[0]!.salesAmount).toBe(49_110);
    expect(r[0]!.rank).toBe(1);
    expect(r[1]!.storeName).toBe("Liverpool Polanco");
    expect(r[1]!.salesAmount).toBe(45_610);
    expect(r[2]!.storeName).toBe("Liverpool Perisur");
    expect(r[2]!.salesAmount).toBe(31_260);
  });

  it("activeBas y activeClients correctos por tienda", async () => {
    const r = await getStoreRanking(admin, { period: aprilPeriod });
    const pol = r.find((x) => x.storeName === "Liverpool Polanco")!;
    expect(pol.activeBas).toBe(3); // Valentina, Fernanda, Sofía
    expect(pol.activeClients).toBe(2);
    const stf = r.find((x) => x.storeName === "Palacio Santa Fe")!;
    expect(stf.activeBas).toBe(4); // Renata, Ximena, Paulina, Carolina
    const per = r.find((x) => x.storeName === "Liverpool Perisur")!;
    expect(per.activeBas).toBe(4); // Regina, Andrea, Mariana, Lucía
    expect(per.activeClients).toBe(3); // cristina, ines, gabriela
  });

  it("franchiseName mapea desde Store.chain", async () => {
    const r = await getStoreRanking(admin, { period: aprilPeriod });
    expect(r.find((x) => x.storeName === "Liverpool Polanco")!.franchiseName).toBe(
      "Liverpool",
    );
    expect(r.find((x) => x.storeName === "Palacio Santa Fe")!.franchiseName).toBe(
      "Palacio",
    );
  });

  it("Supervisor Centro: solo POL + STF (excluye PER)", async () => {
    const r = await getStoreRanking(supervisorCentro, { period: aprilPeriod });
    expect(r).toHaveLength(2);
    expect(r.find((x) => x.storeName === "Liverpool Perisur")).toBeUndefined();
  });

  it("topN respetado", async () => {
    const r = await getStoreRanking(admin, { period: aprilPeriod }, { topN: 1 });
    expect(r).toHaveLength(1);
  });

  it("BA → RoleNotPermittedError", async () => {
    await expect(
      getStoreRanking(baLcmPol, { period: aprilPeriod }),
    ).rejects.toBeInstanceOf(RoleNotPermittedError);
  });

  it("Gerente → RoleNotPermittedError (solo ve 1 tienda)", async () => {
    await expect(
      getStoreRanking(gerentePol, { period: aprilPeriod }),
    ).rejects.toBeInstanceOf(RoleNotPermittedError);
  });

  it("scope merge vacío → []", async () => {
    const r = await getStoreRanking(supervisorCentro, {
      period: aprilPeriod,
      storeIds: ["st-per" as never], // fuera de la zona del supervisor
    });
    expect(r).toEqual([]);
  });
});
