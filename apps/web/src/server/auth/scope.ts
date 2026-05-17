import "server-only";
import type { BrandId } from "@/types/brand";
import type { Staff } from "@/types/staff";
import type { StoreId } from "@/types/store";

/**
 * Computes the store-scope filter for a given staff member.
 *
 * Returns:
 * - `[storeId]` for BA / Gerente (single home store)
 * - `storeIds` for Supervisor (zone — N stores)
 * - `undefined` for Admin (see-everything; repository filters treat
 *   `undefined` as "no scope" and skip the where-clause entirely)
 */
export function storeScopeFor(staff: Staff): readonly StoreId[] | undefined {
  switch (staff.role) {
    case "BA":
    case "Gerente":
      return [staff.storeId];
    case "Supervisor":
      return staff.storeIds;
    case "Admin":
      return undefined;
  }
}

/**
 * Computes the brand-scope filter for a given staff member.
 *
 * Returns:
 * - `[brand]` for BA (single-brand assignment per BRD RF-52)
 * - `brands` for Gerente / Supervisor / Admin (optional plural; `undefined`
 *   means no brand restriction — sees all brands of their store scope)
 *
 * Applied in PARALLEL with `storeScopeFor`: a record is visible when it
 * passes BOTH the store filter AND the brand filter (AND, not OR).
 */
export function brandScopeFor(staff: Staff): readonly BrandId[] | undefined {
  switch (staff.role) {
    case "BA":
      return [staff.brand];
    case "Gerente":
    case "Supervisor":
    case "Admin":
      return staff.brands;
  }
}

/**
 * Returns true if `entityStoreId` is visible to the given staff. Use in
 * `fetchEntityById` flows to gate direct-by-id access and return 404 when the
 * caller is out of scope (silent — doesn't leak existence).
 */
export function isStoreInScope(staff: Staff, entityStoreId: StoreId): boolean {
  const scope = storeScopeFor(staff);
  if (scope === undefined) return true;
  return scope.includes(entityStoreId);
}

/**
 * Returns true if `entityBrand` is visible to the given staff. Use alongside
 * `isStoreInScope` to gate direct-by-id access in `fetch*` flows.
 */
export function isBrandInScope(staff: Staff, entityBrand: BrandId): boolean {
  const scope = brandScopeFor(staff);
  if (scope === undefined) return true;
  return scope.includes(entityBrand);
}

/**
 * Returns the "home" store to stamp on entities created by this staff:
 * - BA / Gerente → their assigned store
 * - Supervisor → first store of their zone (typical case: act on one tienda at a time)
 * - Admin → null (these roles aren't expected to create transactional
 *   records like sales/appointments/recs without explicitly choosing a store;
 *   callers should error or require an explicit storeId in input)
 */
export function homeStoreFor(staff: Staff): StoreId | null {
  switch (staff.role) {
    case "BA":
    case "Gerente":
      return staff.storeId;
    case "Supervisor":
      return staff.storeIds[0] ?? null;
    case "Admin":
      return null;
  }
}

/**
 * Returns the "home" brand to stamp on entities created by this staff:
 * - BA → their assigned brand (always set)
 * - Others → null (must be supplied explicitly in input; create-time callers
 *   that derive brand from staff should error for these roles)
 */
export function homeBrandFor(staff: Staff): BrandId | null {
  switch (staff.role) {
    case "BA":
      return staff.brand;
    case "Gerente":
    case "Supervisor":
    case "Admin":
      return null;
  }
}
