import type { ClientStats } from "@/types/client";

/**
 * Pure transformation applied when a client makes a new purchase.
 * Single source of truth for LTV / visits / avg-ticket arithmetic.
 *
 * Replaces the duplicated math in the prototype's `ScreenRegisterVisit`
 * (line 131-140) and `ScreenRegisterSale` (line 469-473).
 */
export function applyPurchaseToStats(stats: ClientStats, amount: number, at: Date = new Date()): ClientStats {
  const visits = stats.visits + 1;
  const ltv = stats.ltv + amount;
  return {
    ...stats,
    visits,
    ltv,
    avgTicket: visits > 0 ? Math.round(ltv / visits) : 0,
    lastPurchase: at.toISOString(),
  };
}

/** Mirror operation for visits that don't involve a sale. */
export function applyVisitToStats(stats: ClientStats): ClientStats {
  return { ...stats, visits: stats.visits + 1 };
}
