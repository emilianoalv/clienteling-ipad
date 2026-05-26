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
//   STF: pu-9 + pu-10 + pu-17 + pu-19 = 34,890, 4 tx, 4 BAs activos
//        (Renata, Ximena, Paulina, Carolina)
//        interactions abril STF: int-14 (karla), int-15 (marina) = 2
//   PER: pu-5 + pu-7 + pu-18 = 16,820, 3 tx, 2 BAs (Regina + Mariana)
//        interactions abril PER: int-8 (cristina), int-13 (ines), int-21 (gabriela) = 3

describe("getStoreRanking", () => {
  it("Admin abril: STF lidera (34,890), POL segundo (28,300), PER tercero (16,820)", async () => {
    const r = await getStoreRanking(admin, { period: aprilPeriod });
    expect(r).toHaveLength(3);
    expect(r[0]!.storeName).toBe("Palacio Santa Fe");
    expect(r[0]!.salesAmount).toBe(34_890);
    expect(r[0]!.rank).toBe(1);
    expect(r[1]!.storeName).toBe("Liverpool Polanco");
    expect(r[1]!.salesAmount).toBe(28_300);
    expect(r[2]!.storeName).toBe("Liverpool Perisur");
    expect(r[2]!.salesAmount).toBe(16_820);
  });

  it("activeBas y activeClients correctos por tienda", async () => {
    const r = await getStoreRanking(admin, { period: aprilPeriod });
    const pol = r.find((x) => x.storeName === "Liverpool Polanco")!;
    expect(pol.activeBas).toBe(2);
    expect(pol.activeClients).toBe(2);
    const stf = r.find((x) => x.storeName === "Palacio Santa Fe")!;
    expect(stf.activeBas).toBe(4); // Renata, Ximena, Paulina, Carolina (pu-9/10/17/19)
    const per = r.find((x) => x.storeName === "Liverpool Perisur")!;
    expect(per.activeBas).toBe(2); // Regina, Mariana (pu-5/7/18 — Mariana hace dos)
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
