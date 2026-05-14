import type { Appointment, AppointmentId } from "@/types/appointment";
import type { StaffId } from "@/types/staff";

export interface Slot {
  baId: StaffId;
  at: string;
  durationMin: number;
  /** When updating an existing appointment, exclude its own id from the conflict scan. */
  excludeId?: AppointmentId;
}

/**
 * Returns true when the proposed slot overlaps another non-cancelled
 * appointment for the same BA.
 *
 * Pure: receives all state explicitly. Pair with `useAvailability` on the client.
 */
export function hasConflict(slot: Slot, existing: readonly Appointment[]): boolean {
  const start = new Date(slot.at).getTime();
  const end = start + slot.durationMin * 60_000;

  return existing.some((a) => {
    if (a.id === slot.excludeId) return false;
    if (a.status === "cancelled") return false;
    if (a.baId !== slot.baId) return false;
    const aStart = new Date(a.at).getTime();
    const aEnd = aStart + a.durationMin * 60_000;
    return aStart < end && aEnd > start;
  });
}
