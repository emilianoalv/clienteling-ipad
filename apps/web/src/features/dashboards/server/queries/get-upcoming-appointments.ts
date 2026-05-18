import "server-only";
import type { Appointment } from "@/types/appointment";
import type { Staff } from "@/types/staff";
import { addDays, startOfDay } from "@/lib/date/week";
import { appointmentRepository } from "@/server/repositories/appointment.repository";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

/**
 * Appointments scheduled for the N days AFTER the anchor day, ordered by
 * `at` ascending. The anchor day itself is excluded (use
 * `getTodayAppointments` for that). Default `windowDays = 7`.
 *
 * Window = `[startOfDay(anchor) + 1d, startOfDay(anchor) + 1d + windowDays)`.
 *
 * Note: see `get-today-appointments.ts` for the rationale behind filtering
 * in this query instead of relying on the repo's `to`-inclusive semantics.
 */
export async function getUpcomingAppointments(
  staff: Staff,
  filters: DashboardFilters,
  options: { windowDays?: number } = {},
): Promise<Appointment[]> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return [];

  const windowDays = options.windowDays ?? 7;
  const anchorDay = startOfDay(filters.period.to);
  const windowStart = addDays(anchorDay, 1);
  const windowEnd = addDays(windowStart, windowDays);

  const apps = await appointmentRepository.list({ storeIds, brands });

  return apps
    .filter((a) => {
      if (filters.baId && a.baId !== filters.baId) return false;
      const at = new Date(a.at);
      return at >= windowStart && at < windowEnd;
    })
    .sort((a, b) => a.at.localeCompare(b.at));
}
