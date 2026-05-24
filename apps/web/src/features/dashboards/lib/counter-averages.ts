import type { BrandId } from "@/types/brand";
import type { BaRankingEntry } from "../server/queries";

export interface BrandCounterAverages {
  /** Mean sales per BA in the brand counter. */
  avgSales: number;
  /** Mean reco→purchase rate (0-100) across BAs in the brand counter. */
  avgConversionRate: number;
  /** Number of BAs in this brand counter — informational. */
  baCount: number;
}

/**
 * Group a `getBaRanking` result by brand and compute the within-brand
 * averages. Used by the Gerente/Supervisor dashboards to surface "vs counter"
 * comparisons without needing a BA-only query like `getCounterAverages`.
 *
 * Brands without any BAs in the input are absent from the returned map; the
 * caller should treat a missing key as "no peers".
 */
export function computeCounterAveragesByBrand(
  ranking: readonly BaRankingEntry[],
): Map<BrandId, BrandCounterAverages> {
  const byBrand = new Map<BrandId, BaRankingEntry[]>();
  for (const entry of ranking) {
    const arr = byBrand.get(entry.brand) ?? [];
    arr.push(entry);
    byBrand.set(entry.brand, arr);
  }

  const out = new Map<BrandId, BrandCounterAverages>();
  for (const [brand, entries] of byBrand) {
    if (entries.length === 0) continue;
    const avgSales =
      entries.reduce((s, e) => s + e.salesAmount, 0) / entries.length;
    const avgConversionRate =
      entries.reduce((s, e) => s + e.conversionRate, 0) / entries.length;
    out.set(brand, {
      avgSales,
      avgConversionRate,
      baCount: entries.length,
    });
  }
  return out;
}
