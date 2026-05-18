import "server-only";
import type { Sku } from "@/types/product";
import type { Staff } from "@/types/staff";
import { productRepository } from "@/server/repositories/product.repository";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { mergeScope } from "../utils/scope-merge";
import { mapTipoToCategory } from "../utils/category-mapping";
import type { DashboardFilters } from "../types";

/**
 * Revenue breakdown across the three BRD macro-categories plus an explicit
 * `Unmapped` bucket. Unmapped catches three failure modes:
 *
 *   1. SKU not present in `productRepository` (Bug A — stale catalog).
 *   2. Product without `attrs.tipo`.
 *   3. Product with `attrs.tipo` not covered by the mapping.
 *
 * Surfacing them as `Unmapped` (instead of silently dropping) is intentional —
 * the UI/auditor can detect drift between the purchase catalog and the
 * product catalog.
 */
export interface SalesByCategory {
  Skincare: number;
  Makeup: number;
  Fragancia: number;
  Unmapped: number;
}

const ZERO: SalesByCategory = {
  Skincare: 0,
  Makeup: 0,
  Fragancia: 0,
  Unmapped: 0,
};

export async function getSalesByCategory(
  staff: Staff,
  filters: DashboardFilters,
): Promise<SalesByCategory> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return { ...ZERO };

  const purchases = await purchaseRepository.list({ storeIds, brands });

  const skuRevenue = new Map<string, number>();
  for (const p of purchases) {
    if (filters.baId && p.baId !== filters.baId) continue;
    const at = new Date(p.at);
    if (at < filters.period.from || at >= filters.period.to) continue;
    for (const item of p.items) {
      const key = item.sku as unknown as string;
      skuRevenue.set(
        key,
        (skuRevenue.get(key) ?? 0) + item.qty * item.unitPrice,
      );
    }
  }

  const totals = { ...ZERO };
  await Promise.all(
    Array.from(skuRevenue.entries()).map(async ([sku, revenue]) => {
      const product = await productRepository.findBySku(sku as Sku);
      const category = product ? mapTipoToCategory(product.attrs.tipo) : null;
      if (category) {
        totals[category] += revenue;
      } else {
        totals.Unmapped += revenue;
      }
    }),
  );
  return totals;
}
