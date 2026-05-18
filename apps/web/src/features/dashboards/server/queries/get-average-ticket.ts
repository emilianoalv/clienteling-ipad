import "server-only";
import type { Staff } from "@/types/staff";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

/**
 * Average value of purchases in scope inside `filters.period`.
 *
 * When there are no purchases in the period, returns `0` (per design decision
 * with the user). Callers should pair this with `getTransactionsCount` to
 * distinguish "no sales" from "avg ticket of 0".
 */
export async function getAverageTicket(
  staff: Staff,
  filters: DashboardFilters,
): Promise<number> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return 0;

  const purchases = await purchaseRepository.list({ storeIds, brands });
  let total = 0;
  let count = 0;
  for (const p of purchases) {
    const at = new Date(p.at);
    if (at < filters.period.from || at >= filters.period.to) continue;
    if (filters.baId && p.baId !== filters.baId) continue;
    total += p.total;
    count += 1;
  }
  if (count === 0) return 0;
  return total / count;
}
