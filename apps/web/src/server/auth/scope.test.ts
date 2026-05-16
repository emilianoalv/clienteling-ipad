import { describe, expect, it } from "vitest";
import { homeStoreFor, isStoreInScope, storeScopeFor } from "./scope";
import { clientRepository } from "@/server/repositories/client.repository";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { appointmentRepository } from "@/server/repositories/appointment.repository";
import { recommendationRepository } from "@/server/repositories/recommendation.repository";
import { communicationRepository } from "@/server/repositories/communication.repository";
import type { BrandId } from "@/types/brand";
import type { Staff, StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";

/**
 * End-to-end tests of the multi-store scope.
 *
 * Exercises the four roles from RF-52..RF-54 + the Admin global-access case
 * against the real seed data in `server/repositories/seed.ts`. Covers:
 *
 *   1. `storeScopeFor` / `isStoreInScope` / `homeStoreFor` (pure helpers)
 *   2. List queries respect store scope (Client/Purchase/Appointment/Rec/Comm)
 *   3. Direct ID access (the predicate used inside `fetchClient`/`fetchAppointment`)
 *      blocks out-of-scope entities silently — same response as a real 404.
 *
 * Seed distribution (see seed.ts header):
 *   - Polanco  (st-pol): 5 clientas
 *   - Perisur  (st-per): 5 clientas
 *   - Santa Fe (st-stf): 5 clientas
 */

const ST_POL = "st-pol" as StoreId;
const ST_PER = "st-per" as StoreId;
const ST_STF = "st-stf" as StoreId;
const BOTH_BRANDS: readonly BrandId[] = ["Lancôme", "YSL"];

function baseStaff(overrides: { id: string; name: string }) {
  return {
    id: overrides.id as StaffId,
    name: overrides.name,
    initials: "DU",
    brands: BOTH_BRANDS,
  } as const;
}

const baPolanco: Staff = { ...baseStaff({ id: "us-ba-pol-1", name: "Valentina Ríos" }), role: "BA", storeId: ST_POL };
const baPerisur: Staff = { ...baseStaff({ id: "us-ba-per-1", name: "Daniela Castro" }), role: "BA", storeId: ST_PER };
const baSantaFe: Staff = { ...baseStaff({ id: "us-ba-stf-1", name: "Camila Santos" }), role: "BA", storeId: ST_STF };
const mgrPolanco: Staff = { ...baseStaff({ id: "us-mgr-pol", name: "Paulina Treviño" }), role: "Manager", storeId: ST_POL };
const supervisorNorte: Staff = {
  ...baseStaff({ id: "us-sup-norte", name: "Diego Salvatierra" }),
  role: "Supervisor",
  storeIds: [ST_POL, ST_PER],
};
const admin: Staff = { ...baseStaff({ id: "us-admin", name: "Ana Lucía Ferrer" }), role: "Admin" };
const hq: Staff = { ...baseStaff({ id: "us-hq", name: "HQ User" }), role: "HQ" };

describe("storeScopeFor (helper)", () => {
  it("BA → [own store]", () => {
    expect(storeScopeFor(baPolanco)).toEqual([ST_POL]);
  });
  it("Manager → [own store]", () => {
    expect(storeScopeFor(mgrPolanco)).toEqual([ST_POL]);
  });
  it("Supervisor → zone storeIds", () => {
    expect(storeScopeFor(supervisorNorte)).toEqual([ST_POL, ST_PER]);
  });
  it("HQ → undefined (no scope = sees everything)", () => {
    expect(storeScopeFor(hq)).toBeUndefined();
  });
  it("Admin → undefined (no scope = sees everything)", () => {
    expect(storeScopeFor(admin)).toBeUndefined();
  });
});

describe("isStoreInScope (predicate used by fetch-* guards)", () => {
  it("BA in scope when entity is in their store", () => {
    expect(isStoreInScope(baPolanco, ST_POL)).toBe(true);
  });
  it("BA out of scope for another store (silent 404 trigger)", () => {
    expect(isStoreInScope(baPolanco, ST_PER)).toBe(false);
    expect(isStoreInScope(baPolanco, ST_STF)).toBe(false);
  });
  it("Manager out of scope for any other store", () => {
    expect(isStoreInScope(mgrPolanco, ST_PER)).toBe(false);
    expect(isStoreInScope(mgrPolanco, ST_STF)).toBe(false);
  });
  it("Supervisor in scope for all stores of their zone", () => {
    expect(isStoreInScope(supervisorNorte, ST_POL)).toBe(true);
    expect(isStoreInScope(supervisorNorte, ST_PER)).toBe(true);
  });
  it("Supervisor out of scope for stores outside their zone", () => {
    expect(isStoreInScope(supervisorNorte, ST_STF)).toBe(false);
  });
  it("Admin / HQ in scope for any store", () => {
    expect(isStoreInScope(admin, ST_POL)).toBe(true);
    expect(isStoreInScope(admin, ST_STF)).toBe(true);
    expect(isStoreInScope(hq, ST_STF)).toBe(true);
  });
});

describe("homeStoreFor (helper for create-* actions)", () => {
  it("BA / Manager → assigned store", () => {
    expect(homeStoreFor(baPolanco)).toBe(ST_POL);
    expect(homeStoreFor(mgrPolanco)).toBe(ST_POL);
  });
  it("Supervisor → first store of zone", () => {
    expect(homeStoreFor(supervisorNorte)).toBe(ST_POL);
  });
  it("HQ / Admin → null (no implicit home store)", () => {
    expect(homeStoreFor(hq)).toBeNull();
    expect(homeStoreFor(admin)).toBeNull();
  });
});

describe("Client list isolation (RF-52)", () => {
  it("BA in Polanco only sees Polanco's 5 clientas", async () => {
    const clients = await clientRepository.list({
      brands: baPolanco.brands,
      storeIds: storeScopeFor(baPolanco),
    });
    expect(clients).toHaveLength(5);
    expect(clients.every((c) => c.storeId === ST_POL)).toBe(true);
  });

  it("BA in Perisur sees only Perisur clientas — no leak from Polanco/SantaFe", async () => {
    const clients = await clientRepository.list({
      brands: baPerisur.brands,
      storeIds: storeScopeFor(baPerisur),
    });
    expect(clients).toHaveLength(5);
    expect(clients.every((c) => c.storeId === ST_PER)).toBe(true);
    expect(clients.some((c) => c.id === ("cl-valentina" as typeof clients[0]["id"]))).toBe(false);
  });

  it("Manager sees the full store (RF-53)", async () => {
    const clients = await clientRepository.list({
      brands: mgrPolanco.brands,
      storeIds: storeScopeFor(mgrPolanco),
    });
    expect(clients).toHaveLength(5);
    expect(clients.every((c) => c.storeId === ST_POL)).toBe(true);
  });

  it("Supervisor sees only the stores of their zone (RF-54)", async () => {
    const clients = await clientRepository.list({
      brands: supervisorNorte.brands,
      storeIds: storeScopeFor(supervisorNorte),
    });
    expect(clients).toHaveLength(10);
    expect(clients.every((c) => c.storeId === ST_POL || c.storeId === ST_PER)).toBe(true);
    expect(clients.some((c) => c.storeId === ST_STF)).toBe(false);
  });

  it("Admin sees all 15 across the 3 stores", async () => {
    const clients = await clientRepository.list({
      brands: admin.brands,
      storeIds: storeScopeFor(admin),
    });
    expect(clients).toHaveLength(15);
    const storeIds = new Set(clients.map((c) => c.storeId));
    expect(storeIds.has(ST_POL)).toBe(true);
    expect(storeIds.has(ST_PER)).toBe(true);
    expect(storeIds.has(ST_STF)).toBe(true);
  });
});

describe("Purchase list isolation (feeds RF-40 / RF-44 / RF-45 store-scoped reports)", () => {
  it("BA in Polanco only sees Polanco purchases", async () => {
    const purchases = await purchaseRepository.list({ storeIds: storeScopeFor(baPolanco) });
    expect(purchases.every((p) => p.storeId === ST_POL)).toBe(true);
    expect(purchases.length).toBe(4);
  });
  it("Supervisor sees Polanco + Perisur purchases", async () => {
    const purchases = await purchaseRepository.list({ storeIds: storeScopeFor(supervisorNorte) });
    expect(purchases.length).toBe(8);
    expect(purchases.every((p) => p.storeId === ST_POL || p.storeId === ST_PER)).toBe(true);
  });
  it("Admin sees all purchases (12)", async () => {
    const purchases = await purchaseRepository.list({ storeIds: storeScopeFor(admin) });
    expect(purchases.length).toBe(12);
  });
});

describe("Appointment / Recommendation / Communication list isolation", () => {
  it("Appointments respect store scope for a BA", async () => {
    const appts = await appointmentRepository.list({ storeIds: storeScopeFor(baSantaFe) });
    expect(appts.length).toBeGreaterThan(0);
    expect(appts.every((a) => a.storeId === ST_STF)).toBe(true);
  });

  it("Recommendations respect store scope for a Manager", async () => {
    const recs = await recommendationRepository.list({ storeIds: storeScopeFor(mgrPolanco) });
    expect(recs.every((r) => r.storeId === ST_POL)).toBe(true);
  });

  it("Communications respect store scope for a Supervisor (zona)", async () => {
    const comms = await communicationRepository.list({ storeIds: storeScopeFor(supervisorNorte) });
    expect(comms.every((c) => c.storeId === ST_POL || c.storeId === ST_PER)).toBe(true);
    expect(comms.some((c) => c.storeId === ST_STF)).toBe(false);
  });
});

describe("Direct-by-ID access is blocked silently (404 trigger predicate)", () => {
  it("BA in Polanco trying to fetch a Perisur client → out of scope", async () => {
    // cl-paola lives in Perisur per seed.ts
    const perisurClient = await clientRepository.findById("cl-paola" as never);
    expect(perisurClient).not.toBeNull();
    // The repo returns the client, but the fetch-client guard would notFound():
    expect(isStoreInScope(baPolanco, perisurClient!.storeId)).toBe(false);
  });

  it("BA in Polanco can fetch a Polanco client directly", async () => {
    const polancoClient = await clientRepository.findById("cl-valentina" as never);
    expect(polancoClient).not.toBeNull();
    expect(isStoreInScope(baPolanco, polancoClient!.storeId)).toBe(true);
  });

  it("BA trying to access an out-of-zone appointment by ID is blocked", async () => {
    // ap-10 is a Santa Fe appointment per appointment.repository.ts seed
    const stfAppointment = await appointmentRepository.findById("ap-10" as never);
    expect(stfAppointment).not.toBeNull();
    expect(isStoreInScope(baPolanco, stfAppointment!.storeId)).toBe(false);
    expect(isStoreInScope(supervisorNorte, stfAppointment!.storeId)).toBe(false);
    expect(isStoreInScope(admin, stfAppointment!.storeId)).toBe(true);
  });

  it("Out-of-scope and not-found are indistinguishable to the caller", () => {
    // Both paths return the same falsy outcome (notFound() in real code).
    const fakeStoreId = "st-does-not-exist" as StoreId;
    expect(isStoreInScope(baPolanco, fakeStoreId)).toBe(false);
    expect(isStoreInScope(baPolanco, ST_PER)).toBe(false);
    // Same response for both: the guard would call notFound() in either case.
  });
});
