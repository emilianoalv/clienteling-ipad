"use client";

import { useTranslations } from "next-intl";
import type { Appointment } from "@/types/appointment";
import { isSameDay } from "@/lib/date/week";
import { AgendaRow } from "../agenda-row";

export interface DayViewProps {
  anchor: Date;
  appointments: readonly Appointment[];
  clientLookup: Readonly<Record<string, string>>;
  onSelect: (a: Appointment) => void;
}

export function DayView({ anchor, appointments, clientLookup, onSelect }: DayViewProps) {
  const t = useTranslations();
  const list = appointments
    .filter((a) => isSameDay(new Date(a.at), anchor))
    .sort((a, b) => a.at.localeCompare(b.at));

  if (list.length === 0) {
    return (
      <p className="m-0 text-[16px] font-medium leading-normal text-ink/60 text-center py-10">
        {t("calendar.empty_day")}
      </p>
    );
  }

  return (
    <ul className="list-none m-0 p-0 flex flex-col gap-2">
      {list.map((a) => (
        <li key={a.id}>
          <AgendaRow
            appointment={a}
            clientName={clientLookup[a.clientId] ?? a.clientId}
            onClick={() => onSelect(a)}
          />
        </li>
      ))}
    </ul>
  );
}
