import { describe, expect, it } from "vitest";
import { getEstimatedReplenishments } from "./get-estimated-replenishments";
import {
  admin,
  aprilPeriodLocal,
  baLcmPol,
  baYslPol,
  emptyPeriod,
} from "./_test-fixtures";

// Anchor = May 1 local.
//
// Cuando estos tests se escribieron originalmente el seed era chico y se
// asertaban filas exactas (cl-gabriela YS-LIB-90 daysAway=7, etc.). El
// enrichment de mayo 2026 (~168 purchases nuevas) movió las "últimas
// compras" de algunos clientes y agregó pares (clientId, sku) nuevos →
// los conteos exactos ya no son estables. Estos tests ahora validan las
// PROPIEDADES estructurales del query (window, sort, dedup, scope) en
// lugar de hardcodear filas específicas — eso queda cubierto por los
// tests "una clienta con la misma SKU…" y "ordenado por daysAway".

function expectAllWithinWindow(
  rows: ReadonlyArray<{ daysAway: number }>,
  windowDays: number,
): void {
  for (const r of rows) {
    expect(r.daysAway).toBeGreaterThanOrEqual(0);
    expect(r.daysAway).toBeLessThanOrEqual(windowDays);
  }
}

function expectSortedByDaysAway(
  rows: ReadonlyArray<{ daysAway: number }>,
): void {
  for (let i = 1; i < rows.length; i++) {
    expect(rows[i]!.daysAway).toBeGreaterThanOrEqual(rows[i - 1]!.daysAway);
  }
}

function expectNoDuplicatePair(
  rows: ReadonlyArray<{ clientId: string; sku: string }>,
): void {
  const seen = new Set<string>();
  for (const r of rows) {
    const key = `${r.clientId}|${r.sku}`;
    expect(seen.has(key)).toBe(false);
    seen.add(key);
  }
}

// BAs Lancôme Polanco están asignadas a este conjunto de clientes (ver
// `assignedBaIds` en seed.ts + enriquecimiento). El query además requiere
// que la compra haya ocurrido en POL × LCM.
const POL_LCM_CLIENTS = new Set([
  "cl-constanza",
  "cl-ofelia",
  "cl-lorena",
  "cl-beatriz",
  "cl-pilar-pol",
  "cl-mariana-pol",
  "cl-andrea-pol",
  "cl-monica-pol",
]);

describe("getEstimatedReplenishments", () => {
  it("Admin window=14: todas las alertas caen dentro del window y ordenadas", async () => {
    const r = await getEstimatedReplenishments(admin, { period: aprilPeriodLocal });
    expectAllWithinWindow(r, 14);
    expectSortedByDaysAway(r);
    expectNoDuplicatePair(r);
  });

  it("Admin window=30: respeta window y orden", async () => {
    const r = await getEstimatedReplenishments(
      admin,
      { period: aprilPeriodLocal },
      { windowDays: 30 },
    );
    expectAllWithinWindow(r, 30);
    expectSortedByDaysAway(r);
    expectNoDuplicatePair(r);
    // Window 30 ⊇ window 14 (todas las del 14 también caben aquí).
    const r14 = await getEstimatedReplenishments(admin, { period: aprilPeriodLocal });
    expect(r.length).toBeGreaterThanOrEqual(r14.length);
  });

  it("Admin window=100: window inclusiva + ordenado por daysAway", async () => {
    const r = await getEstimatedReplenishments(
      admin,
      { period: aprilPeriodLocal },
      { windowDays: 100 },
    );
    expectAllWithinWindow(r, 100);
    expectSortedByDaysAway(r);
    expectNoDuplicatePair(r);
    // Con seed enriquecido la primera alerta puede haber cambiado de SKU,
    // pero sigue siendo la más próxima.
    if (r.length > 0) expect(r[0]!.daysAway).toBeLessThanOrEqual(r.at(-1)!.daysAway);
  });

  it("BA Lancôme Polanco window=100: solo clientes asignados al BA × marca POL+LCM", async () => {
    const r = await getEstimatedReplenishments(
      baLcmPol,
      { period: aprilPeriodLocal },
      { windowDays: 100 },
    );
    expectAllWithinWindow(r, 100);
    expectSortedByDaysAway(r);
    expectNoDuplicatePair(r);
    // Property: every alert is for a client whose assignedBaIds includes baLcmPol.
    for (const x of r) {
      expect(POL_LCM_CLIENTS.has(x.clientId as unknown as string)).toBe(true);
    }
  });

  it("BA YSL Polanco window=100: 0 (todos los SKUs YSL faltan en product seed)", async () => {
    const r = await getEstimatedReplenishments(
      baYslPol,
      { period: aprilPeriodLocal },
      { windowDays: 100 },
    );
    expect(r).toEqual([]);
  });

  it("una clienta con la misma SKU comprada 2 veces: solo se considera la última", async () => {
    // cl-elena: pu-13 (LC-GEN-50 sep-15 2025) + pu-6 (LC-GEN-50 mar-10 2026)
    // La última (pu-6) genera la alerta, NO pu-13.
    const r = await getEstimatedReplenishments(
      admin,
      { period: aprilPeriodLocal },
      { windowDays: 100 },
    );
    const elenaGEN = r.filter(
      (x) => x.clientId === "cl-elena" && x.sku === "LC-GEN-50",
    );
    expect(elenaGEN).toHaveLength(1);
    // est = mar-10 + 90d = jun-08
    expect(elenaGEN[0]!.estimatedDate.getMonth()).toBe(5); // June
  });

  it("scope merge vacío → []", async () => {
    const r = await getEstimatedReplenishments(baLcmPol, {
      period: aprilPeriodLocal,
      brands: ["YSL"],
    });
    expect(r).toEqual([]);
  });

  it("período sin datos → []", async () => {
    const r = await getEstimatedReplenishments(admin, { period: emptyPeriod });
    expect(r).toEqual([]);
  });

  it("ordenado por daysAway ascendente", async () => {
    const r = await getEstimatedReplenishments(
      admin,
      { period: aprilPeriodLocal },
      { windowDays: 100 },
    );
    for (let i = 1; i < r.length; i++) {
      expect(r[i]!.daysAway).toBeGreaterThanOrEqual(r[i - 1]!.daysAway);
    }
  });
});
