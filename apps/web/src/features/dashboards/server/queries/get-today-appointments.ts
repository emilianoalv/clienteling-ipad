import "server-only";
import type { Appointment } from "@/types/appointment";
import type { Staff } from "@/types/staff";
import { addDays, startOfDay } from "@/lib/date/week";
import { appointmentRepository } from "@/server/repositories/appointment.repository";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

/**
 * Appointments scheduled for the anchor day, ordered by `at` ascending.
 *
 * Window = `[startOfDay(filters.period.to), startOfDay + 1d)` (half-open).
 *
 * Note: `appointmentRepository.list` filters `at <= to` (inclusive on `to`,
 * inconsistent with the rest of the module). We filter again here with the
 * standard half-open semantics so a midnight boundary cannot leak.
 */
export async function getTodayAppointments(
  staff: Staff,
  filters: DashboardFilters,
): Promise<Appointment[]> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return [];

  const anchorDay = startOfDay(filters.period.to);
  const nextDay = addDays(anchorDay, 1);

  const apps = await appointmentRepository.list({ storeIds, brands });

  return apps
    .filter((a) => {
      if (filters.baId && a.baId !== filters.baId) return false;
      const at = new Date(a.at);
      return at >= anchorDay && at < nextDay;
    })
    .sort((a, b) => a.at.localeCompare(b.at));
}
