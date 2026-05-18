import "server-only";
import type { BrandId } from "@/types/brand";
import type { ClientId } from "@/types/client";
import type {
  FollowupTaskId,
  FollowupType,
} from "@/types/followup-task";
import type { Staff, StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";
import { userRepository } from "@/server/repositories/user.repository";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

/**
 * Pending follow-up tasks visible to the requesting staff, with a
 * priority-aware sort:
 *
 *   1. OVERDUE first (`dueAt < anchor`), oldest first (longest neglected).
 *   2. Then UPCOMING, soonest first (most imminent).
 *
 * Anchor = `filters.period.to`. No size limit — UI may `slice(0, N)`.
 *
 * Scope: a task is visible iff its `baId`'s store + brand fall inside the
 * merged scope. `FollowupTask` does not carry storeId/brand directly, so
 * we resolve through `userRepository`.
 */
export interface PendingFollowup {
  taskId: FollowupTaskId;
  clientId: ClientId;
  baId: StaffId;
  description: string;
  type: FollowupType;
  dueAt: Date;
  isOverdue: boolean;
}

export async function getPendingFollowups(
  staff: Staff,
  filters: DashboardFilters,
): Promise<PendingFollowup[]> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return [];

  const [tasks, users] = await Promise.all([
    followupTaskRepository.list({ status: "pending" }),
    userRepository.list(),
  ]);

  const owner = new Map<string, { storeId?: StoreId; brand?: BrandId }>();
  for (const u of users) owner.set(u.id, { storeId: u.storeId, brand: u.brand });

  const storeSet = storeIds ? new Set(storeIds) : null;
  const brandSet = brands ? new Set(brands) : null;
  const anchor = filters.period.to;

  const out: PendingFollowup[] = [];
  for (const t of tasks) {
    if (filters.baId && t.baId !== filters.baId) continue;
    const o = owner.get(t.baId as unknown as string);
    if (!o || !o.storeId || !o.brand) continue;
    if (storeSet && !storeSet.has(o.storeId)) continue;
    if (brandSet && !brandSet.has(o.brand)) continue;

    const dueAt = new Date(t.dueAt);
    out.push({
      taskId: t.id,
      clientId: t.clientId,
      baId: t.baId,
      description: t.description,
      type: t.type,
      dueAt,
      isOverdue: dueAt < anchor,
    });
  }

  out.sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
    return a.dueAt.getTime() - b.dueAt.getTime();
  });
  return out;
}
