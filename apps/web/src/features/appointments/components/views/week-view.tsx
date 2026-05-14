"use client";

import { useMemo } from "react";
import type { Appointment } from "@/types/appointment";
import { addDays, isSameDay, startOfIsoWeek } from "@/lib/date/week";
import { cn } from "@/lib/cn";

const HOURS = Array.from({ length: 9 }, (_, i) => 10 + i); // 10..18

export interface WeekViewProps {
  anchor: Date;
  appointments: readonly Appointment[];
  clientLookup: Readonly<Record<string, string>>;
  onSelect: (a: Appointment) => void;
  onJumpToDay: (day: Date) => void;
}

export function WeekView({
  anchor,
  appointments,
  clientLookup,
  onSelect,
  onJumpToDay,
}: WeekViewProps) {
  const start = useMemo(() => startOfIsoWeek(anchor), [anchor]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(start, i)), [start]);

  return (
    <div
      className="grid gap-px bg-line border border-line rounded-md overflow-hidden"
      style={{ gridTemplateColumns: `64px repeat(7, minmax(0, 1fr))` }}
    >
      <div />
      {days.map((d) => {
        const today = isSameDay(d, new Date());
        return (
          <button
            key={d.toISOString()}
            type="button"
            onClick={() => onJumpToDay(d)}
            className={cn(
              "border-0 px-1 py-2 flex flex-col items-center gap-0.5 cursor-pointer text-inherit",
              today ? "bg-ink text-paper" : "bg-bone hover:bg-bone-2",
            )}
          >
            <span className="text-[14.5px] font-semibold leading-none tracking-[0.12em] uppercase">
              {new Intl.DateTimeFormat("es-MX", { weekday: "short" }).format(d)}
            </span>
            <span className="font-display text-lg leading-none tabular">{d.getDate()}</span>
          </button>
        );
      })}

      {HOURS.map((h) => (
        <div key={`row-${h}`} className="contents">
          <div className="bg-white px-2 py-2 text-[15px] font-medium leading-none text-ink/60 text-right tabular">
            {h.toString().padStart(2, "0")}:00
          </div>
          {days.map((d) => (
            <Cell
              key={`${d.toISOString()}-${h}`}
              day={d}
              hour={h}
              appointments={appointments}
              clientLookup={clientLookup}
              onSelect={onSelect}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface CellProps {
  day: Date;
  hour: number;
  appointments: readonly Appointment[];
  clientLookup: Readonly<Record<string, string>>;
  onSelect: (a: Appointment) => void;
}

function Cell({ day, hour, appointments, clientLookup, onSelect }: CellProps) {
  const items = appointments.filter((a) => {
    const at = new Date(a.at);
    return isSameDay(at, day) && at.getHours() === hour;
  });
  return (
    <div className="bg-white min-h-14 p-1 flex flex-col gap-0.5">
      {items.map((a) => {
        const at = new Date(a.at);
        const mm = at.getMinutes().toString().padStart(2, "0");
        const isYsl = a.brand === "YSL";
        return (
          <button
            key={a.id}
            type="button"
            onClick={() => onSelect(a)}
            className={cn(
              "flex flex-col gap-0.5 px-1.5 py-1 rounded-md border-0 cursor-pointer text-left hover:brightness-95",
              isYsl ? "bg-ysl-ink text-ysl-gold" : "bg-lancome-rose text-lancome-ink",
            )}
          >
            <span className="text-[15px] font-semibold leading-none tabular">
              {hour.toString().padStart(2, "0")}:{mm}
            </span>
            <span className="text-[15px] font-medium leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
              {clientLookup[a.clientId] ?? a.clientId}
            </span>
          </button>
        );
      })}
    </div>
  );
}
