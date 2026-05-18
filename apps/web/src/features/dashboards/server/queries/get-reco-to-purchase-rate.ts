import "server-only";
import type { Staff } from "@/types/staff";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { recommendationRepository } from "@/server/repositories/recommendation.repository";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

/**
 * Recommendation → purchase conversion rate.
 *
 * - Denominador: recs whose `at` (created-at) falls in `filters.period`.
 * - Numerador:   recs with `status === "converted"` whose linked Purchase
 *                (resolved via `recommendation.purchaseId`) has its `at`
 *                inside the same period.
 *
 * Note: the `Recommendation` type currently has a single `at` (the creation
 * timestamp). The "converted-at" timestamp comes from the linked purchase —
 * that's the closest proxy for "when the rec turned into revenue" without
 * adding a new field. Numerator and denominator can drift across period
 * boundaries (rec created in March, converted in April → counts in the April
 * numerator but not the April denominator), which matches the spec.
 */
export async function getRecoToPurchaseRate(
  staff: Staff,
  filters: DashboardFilters,
): Promise<number> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return 0;

  const [recs, purchases] = await Promise.all([
    recommendationRepository.list({ storeIds, brands }),
    purchaseRepository.list({ storeIds, brands }),
  ]);

  const purchaseAtById = new Map<string, string>();
  for (const p of purchases) purchaseAtById.set(p.id as unknown as string, p.at);

  let denominator = 0;
  let numerator = 0;
  for (const r of recs) {
    if (filters.baId && r.baId !== filters.baId) continue;
    const createdAt = new Date(r.at);
    if (createdAt >= filters.period.from && createdAt < filters.period.to) {
      denominator += 1;
    }
    if (r.status !== "converted" || !r.purchaseId) continue;
    const convertedIso = purchaseAtById.get(r.purchaseId as unknown as string);
    if (!convertedIso) continue;
    const convertedAt = new Date(convertedIso);
    if (convertedAt >= filters.period.from && convertedAt < filters.period.to) {
      numerator += 1;
    }
  }

  if (denominator === 0) return 0;
  return numerator / denominator;
}
