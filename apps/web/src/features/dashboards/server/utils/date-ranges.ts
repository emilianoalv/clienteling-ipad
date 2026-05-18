import "server-only";
import { addDays, addMonths, startOfDay, startOfMonth } from "@/lib/date/week";
import type { DashboardPeriod } from "../types";

/**
 * # Design note: every period is half-open `[from, to)`.
 *
 * Adjacent periods (e.g. last 7d vs the 7d before that, or this month vs
 * last month) can be concatenated without double-counting boundary events.
 * Repositories follow the same convention (`at >= filter.to` is excluded),
 * so a query can pass these periods straight through.
 *
 * Membership test for any timestamp `t`: `t >= from && t < to`.
 *
 * Every preset accepts a `now` parameter for tests; defaults to "real now".
 */

/** From the 1st of the current month at 00:00 to the 1st of next month. */
export function thisMonth(now: Date = new Date()): DashboardPeriod {
  const from = startOfMonth(now);
  const to = startOfMonth(addMonths(from, 1));
  return { from, to };
}

/** From start of today minus 6 days to start of tomorrow (7 calendar days). */
export function last7Days(now: Date = new Date()): DashboardPeriod {
  const todayStart = startOfDay(now);
  return { from: addDays(todayStart, -6), to: addDays(todayStart, 1) };
}

export function last30Days(now: Date = new Date()): DashboardPeriod {
  const todayStart = startOfDay(now);
  return { from: addDays(todayStart, -29), to: addDays(todayStart, 1) };
}

export function last90Days(now: Date = new Date()): DashboardPeriod {
  const todayStart = startOfDay(now);
  return { from: addDays(todayStart, -89), to: addDays(todayStart, 1) };
}

/**
 * Given a period of duration N, return the immediately preceding period of the
 * same duration. Useful for "vs período anterior" deltas.
 *
 * Example: comparable(last7Days = [Mon, NextMon)) → [PrevMon, Mon).
 */
export function comparablePreviousPeriod(period: DashboardPeriod): DashboardPeriod {
  const ms = period.to.getTime() - period.from.getTime();
  return {
    from: new Date(period.from.getTime() - ms),
    to: new Date(period.from.getTime()),
  };
}

/**
 * `[from, to)` for the current ISO calendar day. Half-open so it doesn't
 * collide with tomorrow's events.
 */
export function today(now: Date = new Date()): DashboardPeriod {
  const from = startOfDay(now);
  return { from, to: addDays(from, 1) };
}

/** From start of today through end of day+N (exclusive). */
export function nextNDays(n: number, now: Date = new Date()): DashboardPeriod {
  const from = startOfDay(now);
  return { from, to: addDays(from, n + 1) };
}
