import "server-only";
import type { Staff } from "@/types/staff";
import { clientRepository } from "@/server/repositories/client.repository";
import { interactionRepository } from "@/server/repositories/interaction.repository";
import { addDays } from "@/lib/date/week";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

/**
 * Count of clients considered "at risk of churn":
 *
 *   - tienen AL MENOS UNA interaction antes de `anchor - inactivityDays`
 *     (existe historial)
 *   - SIN interaction en `[anchor - inactivityDays, anchor)`
 *     (han estado inactivas)
 *   - registradas hace `≥ minTenureDays` (`since < anchor - minTenureDays`)
 *     (filtra clientas demasiado nuevas para ser "lapsed")
 *
 * Anchor = `filters.period.to`; `from` se ignora (rolling window). Defaults:
 * `inactivityDays = 90`, `minTenureDays = 30`.
 */
export interface AtRiskClientsOptions {
  inactivityDays?: number;
  minTenureDays?: number;
}

export async function getAtRiskClients(
  staff: Staff,
  filters: DashboardFilters,
  options: AtRiskClientsOptions = {},
): Promise<number> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return 0;

  const inactivityDays = options.inactivityDays ?? 90;
  const minTenureDays = options.minTenureDays ?? 30;
  const anchor = filters.period.to;
  const windowStart = addDays(anchor, -inactivityDays);
  const tenureCutoff = addDays(anchor, -minTenureDays);

  const [interactions, clients] = await Promise.all([
    interactionRepository.list({ storeIds, brands }),
    clientRepository.list({ storeIds, brands }),
  ]);

  const hadHistory = new Set<string>();
  const recentlyActive = new Set<string>();
  for (const i of interactions) {
    if (filters.baId && i.baId !== filters.baId) continue;
    const at = new Date(i.at);
    const key = i.clientId as unknown as string;
    if (at < windowStart) hadHistory.add(key);
    if (at >= windowStart && at < anchor) recentlyActive.add(key);
  }

  let count = 0;
  for (const c of clients) {
    const key = c.id as unknown as string;
    if (!hadHistory.has(key)) continue;
    if (recentlyActive.has(key)) continue;
    if (new Date(c.since) >= tenureCutoff) continue;
    count += 1;
  }
  return count;
}
