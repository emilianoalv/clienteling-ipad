import "server-only";
import type { BrandId } from "@/types/brand";
import type { Staff } from "@/types/staff";
import { interactionRepository } from "@/server/repositories/interaction.repository";
import { mergeScope } from "../utils/scope-merge";
import { RoleNotPermittedError } from "../errors";
import { getAverageTicket } from "./get-average-ticket";
import { getRecoToPurchaseRate } from "./get-reco-to-purchase-rate";
import { getSalesAmount } from "./get-sales-amount";
import { getTopProducts } from "./get-top-products";
import { getTransactionsCount } from "./get-transactions-count";
import type { DashboardFilters } from "../types";

/**
 * Per-brand revenue breakdown with auxiliary stats. Keys are `Lancome`
 * (no accent — JSON/URL friendly) and `YSL`.
 *
 * Allowed for Gerente, Supervisor, Admin. Throws for BA — they're locked
 * to a single brand by design (RF-52); a side-by-side brand comparison is
 * not meaningful at that role.
 *
 * Each `BrandStats` reuses the CORE queries with `filters.brands = [brand]`,
 * so KPI definitions stay centralized. `activeClients` is computed inline
 * (period-based) instead of reusing `getActiveClients` because that one
 * uses a rolling-window anchored on `period.to`; here we want strict
 * period membership.
 *
 * If a brand is out of the staff's scope, its `BrandStats` collapses to
 * zeros / `[]`.
 */
export interface BrandStats {
  salesAmount: number;
  transactionsCount: number;
  averageTicket: number;
  reco2PurchaseRate: number;
  activeClients: number;
  topProducts: ReadonlyArray<{
    sku: string;
    productName: string;
    revenue: number;
  }>;
}

export interface SalesByBrandResult {
  Lancome: BrandStats;
  YSL: BrandStats;
}

const ZERO_BRAND_STATS: BrandStats = {
  salesAmount: 0,
  transactionsCount: 0,
  averageTicket: 0,
  reco2PurchaseRate: 0,
  activeClients: 0,
  topProducts: [],
};

const BRANDS_TO_REPORT: ReadonlyArray<{
  key: keyof SalesByBrandResult;
  id: BrandId;
}> = [
  { key: "Lancome", id: "Lancôme" },
  { key: "YSL", id: "YSL" },
];

export async function getSalesByBrand(
  staff: Staff,
  filters: DashboardFilters,
): Promise<SalesByBrandResult> {
  if (staff.role === "BA") {
    throw new RoleNotPermittedError(staff.role, "getSalesByBrand");
  }

  const result: SalesByBrandResult = {
    Lancome: { ...ZERO_BRAND_STATS, topProducts: [] },
    YSL: { ...ZERO_BRAND_STATS, topProducts: [] },
  };

  // If the caller explicitly narrowed `filters.brands`, brands not in that
  // list collapse to zeros. This makes "filter to LCM only" hide YSL data
  // instead of showing it anyway via the per-brand iteration.
  const brandFilter = filters.brands ? new Set(filters.brands) : null;

  await Promise.all(
    BRANDS_TO_REPORT.map(async ({ key, id }) => {
      if (brandFilter && !brandFilter.has(id)) {
        result[key] = { ...ZERO_BRAND_STATS, topProducts: [] };
        return;
      }
      const brandFilters: DashboardFilters = { ...filters, brands: [id] };
      const scope = mergeScope(staff, brandFilters);
      if (scope.isEmpty) {
        result[key] = { ...ZERO_BRAND_STATS, topProducts: [] };
        return;
      }
      const [
        salesAmount,
        transactionsCount,
        averageTicket,
        reco2PurchaseRate,
        topProducts,
        periodInteractions,
      ] = await Promise.all([
        getSalesAmount(staff, brandFilters),
        getTransactionsCount(staff, brandFilters),
        getAverageTicket(staff, brandFilters),
        getRecoToPurchaseRate(staff, brandFilters),
        getTopProducts(staff, brandFilters, { topN: 3 }),
        interactionRepository.list({
          storeIds: scope.storeIds,
          brands: scope.brands,
          from: filters.period.from,
          to: filters.period.to,
        }),
      ]);
      const clients = new Set<string>();
      for (const i of periodInteractions) {
        if (filters.baId && i.baId !== filters.baId) continue;
        clients.add(i.clientId as unknown as string);
      }
      result[key] = {
        salesAmount,
        transactionsCount,
        averageTicket,
        reco2PurchaseRate,
        activeClients: clients.size,
        topProducts: topProducts.map((p) => ({
          sku: p.sku,
          productName: p.productName,
          revenue: p.revenue,
        })),
      };
    }),
  );

  return result;
}
