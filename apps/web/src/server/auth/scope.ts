import "server-only";
import type { Staff } from "@/types/staff";
import type { StoreId } from "@/types/store";

/**
 * Computes the store-scope filter for a given staff member.
 *
 * Returns:
 * - `[storeId]` for BA / Manager (single home store)
 * - `storeIds` for Supervisor (zone — N stores)
 * - `undefined` for HQ / Admin (see-everything; repository filters treat
 *   `undefined` as "no scope" and skip the where-clause entirely)
 *
 * This is the canonical helper to pass into `…ListFilter.storeIds`. Mirrors
 * `visibleStoreIds(staff, allStoreIds)` from `types/staff.ts`, but optimized
 * for the query path: HQ/Admin skip filtering instead of running an `IN`
 * against the full list of stores.
 */
export function storeScopeFor(staff: Staff): readonly StoreId[] | undefined {
  switch (staff.role) {
    case "BA":
    case "Manager":
      return [staff.storeId];
    case "Supervisor":
      return staff.storeIds;
    case "HQ":
    case "Admin":
      return undefined;
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
 * Returns the "home" store to stamp on entities created by this staff:
 * - BA / Manager → their assigned store
 * - Supervisor → first store of their zone (typical case: act on one tienda at a time)
 * - HQ / Admin → null (these roles aren't expected to create transactional
 *   records like sales/appointments/recs without explicitly choosing a store;
 *   callers should error or require an explicit storeId in input)
 */
export function homeStoreFor(staff: Staff): StoreId | null {
  switch (staff.role) {
    case "BA":
    case "Manager":
      return staff.storeId;
    case "Supervisor":
      return staff.storeIds[0] ?? null;
    case "HQ":
    case "Admin":
      return null;
  }
}
