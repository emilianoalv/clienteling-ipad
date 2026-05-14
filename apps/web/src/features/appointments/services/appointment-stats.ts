import type { Appointment, AppointmentStatus } from "@/types/appointment";

export interface AppointmentStats {
  total: number;
  scheduled: number;
  rescheduled: number;
  cancelled: number;
  completed: number;
  /** Reschedules / total, 0..1. */
  rescheduleRate: number;
  /** Cancellations / total, 0..1. */
  cancelRate: number;
}

/**
 * Aggregates a list of appointments into the KPI counts shown on the
 * "Reagendadas y canceladas" management panel (prototype `ApptMgmtPanel`).
 *
 * Pure — does not touch the repository.
 */
export function aggregateAppointmentStats(appointments: readonly Appointment[]): AppointmentStats {
  const counts: Record<AppointmentStatus, number> = {
    scheduled: 0,
    confirmed: 0,
    rescheduled: 0,
    cancelled: 0,
    completed: 0,
    "no-show": 0,
  };
  for (const a of appointments) counts[a.status]++;

  const total = appointments.length;
  const scheduled = counts.scheduled + counts.confirmed;
  return {
    total,
    scheduled,
    rescheduled: counts.rescheduled,
    cancelled: counts.cancelled,
    completed: counts.completed,
    rescheduleRate: total > 0 ? counts.rescheduled / total : 0,
    cancelRate: total > 0 ? counts.cancelled / total : 0,
  };
}
