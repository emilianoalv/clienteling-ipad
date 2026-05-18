import "server-only";
import type { BrandId } from "@/types/brand";
import type { Sku } from "@/types/product";
import type { Staff } from "@/types/staff";
import { productRepository } from "@/server/repositories/product.repository";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

/**
 * Top SKUs sold inside `filters.period`, aggregated per SKU and ordered by
 * `revenue` (qty × unitPrice) descending. SKUs missing from the product repo
 * are skipped silently — consistent with `getEstimatedReplenishments` and
 * the documented Bug A on `product.repository.ts` (stale store IDs).
 *
 * Default `topN = 10`. Returns an enriched row per SKU so the UI does not
 * need a follow-up query for the product name/brand.
 */
export interface TopProduct {
  sku: string;
  productName: string;
  brand: BrandId;
  unitsSold: number;
  revenue: number;
}

export async function getTopProducts(
  staff: Staff,
  filters: DashboardFilters,
  options: { topN?: number } = {},
): Promise<TopProduct[]> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return [];

  const topN = options.topN ?? 10;

  const purchases = await purchaseRepository.list({ storeIds, brands });

  const agg = new Map<string, { units: number; revenue: number }>();
  for (const p of purchases) {
    if (filters.baId && p.baId !== filters.baId) continue;
    const at = new Date(p.at);
    if (at < filters.period.from || at >= filters.period.to) continue;
    for (const item of p.items) {
      const key = item.sku as unknown as string;
      const current = agg.get(key) ?? { units: 0, revenue: 0 };
      current.units += item.qty;
      current.revenue += item.qty * item.unitPrice;
      agg.set(key, current);
    }
  }

  const enriched: TopProduct[] = [];
  await Promise.all(
    Array.from(agg.entries()).map(async ([sku, totals]) => {
      const product = await productRepository.findBySku(sku as Sku);
      if (!product) return; // skip silently — Bug A consistency
      enriched.push({
        sku,
        productName: `${product.line} ${product.size}`.trim(),
        brand: product.brand,
        unitsSold: totals.units,
        revenue: totals.revenue,
      });
    }),
  );

  enriched.sort((a, b) => b.revenue - a.revenue);
  return enriched.slice(0, topN);
}
