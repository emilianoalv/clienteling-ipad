import "server-only";
import type { ClientId } from "@/types/client";
import type { InteractionKind } from "@/types/interaction";
import type { Staff } from "@/types/staff";
import { clientRepository } from "@/server/repositories/client.repository";
import { interactionRepository } from "@/server/repositories/interaction.repository";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

/**
 * Top clientas by `totalSpent` in `filters.period`. Each entry is enriched
 * so the UI does not need follow-up queries.
 *
 * - `totalSpent`: sum of `purchase.total` in period.
 * - `visitsCount`: count of PRESENCIAL interactions only
 *   (`consultation` / `purchase` / `sample` / `courtesy`). Same definition
 *   as `getFollowUpToRevisitRate`, for consistency.
 * - `lastVisitDate`: `at` of the latest interaction of ANY kind in the
 *   period (whatsapp/followup included — matches the dashboard copy
 *   "Última: hace X días"). `null` if the clienta has no interaction
 *   in the period.
 *
 * A clienta with NO activity in the period (no purchase, no interaction)
 * does not appear in the result — the list is intended for "active VIPs",
 * not the whole client roster.
 *
 * Default `topN = 10`. Sort by `totalSpent` descending; ties keep input
 * order.
 *
 * Multi-brand clients (Opción A) appear for BAs of every brand they share —
 * the value of `totalSpent` for a BA's view reflects ONLY the purchases
 * inside that BA's scope, so the same clienta can show distinct totals to
 * the LCM BA and the YSL BA of the same store.
 */
export interface TopClient {
  clientId: ClientId;
  name: string;
  visitsCount: number;
  totalSpent: number;
  lastVisitDate: Date | null;
}

const PRESENCIAL_KINDS: ReadonlySet<InteractionKind> = new Set([
  "consultation",
  "purchase",
  "sample",
  "courtesy",
]);

export async function getTopClients(
  staff: Staff,
  filters: DashboardFilters,
  options: { topN?: number } = {},
): Promise<TopClient[]> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return [];

  const topN = options.topN ?? 10;

  const [clients, purchases, interactions] = await Promise.all([
    clientRepository.list({ storeIds, brands }),
    purchaseRepository.list({ storeIds, brands }),
    interactionRepository.list({
      storeIds,
      brands,
      from: filters.period.from,
      to: filters.period.to,
    }),
  ]);

  const clientById = new Map<string, { id: ClientId; name: string }>();
  for (const c of clients) {
    clientById.set(c.id as unknown as string, { id: c.id, name: c.name });
  }

  const totalSpentByClient = new Map<string, number>();
  for (const p of purchases) {
    if (filters.baId && p.baId !== filters.baId) continue;
    const key = p.clientId as unknown as string;
    if (!clientById.has(key)) continue;
    const at = new Date(p.at);
    if (at < filters.period.from || at >= filters.period.to) continue;
    totalSpentByClient.set(key, (totalSpentByClient.get(key) ?? 0) + p.total);
  }

  const visitsByClient = new Map<string, number>();
  const lastVisitByClient = new Map<string, Date>();
  for (const i of interactions) {
    if (filters.baId && i.baId !== filters.baId) continue;
    const key = i.clientId as unknown as string;
    if (!clientById.has(key)) continue;
    if (PRESENCIAL_KINDS.has(i.kind)) {
      visitsByClient.set(key, (visitsByClient.get(key) ?? 0) + 1);
    }
    const at = new Date(i.at);
    const existing = lastVisitByClient.get(key);
    if (!existing || at > existing) lastVisitByClient.set(key, at);
  }

  const activeKeys = new Set<string>([
    ...totalSpentByClient.keys(),
    ...visitsByClient.keys(),
    ...lastVisitByClient.keys(),
  ]);

  const result: TopClient[] = [];
  for (const key of activeKeys) {
    const c = clientById.get(key);
    if (!c) continue;
    result.push({
      clientId: c.id,
      name: c.name,
      visitsCount: visitsByClient.get(key) ?? 0,
      totalSpent: totalSpentByClient.get(key) ?? 0,
      lastVisitDate: lastVisitByClient.get(key) ?? null,
    });
  }

  result.sort((a, b) => b.totalSpent - a.totalSpent);
  return result.slice(0, topN);
}
