"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { Appointment } from "@/types/appointment";
import { addDays, endOfMonth, isSameDay, startOfIsoWeek, startOfMonth } from "@/lib/date/week";
import { cn } from "@/lib/cn";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

export interface MonthViewProps {
  anchor: Date;
  appointments: readonly Appointment[];
  onJumpToDay: (day: Date) => void;
}

export function MonthView({ anchor, appointments, onJumpToDay }: MonthViewProps) {
  const t = useTranslations();
  const cells = useMemo(() => buildCells(anchor), [anchor]);
  const monthMonth = anchor.getMonth();
  const today = new Date();

  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      const key = new Date(a.at).toDateString();
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    return map;
  }, [appointments]);

  return (
    <div className="grid grid-cols-7 gap-px bg-line border border-line rounded-md overflow-hidden">
      {WEEKDAYS.map((w, i) => (
        <div
          key={i}
          className="bg-bone text-center py-2 text-[14.5px] font-semibold leading-none tracking-[0.12em] uppercase text-ink/60"
        >
          {w}
        </div>
      ))}
      {cells.map((day) => {
        const inMonth = day.getMonth() === monthMonth;
        const isToday = isSameDay(day, today);
        const items = byDay.get(day.toDateString()) ?? [];
        const visible = items.slice(0, 3);
        const overflow = items.length - visible.length;
        return (
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => onJumpToDay(day)}
            className={cn(
              "min-h-24 p-1.5 flex flex-col gap-1 border-0 cursor-pointer text-left text-inherit",
              inMonth ? "bg-white hover:bg-bone" : "bg-paper text-ink/40",
            )}
          >
            <span
              className={cn(
                "text-xs font-semibold leading-none tabular inline-flex items-center justify-center w-[22px] h-[22px]",
                isToday && "bg-ink text-paper rounded-full",
              )}
            >
              {day.getDate()}
            </span>
            {visible.map((a) => {
              const isYsl = a.brand === "YSL";
              return (
                <span
                  key={a.id}
                  className={cn(
                    "text-[15px] font-medium leading-none px-1.5 py-0.5 rounded-md",
                    isYsl ? "bg-ysl-ink text-ysl-gold" : "bg-lancome-rose text-lancome-ink",
                  )}
                >
                  {hhmm(a.at)}
                </span>
              );
            })}
            {overflow > 0 ? (
              <span className="text-[15px] font-medium leading-none text-ink/60">
                {t("calendar.more_count", { count: overflow })}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function buildCells(anchor: Date): Date[] {
  const first = startOfMonth(anchor);
  const last = endOfMonth(anchor);
  const gridStart = startOfIsoWeek(first);
  const totalDays =
    Math.ceil(((last.getTime() - gridStart.getTime()) / 86_400_000 + 1) / 7) * 7;
  return Array.from({ length: totalDays }, (_, i) => addDays(gridStart, i));
}

function hhmm(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}
