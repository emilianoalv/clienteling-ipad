import type { Appointment } from "@/types/appointment";
import type { StaffId } from "@/types/staff";
import { isSameDay } from "@/lib/date/week";
import { hasConflict } from "./has-conflict";

export interface DaySlot {
  /** ISO date-time of the slot start. */
  at: string;
  /** Human-friendly HH:MM rendering (no timezone surprises). */
  label: string;
  taken: boolean;
}

interface BuildOptions {
  date: Date;
  baId: StaffId;
  /** 24h opening hour, default 10. */
  fromHour?: number;
  /** 24h closing hour (exclusive), default 18. */
  toHour?: number;
  /** Slot length in minutes, default 30. */
  stepMin?: number;
  /** Default appointment length used to check conflicts. */
  durationMin?: number;
}

/**
 * Generates the visible time-grid slots for a given day and BA.
 * Marks each slot `taken` when an existing appointment overlaps.
 */
export function buildDaySlots(existing: readonly Appointment[], opts: BuildOptions): DaySlot[] {
  const fromHour = opts.fromHour ?? 10;
  const toHour = opts.toHour ?? 18;
  const stepMin = opts.stepMin ?? 30;
  const durationMin = opts.durationMin ?? 45;

  const sameDayAppts = existing.filter((a) => isSameDay(new Date(a.at), opts.date));
  const slots: DaySlot[] = [];

  for (let h = fromHour; h < toHour; h++) {
    for (let m = 0; m < 60; m += stepMin) {
      const dt = new Date(opts.date);
      dt.setHours(h, m, 0, 0);
      const at = dt.toISOString();
      const taken = hasConflict({ baId: opts.baId, at, durationMin }, sameDayAppts);
      slots.push({ at, label: `${pad(h)}:${pad(m)}`, taken });
    }
  }
  return slots;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}
