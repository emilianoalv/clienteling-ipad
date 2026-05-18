import "server-only";
import type { ClientId } from "@/types/client";
import type { Sku } from "@/types/product";
import type { Staff } from "@/types/staff";
import { addDays, startOfDay } from "@/lib/date/week";
import { clientRepository } from "@/server/repositories/client.repository";
import { productRepository } from "@/server/repositories/product.repository";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

/**
 * Clientas in scope whose estimated replenishment date for some product
 * falls in `[anchorDay, anchorDay + windowDays)`.
 *
 * Estimated date = `lastPurchaseOfSku.at + product.lifecycleDays`. Uses the
 * product's `lifecycleDays` (already in the Product type) — no separate
 * category-based rule table.
 *
 * Notes:
 * - Only the LATEST purchase of each (client, sku) pair is considered. If
 *   the clienta repurchased the same SKU more recently, the older estimate
 *   is overridden.
 * - SKUs without a `Product` entry in the repo are skipped silently (no
 *   alert, no error). This guards against the existing stock-key bug
 *   in `product.repository.ts` (`Bug A` — out of scope here).
 * - `filters.baId` filters the underlying purchases (we attribute the
 *   alert to the BA who made the last purchase of that SKU).
 *
 * Default `windowDays = 14` (shorter than birthdays/anniversaries —
 * "imminent action" cadence).
 */
export interface EstimatedReplenishment {
  clientId: ClientId;
  name: string;
  estimatedDate: Date;
  daysAway: number;
  sku: string;
  productName: string;
  lastPurchaseDate: Date;
}

export async function getEstimatedReplenishments(
  staff: Staff,
  filters: DashboardFilters,
  options: { windowDays?: number } = {},
): Promise<EstimatedReplenishment[]> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return [];

  const windowDays = options.windowDays ?? 14;
  const anchorDay = startOfDay(filters.period.to);
  const windowEnd = addDays(anchorDay, windowDays);

  const [purchases, clients] = await Promise.all([
    purchaseRepository.list({ storeIds, brands }),
    clientRepository.list({ storeIds, brands }),
  ]);

  const clientById = new Map<string, { id: ClientId; name: string }>();
  for (const c of clients) {
    clientById.set(c.id as unknown as string, { id: c.id, name: c.name });
  }

  // For each (clientId, sku) keep the most-recent purchase timestamp.
  const lastBySkuAndClient = new Map<string, { at: Date }>();
  for (const p of purchases) {
    if (filters.baId && p.baId !== filters.baId) continue;
    if (!clientById.has(p.clientId as unknown as string)) continue;
    const at = new Date(p.at);
    for (const item of p.items) {
      const key = `${p.clientId}::${item.sku}`;
      const current = lastBySkuAndClient.get(key);
      if (!current || at > current.at) {
        lastBySkuAndClient.set(key, { at });
      }
    }
  }

  const skuToProduct = new Map<string, { name: string; lifecycleDays: number }>();
  const allSkus = new Set<string>();
  for (const key of lastBySkuAndClient.keys()) {
    const [, sku] = key.split("::");
    allSkus.add(sku!);
  }
  await Promise.all(
    Array.from(allSkus).map(async (sku) => {
      const product = await productRepository.findBySku(sku as Sku);
      if (product) {
        skuToProduct.set(sku, {
          name: `${product.line} ${product.size}`.trim(),
          lifecycleDays: product.lifecycleDays,
        });
      }
    }),
  );

  const result: EstimatedReplenishment[] = [];
  for (const [key, info] of lastBySkuAndClient) {
    const [clientId, sku] = key.split("::");
    const product = skuToProduct.get(sku!);
    if (!product) continue; // SKU not in product repo → skip silently
    const estimatedDate = addDays(info.at, product.lifecycleDays);
    if (estimatedDate < anchorDay || estimatedDate >= windowEnd) continue;

    const client = clientById.get(clientId!);
    if (!client) continue;

    const daysAway = Math.round(
      (estimatedDate.getTime() - anchorDay.getTime()) / 86_400_000,
    );
    result.push({
      clientId: client.id,
      name: client.name,
      estimatedDate,
      daysAway,
      sku: sku!,
      productName: product.name,
      lastPurchaseDate: info.at,
    });
  }

  result.sort((a, b) => a.daysAway - b.daysAway);
  return result;
}
