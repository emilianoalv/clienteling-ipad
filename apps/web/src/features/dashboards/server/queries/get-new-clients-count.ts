import "server-only";
import type { Staff } from "@/types/staff";
import { clientRepository } from "@/server/repositories/client.repository";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

/**
 * Number of clients in scope whose `since` (alta) falls inside `filters.period`.
 *
 * Note: `filters.baId` is ignored here — a client is not owned by a single BA
 * (Opción A: multi-brand client is visible to both brand BAs). To get
 * BA-level acquisition, narrow scope via `storeIds` + `brands`.
 */
export async function getNewClientsCount(
  staff: Staff,
  filters: DashboardFilters,
): Promise<number> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return 0;

  const clients = await clientRepository.list({ storeIds, brands });
  return clients.reduce((count, c) => {
    const since = new Date(c.since);
    if (since < filters.period.from || since >= filters.period.to) return count;
    return count + 1;
  }, 0);
}
