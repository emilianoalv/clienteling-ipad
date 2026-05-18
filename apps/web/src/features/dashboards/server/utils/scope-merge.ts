import "server-only";
import type { Staff } from "@/types/staff";
import { brandScopeFor, storeScopeFor } from "@/server/auth/scope";
import type { DashboardFilters, MergedScope } from "../types";

/**
 * # Design note: the `isEmpty` flag is defense-in-depth, not redundant.
 *
 * Repositories treat `storeIds: []` as "no filter" — their guard is
 * `if (scope && scope.length && !scope.includes(x))`. If a query with an
 * empty intersection passed `[]` straight to a repo, it would receive the
 * full dataset (scope leak). The `isEmpty` flag forces every query to
 * short-circuit *before* the repo call (`return []` / `return 0`), so the
 * "no data" decision is explicit and centralized here rather than relying
 * on every caller to remember the `.length === 0` check.
 *
 * # Behavior
 *
 * - `undefined` from a side = "no restriction on that axis" (typical Admin).
 * - When both sides have explicit lists → return their set intersection.
 * - When the intersection collapses to ∅ on at least one axis → mark
 *   `isEmpty: true`. Downstream queries MUST honor this.
 * - Empty-array overrides (`storeIds: []`) are treated as "no override",
 *   since UIs typically use `undefined` for "nothing selected". An explicit
 *   non-empty override outside the staff's scope is what triggers `isEmpty`.
 */
export function mergeScope(staff: Staff, filters: DashboardFilters): MergedScope {
  const staffStores = storeScopeFor(staff);
  const staffBrands = brandScopeFor(staff);
  const stores = intersect(staffStores, normalize(filters.storeIds));
  const brands = intersect(staffBrands, normalize(filters.brands));
  const isEmpty =
    (stores !== undefined && stores.length === 0) ||
    (brands !== undefined && brands.length === 0);
  return { storeIds: stores, brands, isEmpty };
}

function normalize<T>(xs: readonly T[] | undefined): readonly T[] | undefined {
  if (xs === undefined) return undefined;
  return xs.length === 0 ? undefined : xs;
}

function intersect<T>(
  staffScope: readonly T[] | undefined,
  override: readonly T[] | undefined,
): readonly T[] | undefined {
  if (!staffScope && !override) return undefined;
  if (!override) return staffScope;
  if (!staffScope) return override;
  const set = new Set(override);
  return staffScope.filter((x) => set.has(x));
}
