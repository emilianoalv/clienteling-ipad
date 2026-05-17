import type { BrandId } from "./brand";
import type { Branded } from "./branded";
import type { StoreId } from "./store";

export type StaffId = Branded<string, "Staff">;

/**
 * Roles per the BRD. Note: BRD names are Spanish ("Gerente de Tienda",
 * "Supervisor de Zona", "Administrador Central"); we keep the short
 * single-token form in code. `Manager` was renamed to `Gerente` to match
 * the BRD. The legacy `HQ` role was removed (not in BRD); its read-only
 * operational needs are covered by `Admin`.
 */
export type Role = "BA" | "Gerente" | "Supervisor" | "Admin";

export interface StaffBase {
  id: StaffId;
  name: string;
  initials: string;
}

/**
 * BA = Beauty Advisor. Owned by exactly one store + one brand (RF-52).
 * `brand` is singular because a BA represents a specific brand counter
 * inside a department store (Lancôme BA vs YSL BA in the same Liverpool).
 */
export type BA = StaffBase & { role: "BA"; storeId: StoreId; brand: BrandId };

/**
 * Gerente de Tienda. Sees every BA + every brand within their store.
 * `brands` is optional (undefined = no brand filter = sees all brands of
 * their store).
 */
export type Gerente = StaffBase & {
  role: "Gerente";
  storeId: StoreId;
  brands?: readonly BrandId[];
};

/**
 * Supervisor de Zona. Sees every store under their responsibility.
 * `brands` optional, same semantics as Gerente.
 */
export type Supervisor = StaffBase & {
  role: "Supervisor";
  storeIds: readonly StoreId[];
  brands?: readonly BrandId[];
};

/**
 * Administrador Central. National scope, all stores + all brands.
 * `brands` optional purely for symmetry; in practice always undefined.
 */
export type Admin = StaffBase & { role: "Admin"; brands?: readonly BrandId[] };

export type Staff = BA | Gerente | Supervisor | Admin;

/** Stores visible to a staff member (server should always validate against this). */
export function visibleStoreIds(staff: Staff, allStoreIds: readonly StoreId[]): readonly StoreId[] {
  switch (staff.role) {
    case "BA":
    case "Gerente":
      return [staff.storeId];
    case "Supervisor":
      return staff.storeIds;
    case "Admin":
      return allStoreIds;
  }
}
