import "server-only";
import type { Staff } from "@/types/staff";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

/**
 * Number of purchase transactions in scope inside `filters.period`.
 * One purchase = one transaction (independent of `items.length`).
 */
export async function getTransactionsCount(
  staff: Staff,
  filters: DashboardFilters,
): Promise<number> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return 0;

  const purchases = await purchaseRepository.list({ storeIds, brands });
  return purchases.reduce((count, p) => {
    const at = new Date(p.at);
    if (at < filters.period.from || at >= filters.period.to) return count;
    if (filters.baId && p.baId !== filters.baId) return count;
    return count + 1;
  }, 0);
}
