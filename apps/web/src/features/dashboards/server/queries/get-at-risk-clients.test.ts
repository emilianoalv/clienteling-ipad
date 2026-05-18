import { describe, expect, it } from "vitest";
import { getAtRiskClients } from "./get-at-risk-clients";
import {
  admin,
  aprilPeriod,
  baLcmPol,
  baYslStf,
  emptyPeriod,
  gerenteStf,
  ST_PER,
  supervisorCentro,
} from "./_test-fixtures";

// Anchor = 2026-05-01. Defaults: inactivityDays=90, minTenureDays=30.
//   Inactivity window: [2026-02-01, 2026-05-01)
//   Tenure cutoff: since < 2026-04-01
//
// Clientes con interaction antes de feb-1 (hadHistory):
//   int-17 cl-nadia STF YSL 2025-12-09
//   int-18 cl-rocio STF YSL 2026-01-25
// Ambas SIN interactions en window → AT-RISK. Ambas con tenure suficiente.
// Admin at-risk = { cl-nadia, cl-rocio } = 2

describe("getAtRiskClients", () => {
  it("Admin defaults: cl-nadia + cl-rocio = 2", async () => {
    expect(await getAtRiskClients(admin, { period: aprilPeriod })).toBe(2);
  });

  it("BA Lancôme Polanco: 0 (no hay history POL LCM antes de window)", async () => {
    expect(await getAtRiskClients(baLcmPol, { period: aprilPeriod })).toBe(0);
  });

  it("BA YSL Santa Fe: 2 (nadia y rocio, ambas STF YSL)", async () => {
    expect(await getAtRiskClients(baYslStf, { period: aprilPeriod })).toBe(2);
  });

  it("Gerente Santa Fe: 2 (la tienda incluye ambas)", async () => {
    expect(await getAtRiskClients(gerenteStf, { period: aprilPeriod })).toBe(2);
  });

  it("Supervisor Centro (POL+STF): 2 (las dos STF YSL)", async () => {
    expect(
      await getAtRiskClients(supervisorCentro, { period: aprilPeriod }),
    ).toBe(2);
  });

  it("minTenureDays muy largo (1825d=5 años) excluye clientas demasiado recientes → 0", async () => {
    // cl-nadia since 2024-04-04, cl-rocio since 2023-10-30 — ninguna tiene 5+ años.
    expect(
      await getAtRiskClients(
        admin,
        { period: aprilPeriod },
        { minTenureDays: 1825 },
      ),
    ).toBe(0);
  });

  it("inactivityDays más amplio (200d): elimina hadHistory → 0", async () => {
    // Con 200d window = [2025-10-13, 2026-05-01). int-17 (dic-09) e int-18 (ene-25)
    // caen DENTRO de la window → recently active, no at-risk.
    expect(
      await getAtRiskClients(
        admin,
        { period: aprilPeriod },
        { inactivityDays: 200 },
      ),
    ).toBe(0);
  });

  it("intersección vacía → 0", async () => {
    expect(
      await getAtRiskClients(gerenteStf, {
        period: aprilPeriod,
        storeIds: [ST_PER],
      }),
    ).toBe(0);
  });

  it("período sin nada → 0", async () => {
    expect(await getAtRiskClients(admin, { period: emptyPeriod })).toBe(0);
  });
});
