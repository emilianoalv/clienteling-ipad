import { describe, expect, it } from "vitest";
import {
  brandScopeFor,
  homeBrandFor,
  homeStoreFor,
  isBrandInScope,
  isStoreInScope,
  storeScopeFor,
} from "./scope";
import { clientRepository } from "@/server/repositories/client.repository";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { appointmentRepository } from "@/server/repositories/appointment.repository";
import { recommendationRepository } from "@/server/repositories/recommendation.repository";
import { communicationRepository } from "@/server/repositories/communication.repository";
import type { Staff, StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";

/**
 * End-to-end tests of multi-tienda + multi-marca scope (RF-52..RF-54, RNF-13/14).
 *
 * Roles per BRD:
 *   - BA: single store + single brand (Lancôme OR YSL, not both)
 *   - Gerente de Tienda: single store, all brands of that store
 *   - Supervisor de Zona: multi-store, all brands of zone
 *   - Administrador Central: nacional, all brands
 *
 * Seed (see seed.ts and user.repository.ts):
 *   Polanco  (st-pol): 5 clientas — 2 multi-brand · 2 LCM-only · 1 YSL-only
 *   Perisur  (st-per): 5 clientas — 2 multi-brand · 1 LCM-only · 2 YSL-only
 *   Santa Fe (st-stf): 5 clientas — 2 multi-brand · 2 LCM-only · 1 YSL-only
 *
 * Supervisor "Centro" covers Polanco + Santa Fe (Perisur out of zone).
 */

const ST_POL = "st-pol" as StoreId;
const ST_PER = "st-per" as StoreId;
const ST_STF = "st-stf" as StoreId;

function baseStaff(overrides: { id: string; name: string }) {
  return {
    id: overrides.id as StaffId,
    name: overrides.name,
    initials: "DU",
  } as const;
}

// Polanco BAs (1 LCM, 1 YSL)
const baPolLcm: Staff = { ...baseStaff({ id: "us-ba-pol-lcm-1", name: "Valentina Ríos" }), role: "BA", storeId: ST_POL, brand: "Lancôme" };
const baPolYsl: Staff = { ...baseStaff({ id: "us-ba-pol-ysl-1", name: "Daniela Castro" }), role: "BA", storeId: ST_POL, brand: "YSL" };
// Perisur BAs
const baPerLcm: Staff = { ...baseStaff({ id: "us-ba-per-lcm-1", name: "Regina Mendoza" }), role: "BA", storeId: ST_PER, brand: "Lancôme" };
// Santa Fe BAs
const baStfYsl: Staff = { ...baseStaff({ id: "us-ba-stf-ysl-1", name: "Paulina Treviño" }), role: "BA", storeId: ST_STF, brand: "YSL" };
// Gerente Polanco
const gtePol: Staff = { ...baseStaff({ id: "us-gte-pol", name: "Camila Santos" }), role: "Gerente", storeId: ST_POL };
// Supervisor Zona Centro (Pol + StF, NOT Per)
const supCentro: Staff = {
  ...baseStaff({ id: "us-sup-centro", name: "Diego Salvatierra" }),
  role: "Supervisor",
  storeIds: [ST_POL, ST_STF],
};
// Admin Central
const admin: Staff = { ...baseStaff({ id: "us-admin", name: "Ana Lucía Ferrer" }), role: "Admin" };

describe("storeScopeFor (helper)", () => {
  it("BA / Gerente → [own store]", () => {
    expect(storeScopeFor(baPolLcm)).toEqual([ST_POL]);
    expect(storeScopeFor(gtePol)).toEqual([ST_POL]);
  });
  it("Supervisor → zone storeIds", () => {
    expect(storeScopeFor(supCentro)).toEqual([ST_POL, ST_STF]);
  });
  it("Admin → undefined (no scope = sees everything)", () => {
    expect(storeScopeFor(admin)).toBeUndefined();
  });
});

describe("brandScopeFor (helper)", () => {
  it("BA → [single assigned brand]", () => {
    expect(brandScopeFor(baPolLcm)).toEqual(["Lancôme"]);
    expect(brandScopeFor(baPolYsl)).toEqual(["YSL"]);
  });
  it("Gerente / Supervisor / Admin → undefined (no brand filter)", () => {
    expect(brandScopeFor(gtePol)).toBeUndefined();
    expect(brandScopeFor(supCentro)).toBeUndefined();
    expect(brandScopeFor(admin)).toBeUndefined();
  });
});

describe("isStoreInScope (predicate used by fetch-* guards)", () => {
  it("BA in scope for own store, out of scope for others", () => {
    expect(isStoreInScope(baPolLcm, ST_POL)).toBe(true);
    expect(isStoreInScope(baPolLcm, ST_PER)).toBe(false);
    expect(isStoreInScope(baPolLcm, ST_STF)).toBe(false);
  });
  it("Supervisor zone Centro covers Pol + StF, NOT Per", () => {
    expect(isStoreInScope(supCentro, ST_POL)).toBe(true);
    expect(isStoreInScope(supCentro, ST_STF)).toBe(true);
    expect(isStoreInScope(supCentro, ST_PER)).toBe(false);
  });
  it("Admin in scope for any store", () => {
    expect(isStoreInScope(admin, ST_POL)).toBe(true);
    expect(isStoreInScope(admin, ST_PER)).toBe(true);
    expect(isStoreInScope(admin, ST_STF)).toBe(true);
  });
});

describe("isBrandInScope (predicate)", () => {
  it("BA Lancôme in scope for Lancôme, out for YSL", () => {
    expect(isBrandInScope(baPolLcm, "Lancôme")).toBe(true);
    expect(isBrandInScope(baPolLcm, "YSL")).toBe(false);
  });
  it("Gerente / Supervisor / Admin in scope for any brand", () => {
    expect(isBrandInScope(gtePol, "Lancôme")).toBe(true);
    expect(isBrandInScope(gtePol, "YSL")).toBe(true);
    expect(isBrandInScope(supCentro, "Lancôme")).toBe(true);
    expect(isBrandInScope(admin, "YSL")).toBe(true);
  });
});

describe("homeStoreFor / homeBrandFor (stamp helpers for create-* actions)", () => {
  it("BA → own store + own brand", () => {
    expect(homeStoreFor(baPolLcm)).toBe(ST_POL);
    expect(homeBrandFor(baPolLcm)).toBe("Lancôme");
    expect(homeBrandFor(baPolYsl)).toBe("YSL");
  });
  it("Gerente → own store, no implicit brand", () => {
    expect(homeStoreFor(gtePol)).toBe(ST_POL);
    expect(homeBrandFor(gtePol)).toBeNull();
  });
  it("Supervisor → first store of zone, no implicit brand", () => {
    expect(homeStoreFor(supCentro)).toBe(ST_POL);
    expect(homeBrandFor(supCentro)).toBeNull();
  });
  it("Admin → no implicit store, no implicit brand", () => {
    expect(homeStoreFor(admin)).toBeNull();
    expect(homeBrandFor(admin)).toBeNull();
  });
});

// ───────────────────────────────────────────────────────────────────────────
// Integration tests against the seed
// ───────────────────────────────────────────────────────────────────────────

describe("BA isolation by tienda + marca (RF-52)", () => {
  it("BA Lancôme Polanco sees only Polanco clientas that include Lancôme", async () => {
    const clients = await clientRepository.list({
      brands: brandScopeFor(baPolLcm),
      storeIds: storeScopeFor(baPolLcm),
    });
    expect(clients.every((c) => c.storeId === ST_POL)).toBe(true);
    expect(clients.every((c) => c.brands.includes("Lancôme"))).toBe(true);
    // Adriana (YSL-only Polanco) must NOT appear for the LCM BA.
    expect(clients.some((c) => c.id === ("cl-adriana" as typeof clients[0]["id"]))).toBe(false);
  });

  it("BA YSL Polanco sees only Polanco clientas that include YSL", async () => {
    const clients = await clientRepository.list({
      brands: brandScopeFor(baPolYsl),
      storeIds: storeScopeFor(baPolYsl),
    });
    expect(clients.every((c) => c.storeId === ST_POL)).toBe(true);
    expect(clients.every((c) => c.brands.includes("YSL"))).toBe(true);
    // Ofelia (LCM-only Polanco) must NOT appear for the YSL BA.
    expect(clients.some((c) => c.id === ("cl-ofelia" as typeof clients[0]["id"]))).toBe(false);
  });

  it("Clienta multi-brand de Polanco (cl-constanza) es visible para AMBOS BAs (Opción A)", async () => {
    const lcmList = await clientRepository.list({
      brands: brandScopeFor(baPolLcm),
      storeIds: storeScopeFor(baPolLcm),
    });
    const yslList = await clientRepository.list({
      brands: brandScopeFor(baPolYsl),
      storeIds: storeScopeFor(baPolYsl),
    });
    const ids = (xs: typeof lcmList) => xs.map((c) => c.id as string);
    expect(ids(lcmList)).toContain("cl-constanza");
    expect(ids(yslList)).toContain("cl-constanza");
  });

  it("BA Perisur Lancôme NO ve clientas de Polanco ni Santa Fe", async () => {
    const clients = await clientRepository.list({
      brands: brandScopeFor(baPerLcm),
      storeIds: storeScopeFor(baPerLcm),
    });
    expect(clients.every((c) => c.storeId === ST_PER)).toBe(true);
    expect(clients.every((c) => c.brands.includes("Lancôme"))).toBe(true);
  });
});

describe("Gerente — ve toda su tienda (RF-53)", () => {
  it("Gerente Polanco ve las 5 clientas de Polanco (ambas marcas)", async () => {
    const clients = await clientRepository.list({
      brands: brandScopeFor(gtePol),
      storeIds: storeScopeFor(gtePol),
    });
    expect(clients).toHaveLength(5);
    expect(clients.every((c) => c.storeId === ST_POL)).toBe(true);
    // Includes both LCM-only and YSL-only clientas:
    const ids = new Set(clients.map((c) => c.id as string));
    expect(ids.has("cl-ofelia")).toBe(true);   // LCM-only
    expect(ids.has("cl-adriana")).toBe(true);  // YSL-only
    expect(ids.has("cl-constanza")).toBe(true); // multi-brand
  });
});

describe("Supervisor — ve su zona (RF-54)", () => {
  it("Supervisor Centro ve Polanco + Santa Fe (10 clientas), NO Perisur", async () => {
    const clients = await clientRepository.list({
      brands: brandScopeFor(supCentro),
      storeIds: storeScopeFor(supCentro),
    });
    expect(clients).toHaveLength(10);
    expect(clients.every((c) => c.storeId === ST_POL || c.storeId === ST_STF)).toBe(true);
    expect(clients.some((c) => c.storeId === ST_PER)).toBe(false);
  });
});

describe("Administrador Central — ve todo (RF-55)", () => {
  it("Admin ve las 15 clientas (todas las tiendas, todas las marcas)", async () => {
    const clients = await clientRepository.list({
      brands: brandScopeFor(admin),
      storeIds: storeScopeFor(admin),
    });
    expect(clients).toHaveLength(15);
    const storeIds = new Set(clients.map((c) => c.storeId));
    expect(storeIds).toEqual(new Set([ST_POL, ST_PER, ST_STF]));
  });
});

describe("Purchase / Appointment / Recommendation / Communication respetan el scope", () => {
  it("BA Lancôme Polanco solo ve compras Lancôme en Polanco", async () => {
    const purchases = await purchaseRepository.list({
      brands: brandScopeFor(baPolLcm),
      storeIds: storeScopeFor(baPolLcm),
    });
    expect(purchases.every((p) => p.storeId === ST_POL && p.brand === "Lancôme")).toBe(true);
  });

  it("BA YSL Polanco solo ve compras YSL en Polanco", async () => {
    const purchases = await purchaseRepository.list({
      brands: brandScopeFor(baPolYsl),
      storeIds: storeScopeFor(baPolYsl),
    });
    expect(purchases.every((p) => p.storeId === ST_POL && p.brand === "YSL")).toBe(true);
  });

  it("BA Santa Fe YSL solo ve citas YSL en Santa Fe", async () => {
    const appts = await appointmentRepository.list({
      brands: brandScopeFor(baStfYsl),
      storeIds: storeScopeFor(baStfYsl),
    });
    expect(appts.every((a) => a.storeId === ST_STF && a.brand === "YSL")).toBe(true);
    expect(appts.length).toBeGreaterThan(0);
  });

  it("Recomendaciones respetan brand+store scope", async () => {
    const recsLcm = await recommendationRepository.list({
      brands: brandScopeFor(baPolLcm),
      storeIds: storeScopeFor(baPolLcm),
    });
    expect(recsLcm.every((r) => r.storeId === ST_POL && r.brand === "Lancôme")).toBe(true);
  });

  it("Comunicaciones del Supervisor Centro cubren Pol + StF, todas las marcas", async () => {
    const comms = await communicationRepository.list({
      brands: brandScopeFor(supCentro),
      storeIds: storeScopeFor(supCentro),
    });
    expect(comms.every((c) => c.storeId === ST_POL || c.storeId === ST_STF)).toBe(true);
    expect(comms.some((c) => c.storeId === ST_PER)).toBe(false);
  });

  it("Admin ve todas las compras (12) independientemente de marca/tienda", async () => {
    const purchases = await purchaseRepository.list({
      brands: brandScopeFor(admin),
      storeIds: storeScopeFor(admin),
    });
    expect(purchases).toHaveLength(12);
  });
});

describe("Acceso directo por ID es bloqueado silenciosamente (404 trigger)", () => {
  it("BA Polanco no puede acceder a cliente de Perisur (out of store)", async () => {
    const perisurClient = await clientRepository.findById("cl-cristina" as never);
    expect(perisurClient).not.toBeNull();
    expect(isStoreInScope(baPolLcm, perisurClient!.storeId)).toBe(false);
  });

  it("BA Lancôme Polanco no puede acceder a clienta YSL-only de su tienda (out of brand)", async () => {
    const adriana = await clientRepository.findById("cl-adriana" as never);
    expect(adriana).not.toBeNull();
    // Store check passes (Polanco), but brand check fails: Adriana is YSL-only.
    expect(isStoreInScope(baPolLcm, adriana!.storeId)).toBe(true);
    const matchesBrand = adriana!.brands.some((b) => brandScopeFor(baPolLcm)!.includes(b));
    expect(matchesBrand).toBe(false);
  });

  it("Supervisor Centro no puede acceder a citas de Perisur por id (out of zone)", async () => {
    const apPer = await appointmentRepository.findById("ap-6" as never);
    expect(apPer).not.toBeNull();
    expect(apPer!.storeId).toBe(ST_PER);
    expect(isStoreInScope(supCentro, apPer!.storeId)).toBe(false);
  });

  it("Admin puede acceder a cualquier ID", async () => {
    const apPer = await appointmentRepository.findById("ap-6" as never);
    expect(apPer).not.toBeNull();
    expect(isStoreInScope(admin, apPer!.storeId)).toBe(true);
    expect(isBrandInScope(admin, apPer!.brand)).toBe(true);
  });
});
