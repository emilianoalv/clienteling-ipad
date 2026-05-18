import "server-only";
import type { BrandId } from "@/types/brand";
import type { Staff } from "@/types/staff";
import type { StoreId } from "@/types/store";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";
import { userRepository } from "@/server/repositories/user.repository";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

/**
 * Number of follow-up tasks **completed** in `filters.period`. "Completed" =
 * `status === "done"` with `completedAt` inside the period.
 *
 * Scope filter: the task's BA must belong to a store + brand inside the merged
 * scope. `filters.baId` further narrows to a single BA when set.
 *
 * Followup tasks don't carry `storeId` / `brand` directly, so we resolve the
 * BA's store + brand via `userRepository`.
 */
export async function getFollowUpsCount(
  staff: Staff,
  filters: DashboardFilters,
): Promise<number> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return 0;

  const [tasks, users] = await Promise.all([
    followupTaskRepository.list({ status: "done" }),
    userRepository.list(),
  ]);

  const staffScope = new Map<string, { storeId?: StoreId; brand?: BrandId }>();
  for (const u of users) {
    staffScope.set(u.id, { storeId: u.storeId, brand: u.brand });
  }

  const storeSet = storeIds ? new Set(storeIds) : null;
  const brandSet = brands ? new Set(brands) : null;

  return tasks.reduce((count, t) => {
    if (!t.completedAt) return count;
    const at = new Date(t.completedAt);
    if (at < filters.period.from || at >= filters.period.to) return count;
    if (filters.baId && t.baId !== filters.baId) return count;
    const owner = staffScope.get(t.baId as unknown as string);
    if (!owner) return count;
    if (storeSet && (!owner.storeId || !storeSet.has(owner.storeId))) return count;
    if (brandSet && (!owner.brand || !brandSet.has(owner.brand))) return count;
    return count + 1;
  }, 0);
}
