import "server-only";
import type { Staff } from "@/types/staff";
import { comparablePreviousPeriod } from "../utils/date-ranges";
import type { DashboardFilters } from "../types";

/**
 * Compute a metric for `filters.period` AND for the comparable previous
 * period of the same length, returning the absolute and percentage delta.
 *
 * Why a function as input? `metricFn` lets this query work with any
 * `(staff, filters) → Promise<number>` — no duplication of metric logic,
 * no coupling to a specific KPI. Pass `getSalesAmount`, `getTransactionsCount`,
 * `getAverageTicket`, etc.
 *
 * # Returns
 *
 * - `current`:   `await metricFn(staff, filters)` with `filters.period` as-is
 * - `previous`:  `await metricFn(staff, filtersAnterior)` where
 *                `filtersAnterior.period = comparablePreviousPeriod(period)`
 * - `deltaAbs`:  `current - previous` (same units)
 * - `deltaPct`:  `((current - previous) / previous) * 100`, rounded to 1
 *                decimal. Returns `0` when `previous === 0` (no Infinity,
 *                no NaN). Document this so callers know not to render `+∞%`
 *                — they may want a "nuevo" badge instead when `current > 0`.
 *
 * # Example
 *
 * ```ts
 * const delta = await getPeriodDelta(
 *   staff,
 *   { period: thisMonth() },
 *   getSalesAmount,
 * );
 * // → { current: 70200, previous: 24200, deltaAbs: 46000, deltaPct: 190.1 }
 * ```
 */
export interface PeriodDeltaResult {
  current: number;
  previous: number;
  deltaAbs: number;
  deltaPct: number;
}

export async function getPeriodDelta(
  staff: Staff,
  filters: DashboardFilters,
  metricFn: (staff: Staff, filters: DashboardFilters) => Promise<number>,
): Promise<PeriodDeltaResult> {
  const previousFilters: DashboardFilters = {
    ...filters,
    period: comparablePreviousPeriod(filters.period),
  };

  const [current, previous] = await Promise.all([
    metricFn(staff, filters),
    metricFn(staff, previousFilters),
  ]);

  const deltaAbs = current - previous;
  const deltaPct =
    previous === 0
      ? 0
      : Math.round((deltaAbs / previous) * 1000) / 10;

  return { current, previous, deltaAbs, deltaPct };
}
