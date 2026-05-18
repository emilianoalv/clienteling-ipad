import "server-only";
import type { ClientId } from "@/types/client";
import type { Staff } from "@/types/staff";
import { addDays, startOfDay } from "@/lib/date/week";
import { clientRepository } from "@/server/repositories/client.repository";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

/**
 * Clientas in scope whose next "as-client anniversary" (same month/day as
 * `client.since`, year > `since` year) falls in
 * `[anchorDay, anchorDay + windowDays)`.
 *
 * Defaults: `windowDays = 30`, `minTenureDays = 30` — clientas with less
 * than 30 days as a client are NOT included (they're "new", not "celebrating
 * an anniversary"). Override either via options.
 */
export interface UpcomingAnniversary {
  clientId: ClientId;
  name: string;
  anniversaryDate: Date;
  daysAway: number;
  yearsAsClient: number;
}

export interface AnniversariesOptions {
  windowDays?: number;
  minTenureDays?: number;
}

export async function getUpcomingAnniversaries(
  staff: Staff,
  filters: DashboardFilters,
  options: AnniversariesOptions = {},
): Promise<UpcomingAnniversary[]> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return [];

  const windowDays = options.windowDays ?? 30;
  const minTenureDays = options.minTenureDays ?? 30;
  const anchorDay = startOfDay(filters.period.to);
  const windowEnd = addDays(anchorDay, windowDays);
  const tenureCutoff = addDays(anchorDay, -minTenureDays);

  const clients = await clientRepository.list({ storeIds, brands });

  const result: UpcomingAnniversary[] = [];
  for (const c of clients) {
    if (!c.since) continue;
    const sinceDate = new Date(c.since);
    if (sinceDate >= tenureCutoff) continue;

    const [yearStr, monthStr, dayStr] = c.since.split("-");
    const sinceYear = Number.parseInt(yearStr!, 10);
    const month = Number.parseInt(monthStr!, 10) - 1;
    const day = Number.parseInt(dayStr!, 10);

    let anniv = new Date(anchorDay.getFullYear(), month, day);
    if (anniv < anchorDay) {
      anniv = new Date(anchorDay.getFullYear() + 1, month, day);
    }
    if (anniv >= windowEnd) continue;

    const daysAway = Math.round(
      (anniv.getTime() - anchorDay.getTime()) / 86_400_000,
    );
    result.push({
      clientId: c.id,
      name: c.name,
      anniversaryDate: anniv,
      daysAway,
      yearsAsClient: anniv.getFullYear() - sinceYear,
    });
  }
  result.sort((a, b) => a.daysAway - b.daysAway);
  return result;
}
