import type { Purchase } from "@/types/purchase";
import type { Sample } from "@/types/sample";

const DAY_MS = 86_400_000;

export interface SampleStats {
  /** Samples delivered in the last `windowDays`. */
  delivered: number;
  /** Conversion rate across the whole sample set, 0..1. */
  conversionRate: number;
  /** Revenue attributable to converted samples — sum of linked purchase totals. */
  attributableRevenue: number;
}

export interface SampleStatsOptions {
  windowDays?: number;
  now?: Date;
}

/**
 * Aggregates samples into the KPI strip shown on the prototype's `ScreenSamples`.
 * Pure — does not touch repositories.
 */
export function aggregateSampleStats(
  samples: readonly Sample[],
  purchases: readonly Purchase[],
  opts: SampleStatsOptions = {},
): SampleStats {
  const now = (opts.now ?? new Date()).getTime();
  const windowDays = opts.windowDays ?? 7;
  const cutoff = now - windowDays * DAY_MS;

  const delivered = samples.filter((s) => new Date(s.givenAt).getTime() >= cutoff).length;

  const converted = samples.filter((s) => s.converted);
  const conversionRate = samples.length > 0 ? converted.length / samples.length : 0;

  const purchasesById = new Map(purchases.map((p) => [p.id, p]));
  const attributableRevenue = converted.reduce((sum, s) => {
    if (!s.purchaseId) return sum;
    return sum + (purchasesById.get(s.purchaseId)?.total ?? 0);
  }, 0);

  return { delivered, conversionRate, attributableRevenue };
}
