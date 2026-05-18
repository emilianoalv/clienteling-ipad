import "server-only";
import type { Staff } from "@/types/staff";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { sampleRepository } from "@/server/repositories/sample.repository";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

/**
 * Sample → purchase conversion rate.
 *
 * - Denominador: samples with `givenAt` in `filters.period`.
 * - Numerador:   samples with `converted === true` whose linked Purchase
 *                (via `purchaseId`) has its `at` inside the same period.
 *
 * Same period-drift caveat as `getRecoToPurchaseRate`: a sample handed in
 * March that converted in April lands in the April numerator but not the
 * April denominator.
 */
export async function getSampleToPurchaseRate(
  staff: Staff,
  filters: DashboardFilters,
): Promise<number> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return 0;

  const [samples, purchases] = await Promise.all([
    sampleRepository.list({ storeIds, brands }),
    purchaseRepository.list({ storeIds, brands }),
  ]);

  const purchaseAtById = new Map<string, string>();
  for (const p of purchases) purchaseAtById.set(p.id as unknown as string, p.at);

  let denominator = 0;
  let numerator = 0;
  for (const s of samples) {
    if (filters.baId && s.baId !== filters.baId) continue;
    const givenAt = new Date(s.givenAt);
    if (givenAt >= filters.period.from && givenAt < filters.period.to) {
      denominator += 1;
    }
    if (!s.converted || !s.purchaseId) continue;
    const convertedIso = purchaseAtById.get(s.purchaseId as unknown as string);
    if (!convertedIso) continue;
    const convertedAt = new Date(convertedIso);
    if (convertedAt >= filters.period.from && convertedAt < filters.period.to) {
      numerator += 1;
    }
  }

  if (denominator === 0) return 0;
  return numerator / denominator;
}
