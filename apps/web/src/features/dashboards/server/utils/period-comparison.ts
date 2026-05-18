import "server-only";

export interface PeriodDelta {
  current: number;
  previous: number;
  /** `current - previous`. Same units as the inputs. */
  deltaAbs: number;
  /**
   * `(current - previous) / previous`. Range: `[-1, ∞)`. Returns:
   * - `0` when both sides are 0 (no change).
   * - `null` when `previous === 0` and `current !== 0` (undefined growth rate
   *   — UI should render "—" or "nuevo" instead of "+∞%").
   */
  deltaPct: number | null;
}

/**
 * Compare two numeric values across periods (current vs previous). Both
 * inputs are assumed to be already aggregated (sum, count, avg, …). The
 * function only does arithmetic; it does not know about scope.
 */
export function comparePeriods(current: number, previous: number): PeriodDelta {
  const deltaAbs = current - previous;
  let deltaPct: number | null;
  if (previous === 0) {
    deltaPct = current === 0 ? 0 : null;
  } else {
    deltaPct = deltaAbs / previous;
  }
  return { current, previous, deltaAbs, deltaPct };
}
