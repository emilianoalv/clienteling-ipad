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

// Reference (abril 2026):
//   POL: pu-1 16,200 + pu-3 12,100 = 28,300, 2 tx, 2 BAs activos (Val + Fer)
//        interactions abril POL: int-1 (constanza), int-2 (ofelia)
//        activeClients = 2
//   STF: pu-9 21,900 + pu-10 6,400 = 28,300, 2 tx, 2 BAs (Renata + Ximena)
//        interactions abril STF: int-14 (karla), int-15 (marina) = 2
//   PER: pu-5 9,800 + pu-7 3,800 = 13,600, 2 tx, 2 BAs (Regina + Mariana)
//        interactions abril PER: int-8 (cristina), int-13 (ines), int-21 (gabriela) = 3

describe("getStoreRanking", () => {
  it("Admin abril: 3 tiendas. POL y STF empatan en 28,300 → alfabético", async () => {
    const r = await getStoreRanking(admin, { period: aprilPeriod });
    expect(r).toHaveLength(3);
    // "Liverpool Polanco" < "Palacio Santa Fe" alfabéticamente
    expect(r[0]!.storeName).toBe("Liverpool Polanco");
    expect(r[0]!.salesAmount).toBe(28_300);
    expect(r[0]!.rank).toBe(1);
    expect(r[1]!.storeName).toBe("Palacio Santa Fe");
    expect(r[1]!.salesAmount).toBe(28_300);
    expect(r[2]!.storeName).toBe("Liverpool Perisur");
    expect(r[2]!.salesAmount).toBe(13_600);
  });

  it("activeBas y activeClients correctos por tienda", async () => {
    const r = await getStoreRanking(admin, { period: aprilPeriod });
    const pol = r.find((x) => x.storeName === "Liverpool Polanco")!;
    expect(pol.activeBas).toBe(2);
    expect(pol.activeClients).toBe(2);
    const per = r.find((x) => x.storeName === "Liverpool Perisur")!;
    expect(per.activeBas).toBe(2);
    expect(per.activeClients).toBe(3); // cristina, ines, gabriela (whatsapp también)
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
