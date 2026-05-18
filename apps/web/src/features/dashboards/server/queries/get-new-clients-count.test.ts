import { describe, expect, it } from "vitest";
import { getNewClientsCount } from "./get-new-clients-count";
import {
  admin,
  baLcmPol,
  baYslPol,
  emptyPeriod,
  gerentePol,
  q1Period,
  ST_PER,
} from "./_test-fixtures";

describe("getNewClientsCount", () => {
  it("Admin Q1 2026: cl-ines (2026-01-09) + cl-lorena (2026-02-12) = 2", async () => {
    expect(await getNewClientsCount(admin, { period: q1Period })).toBe(2);
  });

  it("BA Lancôme Polanco Q1 2026: solo cl-lorena (Polanco LCM)", async () => {
    expect(await getNewClientsCount(baLcmPol, { period: q1Period })).toBe(1);
  });

  it("BA YSL Polanco Q1 2026: 0 (cl-lorena es LCM-only)", async () => {
    expect(await getNewClientsCount(baYslPol, { period: q1Period })).toBe(0);
  });

  it("Gerente Polanco Q1 2026: cl-lorena (POL ambas marcas)", async () => {
    expect(await getNewClientsCount(gerentePol, { period: q1Period })).toBe(1);
  });

  it("período sin altas → 0", async () => {
    expect(await getNewClientsCount(admin, { period: emptyPeriod })).toBe(0);
  });

  it("intersección vacía → 0", async () => {
    expect(
      await getNewClientsCount(gerentePol, {
        period: q1Period,
        storeIds: [ST_PER],
      }),
    ).toBe(0);
  });

  it("bordes: 'from' inclusive, 'to' exclusive", async () => {
    // cl-lorena since=2026-02-12. Período [2026-02-12, 2026-02-13) la INCLUYE.
    expect(
      await getNewClientsCount(admin, {
        period: {
          from: new Date("2026-02-12T00:00:00.000Z"),
          to: new Date("2026-02-13T00:00:00.000Z"),
        },
      }),
    ).toBe(1);

    // Período [2026-02-13, 2026-02-14) la EXCLUYE.
    expect(
      await getNewClientsCount(admin, {
        period: {
          from: new Date("2026-02-13T00:00:00.000Z"),
          to: new Date("2026-02-14T00:00:00.000Z"),
        },
      }),
    ).toBe(0);
  });
});
