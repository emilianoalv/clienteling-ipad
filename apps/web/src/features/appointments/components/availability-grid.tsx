"use client";

import { useMemo } from "react";
import type { Appointment } from "@/types/appointment";
import type { StaffId } from "@/types/staff";
import { buildDaySlots } from "../services/build-day-slots";
import { cn } from "@/lib/cn";

export interface AvailabilityGridProps {
  /** Local YYYY-MM-DD string. */
  date: string;
  baId: StaffId;
  durationMin: number;
  existing: readonly Appointment[];
  value: string | null;
  onSelect: (time: string) => void;
}

export function AvailabilityGrid({
  date,
  baId,
  durationMin,
  existing,
  value,
  onSelect,
}: AvailabilityGridProps) {
  const slots = useMemo(() => {
    if (!date) return [];
    const ref = new Date(`${date}T00:00:00`);
    return buildDaySlots(existing, { date: ref, baId, durationMin });
  }, [date, baId, durationMin, existing]);

  if (slots.length === 0) {
    return (
      <p className="m-0 text-[16px] font-medium leading-snug text-ink/60">
        Selecciona una fecha para ver disponibilidad.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {slots.map((slot) => {
        const active = value === slot.label;
        return (
          <button
            key={slot.at}
            type="button"
            disabled={slot.taken}
            onClick={() => onSelect(slot.label)}
            className={cn(
              "h-10 rounded-[10px] border text-[16px] font-semibold leading-none tabular cursor-pointer transition-[background-color,border-color] duration-100 ease-luxe",
              slot.taken
                ? "bg-err/[0.08] text-err border-err/20 cursor-not-allowed"
                : active
                  ? "bg-ink text-paper border-ink"
                  : "bg-white text-ink border-line hover:bg-bone",
            )}
          >
            {slot.label}
          </button>
        );
      })}
    </div>
  );
}
