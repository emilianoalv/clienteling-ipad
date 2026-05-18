import { describe, expect, it } from "vitest";
import type { Staff, StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import { mergeScope } from "./scope-merge";
import type { DashboardFilters } from "../types";

const ST_POL = "st-pol" as StoreId;
const ST_PER = "st-per" as StoreId;
const ST_STF = "st-stf" as StoreId;

const baLcmPol: Staff = {
  id: "us-ba-pol-lcm-1" as StaffId,
  name: "Valentina Ríos",
  initials: "VR",
  role: "BA",
  storeId: ST_POL,
  brand: "Lancôme",
};

const gerentePol: Staff = {
  id: "us-gte-pol" as StaffId,
  name: "Camila Santos",
  initials: "CS",
  role: "Gerente",
  storeId: ST_POL,
};

const supervisorCentro: Staff = {
  id: "us-sup-centro" as StaffId,
  name: "Diego Salvatierra",
  initials: "DS",
  role: "Supervisor",
  storeIds: [ST_POL, ST_STF],
};

const admin: Staff = {
  id: "us-admin" as StaffId,
  name: "Ana Lucía Ferrer",
  initials: "AF",
  role: "Admin",
};

const period = { from: new Date(2026, 4, 1), to: new Date(2026, 5, 1) };

function f(overrides: Partial<DashboardFilters> = {}): DashboardFilters {
  return { period, ...overrides };
}

describe("mergeScope", () => {
  it("BA without filters → returns the BA's single store and single brand", () => {
    const m = mergeScope(baLcmPol, f());
    expect(m.storeIds).toEqual([ST_POL]);
    expect(m.brands).toEqual(["Lancôme"]);
    expect(m.isEmpty).toBe(false);
  });

  it("Admin without filters → undefined on both axes (nacional)", () => {
    const m = mergeScope(admin, f());
    expect(m.storeIds).toBeUndefined();
    expect(m.brands).toBeUndefined();
    expect(m.isEmpty).toBe(false);
  });

  it("Supervisor with filter inside scope → intersection", () => {
    const m = mergeScope(supervisorCentro, f({ storeIds: [ST_POL] }));
    expect(m.storeIds).toEqual([ST_POL]);
    expect(m.isEmpty).toBe(false);
  });

  it("Gerente Polanco filtra por st-stf (fuera de scope) → isEmpty", () => {
    const m = mergeScope(gerentePol, f({ storeIds: [ST_STF] }));
    expect(m.storeIds).toEqual([]);
    expect(m.isEmpty).toBe(true);
  });

  it("Supervisor pide tienda fuera de su zona → isEmpty", () => {
    const m = mergeScope(supervisorCentro, f({ storeIds: [ST_PER] }));
    expect(m.storeIds).toEqual([]);
    expect(m.isEmpty).toBe(true);
  });

  it("BA Lancôme filtra por YSL (fuera de marca) → isEmpty", () => {
    const m = mergeScope(baLcmPol, f({ brands: ["YSL"] }));
    expect(m.brands).toEqual([]);
    expect(m.isEmpty).toBe(true);
  });

  it("Admin filtra por marca específica → respeta el override", () => {
    const m = mergeScope(admin, f({ brands: ["YSL"] }));
    expect(m.brands).toEqual(["YSL"]);
    expect(m.storeIds).toBeUndefined();
    expect(m.isEmpty).toBe(false);
  });

  it("Admin filtra por una tienda → respeta el override", () => {
    const m = mergeScope(admin, f({ storeIds: [ST_PER] }));
    expect(m.storeIds).toEqual([ST_PER]);
    expect(m.isEmpty).toBe(false);
  });

  it("empty-array override (`storeIds: []`) is treated as no override, not as ∅", () => {
    const m = mergeScope(gerentePol, f({ storeIds: [] }));
    expect(m.storeIds).toEqual([ST_POL]);
    expect(m.isEmpty).toBe(false);
  });

  it("partial intersection on stores keeps the matching subset", () => {
    const m = mergeScope(supervisorCentro, f({ storeIds: [ST_POL, ST_PER] }));
    expect(m.storeIds).toEqual([ST_POL]);
    expect(m.isEmpty).toBe(false);
  });
});
