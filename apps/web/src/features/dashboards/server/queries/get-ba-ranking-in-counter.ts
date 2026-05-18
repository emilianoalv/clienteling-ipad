import "server-only";
import type { Staff, StaffId } from "@/types/staff";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { userRepository } from "@/server/repositories/user.repository";
import { mergeScope } from "../utils/scope-merge";
import { RoleNotPermittedError } from "../errors";
import type { DashboardFilters } from "../types";

/**
 * Rank the BAs of the requesting BA's counter (same `storeId` × same `brand`)
 * by `salesAmount` in `filters.period`, and return:
 *
 * - `myRank`: 1-indexed position of the requesting BA (1 = top seller).
 * - `totalInCounter`: how many BAs share the counter (includes `staff`).
 * - `topThree`: top 3 entries (or fewer if the counter has fewer BAs).
 *
 * Tie-breaker for equal sales: alphabetical by name (stable).
 *
 * Throws `RoleNotPermittedError` for non-BA roles — this is a BA-specific
 * comparison that doesn't translate to Gerente/Supervisor/Admin.
 */
export interface BaRankingEntry {
  baId: StaffId;
  name: string;
  salesAmount: number;
}

export interface BaRankingResult {
  myRank: number;
  totalInCounter: number;
  topThree: readonly BaRankingEntry[];
}

export async function getBaRankingInCounter(
  staff: Staff,
  filters: DashboardFilters,
): Promise<BaRankingResult> {
  if (staff.role !== "BA") {
    throw new RoleNotPermittedError(staff.role, "getBaRankingInCounter");
  }

  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);

  // Build the counter roster. Include the input staff defensively even if
  // userRepository doesn't list them.
  const users = await userRepository.list();
  const counterRoster = new Map<string, { id: StaffId; name: string }>();
  for (const u of users) {
    if (u.role !== "BA") continue;
    if (u.storeId !== staff.storeId) continue;
    if (u.brand !== staff.brand) continue;
    counterRoster.set(u.id as unknown as string, {
      id: u.id as unknown as StaffId,
      name: u.name,
    });
  }
  const staffKey = staff.id as unknown as string;
  if (!counterRoster.has(staffKey)) {
    counterRoster.set(staffKey, { id: staff.id, name: staff.name });
  }

  // Sales per BA in period. Empty scope ⇒ all zeros, but the roster still ranks.
  const salesByBa = new Map<string, number>();
  for (const [id] of counterRoster) salesByBa.set(id, 0);

  if (!isEmpty) {
    const purchases = await purchaseRepository.list({ storeIds, brands });
    for (const p of purchases) {
      const key = p.baId as unknown as string;
      if (!counterRoster.has(key)) continue;
      const at = new Date(p.at);
      if (at < filters.period.from || at >= filters.period.to) continue;
      salesByBa.set(key, (salesByBa.get(key) ?? 0) + p.total);
    }
  }

  const ranked: BaRankingEntry[] = Array.from(counterRoster.values())
    .map((u) => ({
      baId: u.id,
      name: u.name,
      salesAmount: salesByBa.get(u.id as unknown as string) ?? 0,
    }))
    .sort((a, b) => {
      if (b.salesAmount !== a.salesAmount) return b.salesAmount - a.salesAmount;
      return a.name.localeCompare(b.name);
    });

  const myRank = ranked.findIndex((r) => r.baId === staff.id) + 1;

  return {
    myRank: myRank > 0 ? myRank : 1,
    totalInCounter: ranked.length,
    topThree: ranked.slice(0, 3),
  };
}
