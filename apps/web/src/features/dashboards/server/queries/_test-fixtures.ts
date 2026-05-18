import type { Staff, StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";

/**
 * Shared staff fixtures for query tests. Mirror the seed in
 * `server/repositories/user.repository.ts` so the same `id`s are valid
 * across the seeded repos.
 */

export const ST_POL = "st-pol" as StoreId;
export const ST_PER = "st-per" as StoreId;
export const ST_STF = "st-stf" as StoreId;

export const baLcmPol: Staff = {
  id: "us-ba-pol-lcm-1" as StaffId, // Valentina Ríos
  name: "Valentina Ríos",
  initials: "VR",
  role: "BA",
  storeId: ST_POL,
  brand: "Lancôme",
};

export const baLcmPol2: Staff = {
  id: "us-ba-pol-lcm-2" as StaffId, // Fernanda Oliveros
  name: "Fernanda Oliveros",
  initials: "FO",
  role: "BA",
  storeId: ST_POL,
  brand: "Lancôme",
};

export const baYslPol: Staff = {
  id: "us-ba-pol-ysl-1" as StaffId, // Daniela Castro
  name: "Daniela Castro",
  initials: "DC",
  role: "BA",
  storeId: ST_POL,
  brand: "YSL",
};

export const baLcmPer: Staff = {
  id: "us-ba-per-lcm-1" as StaffId, // Regina Mendoza
  name: "Regina Mendoza",
  initials: "RM",
  role: "BA",
  storeId: ST_PER,
  brand: "Lancôme",
};

export const baLcmPer2: Staff = {
  id: "us-ba-per-lcm-2" as StaffId, // Andrea Lozano
  name: "Andrea Lozano",
  initials: "AL",
  role: "BA",
  storeId: ST_PER,
  brand: "Lancôme",
};

export const baYslStf: Staff = {
  id: "us-ba-stf-ysl-2" as StaffId, // Carolina Andrade
  name: "Carolina Andrade",
  initials: "CA",
  role: "BA",
  storeId: ST_STF,
  brand: "YSL",
};

export const baLcmStf: Staff = {
  id: "us-ba-stf-lcm-1" as StaffId, // Renata Salazar
  name: "Renata Salazar",
  initials: "RS",
  role: "BA",
  storeId: ST_STF,
  brand: "Lancôme",
};

export const baLcmStf2: Staff = {
  id: "us-ba-stf-lcm-2" as StaffId, // Ximena Pereda
  name: "Ximena Pereda",
  initials: "XP",
  role: "BA",
  storeId: ST_STF,
  brand: "Lancôme",
};

export const baYslPol2: Staff = {
  id: "us-ba-pol-ysl-2" as StaffId, // Sofía Marín
  name: "Sofía Marín",
  initials: "SM",
  role: "BA",
  storeId: ST_POL,
  brand: "YSL",
};

/**
 * Synthetic BA with a brand (`Kiehl's`) that no other user in the seed
 * shares. Useful for testing "counter with only this BA" edge cases without
 * polluting the production seed.
 */
export const baKiehlsAlone: Staff = {
  id: "us-ba-pol-kls-solo" as StaffId,
  name: "BA Solo Kiehl's",
  initials: "BS",
  role: "BA",
  storeId: ST_POL,
  brand: "Kiehl's",
};

export const gerentePol: Staff = {
  id: "us-gte-pol" as StaffId, // Camila Santos
  name: "Camila Santos",
  initials: "CS",
  role: "Gerente",
  storeId: ST_POL,
};

export const gerenteStf: Staff = {
  id: "us-gte-stf" as StaffId, // Mónica Solís
  name: "Mónica Solís",
  initials: "MS",
  role: "Gerente",
  storeId: ST_STF,
};

export const gerentePer: Staff = {
  id: "us-gte-per" as StaffId, // Patricia Herrera
  name: "Patricia Herrera",
  initials: "PH",
  role: "Gerente",
  storeId: ST_PER,
};

export const supervisorCentro: Staff = {
  id: "us-sup-centro" as StaffId, // Diego Salvatierra (Polanco + Santa Fe — Perisur fuera)
  name: "Diego Salvatierra",
  initials: "DS",
  role: "Supervisor",
  storeIds: [ST_POL, ST_STF],
};

export const admin: Staff = {
  id: "us-admin" as StaffId, // Ana Lucía Ferrer
  name: "Ana Lucía Ferrer",
  initials: "AF",
  role: "Admin",
};

/** April 2026, half-open. Six purchases land inside: total $70,200. */
export const aprilPeriod = {
  from: new Date("2026-04-01T00:00:00.000Z"),
  to: new Date("2026-05-01T00:00:00.000Z"),
};

/** Q1 2026 (Jan–Mar inclusive). Contains the two new clients alta `since`. */
export const q1Period = {
  from: new Date("2026-01-01T00:00:00.000Z"),
  to: new Date("2026-04-01T00:00:00.000Z"),
};

/** A period guaranteed to contain no purchases / new clients (year 2000). */
export const emptyPeriod = {
  from: new Date("2000-01-01T00:00:00.000Z"),
  to: new Date("2000-02-01T00:00:00.000Z"),
};

/**
 * Period whose endpoints are LOCAL midnight (no Z). For queries that anchor
 * on `filters.period.to` via `startOfDay()` (the life-event queries), this
 * keeps `daysAway` calculations TZ-independent across test environments.
 *
 * The contained purchases (which are UTC-stamped) still fall inside this
 * range — boundary times of the seed are all mid-day UTC.
 */
export const aprilPeriodLocal = {
  from: new Date(2026, 3, 1), // Apr 1 00:00 local
  to: new Date(2026, 4, 1), // May 1 00:00 local
};
