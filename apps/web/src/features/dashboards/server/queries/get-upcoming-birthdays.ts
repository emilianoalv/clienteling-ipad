import "server-only";
import type { ClientId } from "@/types/client";
import type { Staff } from "@/types/staff";
import { addDays, startOfDay } from "@/lib/date/week";
import { clientRepository } from "@/server/repositories/client.repository";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

/**
 * Clientas in scope whose next birthday falls in the half-open window
 * `[anchorDay, anchorDay + windowDays)`, where `anchorDay` is the local
 * start-of-day of `filters.period.to`.
 *
 * "Next birthday" = the next occurrence of `client.birthday`'s (month, day)
 * from the anchor. A birthday landing exactly on the anchor day counts
 * (`daysAway = 0`). If `(month, day)` has already passed this year, it
 * rolls to next year — that's why this query can return results across
 * year boundaries.
 *
 * Default `windowDays = 30`. Ordered by `daysAway` ascending.
 */
export interface UpcomingBirthday {
  clientId: ClientId;
  name: string;
  birthdayDate: Date;
  daysAway: number;
  age: number;
}

export async function getUpcomingBirthdays(
  staff: Staff,
  filters: DashboardFilters,
  options: { windowDays?: number } = {},
): Promise<UpcomingBirthday[]> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return [];

  const windowDays = options.windowDays ?? 30;
  const anchorDay = startOfDay(filters.period.to);
  const windowEnd = addDays(anchorDay, windowDays);

  const clients = await clientRepository.list({ storeIds, brands });

  const result: UpcomingBirthday[] = [];
  for (const c of clients) {
    if (!c.birthday) continue;
    const [yearStr, monthStr, dayStr] = c.birthday.split("-");
    const birthYear = Number.parseInt(yearStr!, 10);
    const month = Number.parseInt(monthStr!, 10) - 1;
    const day = Number.parseInt(dayStr!, 10);

    let bday = new Date(anchorDay.getFullYear(), month, day);
    if (bday < anchorDay) {
      bday = new Date(anchorDay.getFullYear() + 1, month, day);
    }
    if (bday >= windowEnd) continue;

    const daysAway = Math.round(
      (bday.getTime() - anchorDay.getTime()) / 86_400_000,
    );
    result.push({
      clientId: c.id,
      name: c.name,
      birthdayDate: bday,
      daysAway,
      age: bday.getFullYear() - birthYear,
    });
  }
  result.sort((a, b) => a.daysAway - b.daysAway);
  return result;
}
