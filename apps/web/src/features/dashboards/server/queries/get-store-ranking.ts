import "server-only";
import type { Staff } from "@/types/staff";
import type { StoreId } from "@/types/store";
import { interactionRepository } from "@/server/repositories/interaction.repository";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { storeRepository } from "@/server/repositories/store.repository";
import { mergeScope } from "../utils/scope-merge";
import { RoleNotPermittedError } from "../errors";
import type { DashboardFilters } from "../types";

/**
 * Cross-store ranking within the staff's scope, sorted by `salesAmount`
 * descending. Ties → alphabetical by `storeName`.
 *
 * Allowed for Supervisor and Admin only. BA and Gerente both throw:
 * - BA has no cross-store concept.
 * - Gerente sees a single store → ranking of one is not a ranking.
 *
 * `franchiseName` mirrors `Store.chain` (Liverpool / Palacio). The dashboard
 * spec (RF-44) reports by franchise as well, so we expose the field here.
 *
 * `activeBas`     = count of BAs with ≥1 purchase in period for that store.
 * `activeClients` = count of unique clientas with ≥1 interaction in period
 *                   for that store.
 *
 * Default `topN = 10`.
 */
export interface StoreRankingEntry {
  storeId: StoreId;
  storeName: string;
  franchiseName: string;
  salesAmount: number;
  transactionsCount: number;
  activeBas: number;
  activeClients: number;
  rank: number;
}

export async function getStoreRanking(
  staff: Staff,
  filters: DashboardFilters,
  options: { topN?: number } = {},
): Promise<StoreRankingEntry[]> {
  if (staff.role === "BA" || staff.role === "Gerente") {
    throw new RoleNotPermittedError(staff.role, "getStoreRanking");
  }

  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return [];

  const topN = options.topN ?? 10;

  const [stores, purchases, interactions] = await Promise.all([
    storeRepository.list(),
    purchaseRepository.list({ storeIds, brands }),
    interactionRepository.list({
      storeIds,
      brands,
      from: filters.period.from,
      to: filters.period.to,
    }),
  ]);

  const storeSet = storeIds ? new Set(storeIds) : null;

  const inScope = stores.filter((s) => !storeSet || storeSet.has(s.id));

  const rows = inScope.map((store) => {
    const storeKey = store.id as unknown as string;
    let salesAmount = 0;
    let transactionsCount = 0;
    const baSet = new Set<string>();
    for (const p of purchases) {
      if ((p.storeId as unknown as string) !== storeKey) continue;
      if (filters.baId && p.baId !== filters.baId) continue;
      const at = new Date(p.at);
      if (at < filters.period.from || at >= filters.period.to) continue;
      salesAmount += p.total;
      transactionsCount += 1;
      baSet.add(p.baId as unknown as string);
    }
    const clientSet = new Set<string>();
    for (const i of interactions) {
      if ((i.storeId as unknown as string) !== storeKey) continue;
      if (filters.baId && i.baId !== filters.baId) continue;
      clientSet.add(i.clientId as unknown as string);
    }
    return {
      storeId: store.id,
      storeName: store.name,
      franchiseName: store.chain,
      salesAmount,
      transactionsCount,
      activeBas: baSet.size,
      activeClients: clientSet.size,
    };
  });

  rows.sort((a, b) => {
    if (b.salesAmount !== a.salesAmount) return b.salesAmount - a.salesAmount;
    return a.storeName.localeCompare(b.storeName);
  });

  return rows.slice(0, topN).map((r, i) => ({ ...r, rank: i + 1 }));
}
