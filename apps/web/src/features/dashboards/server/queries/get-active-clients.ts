import "server-only";
import type { Staff } from "@/types/staff";
import { interactionRepository } from "@/server/repositories/interaction.repository";
import { addDays } from "@/lib/date/week";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

/**
 * Count of unique clients with ≥1 interaction (any `kind`) inside the rolling
 * window `[anchor - activityDays, anchor)`.
 *
 * Like the other retention queries (see `get-repurchase-rate.ts`), this uses
 * `filters.period.to` as the anchor; `filters.period.from` is ignored.
 *
 * Default `activityDays = 90`.
 */
export interface ActiveClientsOptions {
  activityDays?: number;
}

export async function getActiveClients(
  staff: Staff,
  filters: DashboardFilters,
  options: ActiveClientsOptions = {},
): Promise<number> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return 0;

  const activityDays = options.activityDays ?? 90;
  const anchor = filters.period.to;
  const windowStart = addDays(anchor, -activityDays);

  const interactions = await interactionRepository.list({
    storeIds,
    brands,
    from: windowStart,
    to: anchor,
  });

  const uniqueClients = new Set<string>();
  for (const i of interactions) {
    if (filters.baId && i.baId !== filters.baId) continue;
    uniqueClients.add(i.clientId as unknown as string);
  }
  return uniqueClients.size;
}
