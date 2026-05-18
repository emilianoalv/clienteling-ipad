import "server-only";
import type { Staff } from "@/types/staff";
import { appointmentRepository } from "@/server/repositories/appointment.repository";
import { mergeScope } from "../utils/scope-merge";
import type { DashboardFilters } from "../types";

/**
 * Aggregate appointment metrics for `filters.period` (half-open `[from, to)`).
 *
 * Field semantics:
 * - `total`:  appointments with `at` in period.
 * - `new`:    appointments with `at` in period — *proxy*. The Appointment
 *             type currently has no `createdAt`, so we cannot distinguish
 *             "scheduled inside the period" from "happens inside the
 *             period". Document that and revisit if `createdAt` is added.
 * - `rescheduled`: appointments with `status === "rescheduled"` AND
 *             `rescheduledAt` in period. Uses `rescheduledAt` (more
 *             semantic than `at`) because it represents WHEN the reschedule
 *             happened, not when the new visit is set.
 * - `canceled`: appointments with `status === "cancelled"` AND
 *             `cancelledAt` in period. Same reasoning: time of the
 *             cancellation event, not of the original visit.
 *
 * `rescheduled` and `canceled` return `number` because the Appointment
 * type DOES support both statuses + timestamp fields (Escenario A/B
 * applies). They never return `null` in this implementation.
 */
export interface AppointmentMetrics {
  total: number;
  new: number;
  rescheduled: number | null;
  canceled: number | null;
}

export async function getAppointmentMetrics(
  staff: Staff,
  filters: DashboardFilters,
): Promise<AppointmentMetrics> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) {
    return { total: 0, new: 0, rescheduled: 0, canceled: 0 };
  }

  const apps = await appointmentRepository.list({ storeIds, brands });

  let total = 0;
  let neu = 0;
  let rescheduled = 0;
  let canceled = 0;

  for (const a of apps) {
    if (filters.baId && a.baId !== filters.baId) continue;
    const at = new Date(a.at);
    const inPeriod = at >= filters.period.from && at < filters.period.to;
    if (inPeriod) {
      total += 1;
      neu += 1;
    }
    if (a.status === "rescheduled" && a.rescheduledAt) {
      const rAt = new Date(a.rescheduledAt);
      if (rAt >= filters.period.from && rAt < filters.period.to) rescheduled += 1;
    }
    if (a.status === "cancelled" && a.cancelledAt) {
      const cAt = new Date(a.cancelledAt);
      if (cAt >= filters.period.from && cAt < filters.period.to) canceled += 1;
    }
  }

  return { total, new: neu, rescheduled, canceled };
}
