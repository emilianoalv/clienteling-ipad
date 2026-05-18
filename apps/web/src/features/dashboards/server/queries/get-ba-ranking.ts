import "server-only";
import type { BrandId } from "@/types/brand";
import type { Staff, StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import { storeRepository } from "@/server/repositories/store.repository";
import { userRepository } from "@/server/repositories/user.repository";
import { mergeScope } from "../utils/scope-merge";
import { RoleNotPermittedError } from "../errors";
import { getRecoToPurchaseRate } from "./get-reco-to-purchase-rate";
import { getSalesAmount } from "./get-sales-amount";
import { getTransactionsCount } from "./get-transactions-count";
import type { DashboardFilters } from "../types";

/**
 * Cross-store BA ranking inside the staff's scope, sorted by `salesAmount`
 * descending. Ties → alphabetical by name (stable).
 *
 * Allowed for Gerente, Supervisor, Admin. Throws for BA — they should use
 * `getBaRankingInCounter` instead (counter-internal comparison).
 *
 * Each row reuses the CORE queries (`getSalesAmount`, `getTransactionsCount`,
 * `getRecoToPurchaseRate`) parametrized with `filters.baId = candidate.id`.
 * That keeps the math centralized — if the definition of any KPI changes,
 * the ranking inherits the change automatically.
 *
 * Default `topN = 10`.
 */
export interface BaRankingEntry {
  baId: StaffId;
  name: string;
  storeId: StoreId;
  storeName: string;
  brand: BrandId;
  salesAmount: number;
  transactionsCount: number;
  conversionRate: number;
  rank: number;
}

export async function getBaRanking(
  staff: Staff,
  filters: DashboardFilters,
  options: { topN?: number } = {},
): Promise<BaRankingEntry[]> {
  if (staff.role === "BA") {
    throw new RoleNotPermittedError(staff.role, "getBaRanking");
  }

  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return [];

  const topN = options.topN ?? 10;

  const [users, stores] = await Promise.all([
    userRepository.list(),
    storeRepository.list(),
  ]);

  const storeName = new Map<string, string>();
  for (const s of stores) storeName.set(s.id as unknown as string, s.name);

  const storeSet = storeIds ? new Set(storeIds) : null;
  const brandSet = brands ? new Set(brands) : null;

  const candidates = users.filter(
    (u) =>
      u.role === "BA" &&
      u.storeId &&
      u.brand &&
      (!storeSet || storeSet.has(u.storeId)) &&
      (!brandSet || brandSet.has(u.brand)),
  );

  const rows = await Promise.all(
    candidates.map(async (u) => {
      const baFilters: DashboardFilters = {
        ...filters,
        baId: u.id as unknown as StaffId,
      };
      const [salesAmount, transactionsCount, conversionRate] = await Promise.all([
        getSalesAmount(staff, baFilters),
        getTransactionsCount(staff, baFilters),
        getRecoToPurchaseRate(staff, baFilters),
      ]);
      return {
        baId: u.id as unknown as StaffId,
        name: u.name,
        storeId: u.storeId!,
        storeName: storeName.get(u.storeId as unknown as string) ?? "",
        brand: u.brand!,
        salesAmount,
        transactionsCount,
        conversionRate,
      };
    }),
  );

  rows.sort((a, b) => {
    if (b.salesAmount !== a.salesAmount) return b.salesAmount - a.salesAmount;
    return a.name.localeCompare(b.name);
  });

  return rows.slice(0, topN).map((r, i) => ({ ...r, rank: i + 1 }));
}
