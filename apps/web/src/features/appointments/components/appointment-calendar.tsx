"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Icon, SegmentedControl, type SegmentedOption } from "@/components/primitives";
import { addDays, addMonths, isoWeekNumber, startOfIsoWeek } from "@/lib/date/week";
import type { Appointment } from "@/types/appointment";
import { AppointmentDetailModal } from "./appointment-detail-modal";
import { DayView } from "./views/day-view";
import { WeekView } from "./views/week-view";
import { MonthView } from "./views/month-view";

type View = "day" | "week" | "month";

export interface AppointmentCalendarProps {
  appointments: readonly Appointment[];
  clientLookup: Readonly<Record<string, string>>;
}

export function AppointmentCalendar({ appointments, clientLookup }: AppointmentCalendarProps) {
  const t = useTranslations();
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const [selected, setSelected] = useState<Appointment | null>(null);

  const options: ReadonlyArray<SegmentedOption<View>> = [
    { value: "day", label: t("calendar.view.day") },
    { value: "week", label: t("calendar.view.week") },
    { value: "month", label: t("calendar.view.month") },
  ];

  const headerLabel = useMemo(() => buildHeaderLabel(view, anchor), [view, anchor]);
  const subtitle =
    view === "week" ? t("calendar.week_label", { week: isoWeekNumber(anchor) }) : undefined;

  function nav(delta: -1 | 0 | 1) {
    if (delta === 0) {
      setAnchor(new Date());
      return;
    }
    if (view === "day") setAnchor((d) => addDays(d, delta));
    else if (view === "week") setAnchor((d) => addDays(d, delta * 7));
    else setAnchor((d) => addMonths(d, delta));
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex justify-between items-center gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <h2 className="m-0 font-display text-[28px] leading-[1.1] tracking-[-0.01em]">
            {headerLabel}
          </h2>
          {subtitle ? (
            <span className="text-[15px] font-semibold leading-none tracking-[0.12em] uppercase text-ink/60">
              {subtitle}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <SegmentedControl<View>
            options={options}
            value={view}
            onChange={setView}
            ariaLabel={t("calendar.view.day")}
          />
          <div className="inline-flex items-center gap-0.5 bg-bone border border-line rounded-[10px] p-0.5">
            <Button variant="ghost" iconOnly aria-label="Anterior" onClick={() => nav(-1)}>
              <Icon name="chevron-right" className="-scale-x-100" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => nav(0)}>
              {t("calendar.today")}
            </Button>
            <Button variant="ghost" iconOnly aria-label="Siguiente" onClick={() => nav(1)}>
              <Icon name="chevron-right" />
            </Button>
          </div>
          {/* "+ Nueva cita" vive ahora SOLO en el header de la page
              (ver app/(app)/ba/appointments/page.tsx). Antes estaba duplicado
              aquí — el del header es más visible en ambos tabs (Calendario
              y Reagendadas/canceladas), así que ese es el que mantenemos. */}
        </div>
      </header>

      <section className="bg-white border border-line rounded-lg p-4 min-h-[360px]">
        {view === "day" && (
          <DayView
            anchor={anchor}
            appointments={appointments}
            clientLookup={clientLookup}
            onSelect={setSelected}
          />
        )}
        {view === "week" && (
          <WeekView
            anchor={anchor}
            appointments={appointments}
            clientLookup={clientLookup}
            onSelect={setSelected}
            onJumpToDay={(day) => {
              setAnchor(day);
              setView("day");
            }}
          />
        )}
        {view === "month" && (
          <MonthView
            anchor={anchor}
            appointments={appointments}
            onJumpToDay={(day) => {
              setAnchor(day);
              setView("day");
            }}
          />
        )}
      </section>

      <AppointmentDetailModal
        appointment={selected}
        clientName={selected ? clientLookup[selected.clientId] ?? selected.clientId : ""}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function buildHeaderLabel(view: View, anchor: Date): string {
  const dtf = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" });
  if (view === "month") return capitalize(dtf.format(anchor));
  if (view === "week") {
    const start = startOfIsoWeek(anchor);
    const end = addDays(start, 6);
    const sameMonth = start.getMonth() === end.getMonth();
    const fmt = new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: sameMonth ? undefined : "short",
    });
    return `${fmt.format(start)} – ${new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(end)}`;
  }
  return new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long" }).format(
    anchor,
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
