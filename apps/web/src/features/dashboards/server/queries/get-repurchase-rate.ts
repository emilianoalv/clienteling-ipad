import "server-only";
import type { Staff } from "@/types/staff";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { addMonths } from "@/lib/date/week";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

/**
 * # Note on retention KPIs
 *
 * Retention queries (this one, `getActiveClients`, `getAtRiskClients`) do NOT
 * use `filters.period` as a traditional inclusion filter. Instead they use a
 * rolling window anchored to a single point in time — by convention
 * `filters.period.to`. The `from` of the period is ignored.
 *
 * # Repurchase rate (cohort analysis)
 *
 * - DENOMINADOR: clientas with ≥1 purchase in
 *   `[anchor - (lookback + cohort), anchor - lookback)`
 *   ("did they buy during the cohort window?").
 * - NUMERADOR: of those, clientas with ≥1 additional purchase in
 *   `[anchor - lookback, anchor)`
 *   ("did they come back during the lookback window?").
 *
 * Returns a percentage rounded to one decimal (0–100), e.g. `66.7`.
 * Denominator 0 → 0.
 *
 * Defaults: `cohortWindowMonths = 6`, `lookbackMonths = 6`. Both are
 * overridable for shorter cadences (post-launch, monthly retention dashboards).
 */
export interface RepurchaseRateOptions {
  cohortWindowMonths?: number;
  lookbackMonths?: number;
}

export async function getRepurchaseRate(
  staff: Staff,
  filters: DashboardFilters,
  options: RepurchaseRateOptions = {},
): Promise<number> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return 0;

  const cohortMonths = options.cohortWindowMonths ?? 6;
  const lookbackMonths = options.lookbackMonths ?? 6;
  const anchor = filters.period.to;

  const cohortFrom = addMonths(anchor, -(lookbackMonths + cohortMonths));
  const cohortTo = addMonths(anchor, -lookbackMonths);
  const lookbackTo = anchor;

  const purchases = await purchaseRepository.list({ storeIds, brands });

  const cohortClients = new Set<string>();
  for (const p of purchases) {
    if (filters.baId && p.baId !== filters.baId) continue;
    const at = new Date(p.at);
    if (at >= cohortFrom && at < cohortTo) {
      cohortClients.add(p.clientId as unknown as string);
    }
  }

  if (cohortClients.size === 0) return 0;

  const repurchased = new Set<string>();
  for (const p of purchases) {
    if (filters.baId && p.baId !== filters.baId) continue;
    const at = new Date(p.at);
    if (at < cohortTo || at >= lookbackTo) continue;
    const key = p.clientId as unknown as string;
    if (cohortClients.has(key)) repurchased.add(key);
  }

  return Math.round((repurchased.size / cohortClients.size) * 1000) / 10;
}
