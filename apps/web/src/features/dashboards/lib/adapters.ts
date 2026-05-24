/**
 * Adapters that bridge dashboard query outputs to chart component props.
 *
 * See `docs/chart-props-audit-2026-05-20.md` for the full audit. Each
 * function maps one query shape to the prop shape of a single chart.
 * Adapters are pure (no I/O, no React) so they can be unit-tested in
 * isolation and reused across Server Components.
 *
 * Naming convention: `to<Target>(input, ...context)`.
 *
 * Excluded by audit decision:
 *   - A3 (StoreRanking → ScatterPlot): the Supervisor design uses
 *     `<StoreHealthCard>` (spec §3.3) instead. ScatterPlot was removed
 *     during Día 10 cleanup.
 */

import { formatCurrencyCompact } from "@/lib/format/number";
import type { RankItem } from "@/components/charts";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import type { BaRankingEntry } from "../server/queries/get-ba-ranking";
import type { SalesByBrandResult } from "../server/queries/get-sales-by-brand";
import type { SparklineBucket } from "../server/queries/get-sparkline-data";
import type { StoreRankingEntry } from "../server/queries/get-store-ranking";

/** A1 · `getSparklineData` → `<Sparkline>` */
export function toSparklinePoints(data: readonly SparklineBucket[]): number[] {
  return data.map((d) => d.value);
}

/** A2 · `getStoreRanking` → `<RankCard>` */
export function toStoreRankCards(
  data: readonly StoreRankingEntry[],
  storesById: ReadonlyMap<StoreId, string>,
): RankItem[] {
  return data.map((s) => ({
    label: storesById.get(s.storeId) ?? s.storeName,
    value: formatCurrencyCompact(s.salesAmount),
  }));
}

/** A4 · `getSalesByBrand` → `<SplitBar>` */
export function toSplitBarData(data: SalesByBrandResult): {
  lancome: number;
  ysl: number;
  total: number;
} {
  const lancome = data.Lancome.salesAmount;
  const ysl = data.YSL.salesAmount;
  return { lancome, ysl, total: lancome + ysl };
}

/**
 * A5 · `getBaRanking` → `<BarChart>` with names and a "Tú" highlight for
 * the current BA. Luxury floor culture rewards social recognition; the
 * audit decision (2026-05-20) is to show real names rather than anonymous
 * bars.
 */
export function toBaRankingBarData(
  data: readonly BaRankingEntry[],
  myStaffId: StaffId,
  staffNameById: ReadonlyMap<StaffId, string>,
): { labels: string[]; values: number[]; highlightIndex: number } {
  return {
    labels: data.map((b) =>
      b.baId === myStaffId
        ? "Tú"
        : (staffNameById.get(b.baId) ?? b.name),
    ),
    values: data.map((b) => b.salesAmount),
    highlightIndex: data.findIndex((b) => b.baId === myStaffId),
  };
}

/** A6 · `getBaRanking` → `<RankCard>` with "Tú" for self and `isMe` flag. */
export function toBaRankCards(
  data: readonly BaRankingEntry[],
  myStaffId: StaffId,
  staffNameById: ReadonlyMap<StaffId, string>,
): RankItem[] {
  return data.map((b) => {
    const isMe = b.baId === myStaffId;
    return {
      label: isMe ? "Tú" : (staffNameById.get(b.baId) ?? b.name),
      value: formatCurrencyCompact(b.salesAmount),
      isMe,
    };
  });
}

/**
 * Multi-series adapter for `<LineChart>`. Caller invokes `getSparklineData`
 * once per scope (zone, store A, store B…) and passes the labeled series
 * here. Assumes all series share the same bucket dates — true today
 * because the bucket generator is deterministic on the `period` filter.
 */
export function toMultiSeriesLineData(
  series: ReadonlyArray<{ label: string; data: readonly SparklineBucket[] }>,
): {
  labels: string[];
  series: { label: string; values: number[] }[];
} {
  const first = series[0]?.data ?? [];
  return {
    labels: first.map((b) => b.date.toISOString()),
    series: series.map((s) => ({
      label: s.label,
      values: s.data.map((b) => b.value),
    })),
  };
}
