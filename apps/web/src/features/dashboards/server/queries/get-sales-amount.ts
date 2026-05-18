import "server-only";
import type { Staff } from "@/types/staff";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

/**
 * Sum of `purchase.total` across all purchases in scope whose `at` falls in
 * `filters.period` (half-open `[from, to)`).
 *
 * Empty scope intersection short-circuits to 0 (see scope-merge.ts).
 */
export async function getSalesAmount(
  staff: Staff,
  filters: DashboardFilters,
): Promise<number> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return 0;

  const purchases = await purchaseRepository.list({ storeIds, brands });
  return purchases.reduce((sum, p) => {
    const at = new Date(p.at);
    if (at < filters.period.from || at >= filters.period.to) return sum;
    if (filters.baId && p.baId !== filters.baId) return sum;
    return sum + p.total;
  }, 0);
}
