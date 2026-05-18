import { describe, expect, it } from "vitest";
import { getFollowUpsCount } from "./get-follow-ups-count";
import {
  admin,
  aprilPeriod,
  baLcmPer,
  baLcmPol,
  baYslPol,
  emptyPeriod,
  gerentePol,
  ST_PER,
  supervisorCentro,
} from "./_test-fixtures";

describe("getFollowUpsCount", () => {
  it("Admin abril: ft-06 (Polanco LCM) + ft-07 (Perisur YSL) + ft-08 (Santa Fe LCM) = 3", async () => {
    expect(await getFollowUpsCount(admin, { period: aprilPeriod })).toBe(3);
  });

  it("BA Lancôme Polanco abril: solo ft-06 (Valentina)", async () => {
    expect(await getFollowUpsCount(baLcmPol, { period: aprilPeriod })).toBe(1);
  });

  it("BA YSL Polanco abril: 0 (no hay tasks done en POL × YSL)", async () => {
    expect(await getFollowUpsCount(baYslPol, { period: aprilPeriod })).toBe(0);
  });

  it("Gerente Polanco abril: 1 (ve ft-06)", async () => {
    expect(await getFollowUpsCount(gerentePol, { period: aprilPeriod })).toBe(1);
  });

  it("Supervisor Centro abril excluye Perisur (ft-07): ft-06 (POL) + ft-08 (STF) = 2", async () => {
    expect(
      await getFollowUpsCount(supervisorCentro, { period: aprilPeriod }),
    ).toBe(2);
  });

  it("BA Lancôme Perisur abril: 0 (ft-07 es YSL, no LCM)", async () => {
    expect(await getFollowUpsCount(baLcmPer, { period: aprilPeriod })).toBe(0);
  });

  it("intersección vacía → 0", async () => {
    expect(
      await getFollowUpsCount(gerentePol, {
        period: aprilPeriod,
        storeIds: [ST_PER],
      }),
    ).toBe(0);
  });

  it("período sin tasks done → 0", async () => {
    expect(await getFollowUpsCount(admin, { period: emptyPeriod })).toBe(0);
  });

  it("filtro baId restringe a las tasks del BA", async () => {
    expect(
      await getFollowUpsCount(admin, {
        period: aprilPeriod,
        baId: baLcmPol.id,
      }),
    ).toBe(1);
  });

  it("solo cuenta done — ignora pending/cancelled", async () => {
    // Hay 4 tasks pending en seed (ft-01..ft-04) más las done.
    // Período abril: solo cuenta las done con completedAt en abril
    // (ft-06 + ft-07 + ft-08), no las pending pese a tener createdAt
    // o dueAt en abril.
    expect(
      await getFollowUpsCount(admin, {
        period: {
          from: new Date("2026-04-01T00:00:00.000Z"),
          to: new Date("2026-05-01T00:00:00.000Z"),
        },
      }),
    ).toBe(3);
  });
});
