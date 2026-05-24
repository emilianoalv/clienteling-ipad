import type { Role } from "@/types/staff";
import type { StoreId } from "@/types/store";
import type { User } from "@/types/user";
import type { Interaction } from "@/types/interaction";

/**
 * Platform adoption metrics for the Admin Sec 6 (spec §3.4).
 *
 * Active = the user logged at least one `Interaction` in the last 7 days.
 * Computed twice: grouped by role, and grouped by store.
 */

export interface AdoptionByRole {
  role: Role;
  activeCount: number;
  totalCount: number;
  percent: number;
}

export interface AdoptionByStore {
  storeId: StoreId;
  storeName: string;
  activeCount: number;
  totalCount: number;
  percent: number;
}

export interface AdoptionData {
  byRole: AdoptionByRole[];
  byStore: AdoptionByStore[];
}

const ROLE_ORDER: readonly Role[] = ["BA", "Gerente", "Supervisor", "Admin"];

export function computeAdoptionData(
  users: readonly User[],
  recentInteractions: readonly Interaction[],
  storeNamesById: ReadonlyMap<StoreId, string>,
): AdoptionData {
  const activeUserIds = new Set<string>();
  for (const i of recentInteractions) {
    activeUserIds.add(i.baId as unknown as string);
  }

  const byRole = ROLE_ORDER.map((role) => {
    const inRole = users.filter((u) => u.role === role);
    const total = inRole.length;
    const active = inRole.filter((u) =>
      activeUserIds.has(u.id as unknown as string),
    ).length;
    return {
      role,
      activeCount: active,
      totalCount: total,
      percent: total > 0 ? Math.round((active / total) * 100) : 0,
    };
  }).filter((r) => r.totalCount > 0);

  const storeBuckets = new Map<
    StoreId,
    { active: number; total: number }
  >();
  for (const u of users) {
    if (!u.storeId) continue;
    const bucket = storeBuckets.get(u.storeId) ?? { active: 0, total: 0 };
    bucket.total += 1;
    if (activeUserIds.has(u.id as unknown as string)) {
      bucket.active += 1;
    }
    storeBuckets.set(u.storeId, bucket);
  }

  const byStore: AdoptionByStore[] = Array.from(storeBuckets.entries())
    .map(([storeId, b]) => ({
      storeId,
      storeName: storeNamesById.get(storeId) ?? (storeId as unknown as string),
      activeCount: b.active,
      totalCount: b.total,
      percent: b.total > 0 ? Math.round((b.active / b.total) * 100) : 0,
    }))
    .sort((a, b) => a.storeName.localeCompare(b.storeName));

  return { byRole, byStore };
}
