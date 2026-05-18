import type { BrandId } from "@/types/brand";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";

/** A half-open time window: `[from, to)`. */
export interface DashboardPeriod {
  from: Date;
  to: Date;
}

/**
 * Filters shared by every dashboard query.
 *
 * `storeIds` and `brands` are *user-provided overrides* on top of the staff's
 * intrinsic scope. They are intersected (not unioned) with the staff scope by
 * `mergeScope()` — see `utils/scope-merge.ts`.
 *
 * `baId` narrows results to a single BA (used by Gerente/Supervisor when they
 * drill into one of their BAs).
 */
export interface DashboardFilters {
  period: DashboardPeriod;
  storeIds?: readonly StoreId[];
  brands?: readonly BrandId[];
  baId?: StaffId;
}

/**
 * Result of intersecting staff scope with filter overrides.
 *
 * `undefined` on either side = "no restriction from that axis" (Admin sin
 * override). The query should pass `undefined` straight to the repo.
 *
 * `isEmpty: true` = the intersection collapsed to ∅ on at least one axis
 * (e.g. Gerente Polanco filtró por st-stf). Queries MUST short-circuit and
 * return their empty value (`[]` / `0` / `null`) WITHOUT calling the repo —
 * passing `[]` to a repo's filter would be interpreted as "no filter" and
 * leak out-of-scope data.
 */
export interface MergedScope {
  storeIds: readonly StoreId[] | undefined;
  brands: readonly BrandId[] | undefined;
  isEmpty: boolean;
}
