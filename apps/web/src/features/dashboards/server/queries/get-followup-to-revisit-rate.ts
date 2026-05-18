import "server-only";
import type { BrandId } from "@/types/brand";
import type { Staff } from "@/types/staff";
import type { StoreId } from "@/types/store";
import type { InteractionKind } from "@/types/interaction";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";
import { interactionRepository } from "@/server/repositories/interaction.repository";
import { userRepository } from "@/server/repositories/user.repository";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

/**
 * "Presencial" interactions only. WhatsApp / followup are remote and don't
 * count as a return visit even if they happen the same day.
 */
const PRESENCIAL_KINDS: ReadonlySet<InteractionKind> = new Set([
  "consultation",
  "purchase",
  "sample",
  "courtesy",
]);

const DEFAULT_WINDOW_DAYS = 30;

/**
 * Follow-up → revisita rate.
 *
 * - Denominador: follow-up tasks with `status === "done"` whose `completedAt`
 *   falls in `filters.period`.
 * - Numerador:   same set, restricted to those that have AT LEAST ONE
 *   presencial Interaction by the same client in the same counter
 *   (storeId × brand of the followup's BA) inside `[completedAt, completedAt
 *   + windowDays)`.
 *
 * "Same counter" — not "same BA" — by design: in a department-store counter
 * two BAs of the same brand collaborate on the same clients (Opción A); a
 * revisita caused by the followup may be attended by either.
 *
 * `windowDays` is exposed so callers can tune it per follow-up cadence:
 * post-sale gratitude calls may justify a tight 7-day window, sample feedback
 * a longer 30/45-day one.
 */
export async function getFollowUpToRevisitRate(
  staff: Staff,
  filters: DashboardFilters,
  windowDays: number = DEFAULT_WINDOW_DAYS,
): Promise<number> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return 0;

  const [tasks, users, interactions] = await Promise.all([
    followupTaskRepository.list({ status: "done" }),
    userRepository.list(),
    interactionRepository.list({ storeIds, brands }),
  ]);

  const baCounter = new Map<string, { storeId?: StoreId; brand?: BrandId }>();
  for (const u of users) {
    baCounter.set(u.id, { storeId: u.storeId, brand: u.brand });
  }

  const storeSet = storeIds ? new Set(storeIds) : null;
  const brandSet = brands ? new Set(brands) : null;

  const interactionsByClient = new Map<string, typeof interactions>();
  for (const i of interactions) {
    const key = i.clientId as unknown as string;
    const arr = interactionsByClient.get(key) ?? [];
    arr.push(i);
    interactionsByClient.set(key, arr);
  }

  let denominator = 0;
  let numerator = 0;

  for (const t of tasks) {
    if (!t.completedAt) continue;
    const completedAt = new Date(t.completedAt);
    if (completedAt < filters.period.from || completedAt >= filters.period.to) continue;
    if (filters.baId && t.baId !== filters.baId) continue;

    const counter = baCounter.get(t.baId as unknown as string);
    if (!counter || !counter.storeId || !counter.brand) continue;
    if (storeSet && !storeSet.has(counter.storeId)) continue;
    if (brandSet && !brandSet.has(counter.brand)) continue;

    denominator += 1;

    const windowEnd = new Date(
      completedAt.getTime() + windowDays * 24 * 60 * 60 * 1000,
    );
    const clientInts =
      interactionsByClient.get(t.clientId as unknown as string) ?? [];
    const hasRevisita = clientInts.some((i) => {
      if (!PRESENCIAL_KINDS.has(i.kind)) return false;
      if (i.storeId !== counter.storeId) return false;
      if (i.brand !== counter.brand) return false;
      const iAt = new Date(i.at);
      return iAt >= completedAt && iAt < windowEnd;
    });
    if (hasRevisita) numerator += 1;
  }

  if (denominator === 0) return 0;
  return numerator / denominator;
}
