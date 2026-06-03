"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import { BrandTag, Chip, Icon } from "@/components/primitives";
import { formatDate } from "@/lib/format/format-date";

export interface AppointmentsPreviewProps {
  appointments: readonly Appointment[];
  clientId: string;
  /** Map of StaffId → BA display name. */
  baLookup: Record<string, string>;
  /** Prefijo de ruta para deep-links. Default `/ba/clients`. */
  basePath?: string;
}

/**
 * Inline preview shown inside the client-profile "Citas" tab.
 * Agrupada por día (mismo patrón que el tab Muestras). El header de cada
 * día muestra la fecha + el conteo de citas. El historial filtrado vive
 * en /…/clients/[id]/appointments.
 */
export function AppointmentsPreview({
  appointments,
  clientId,
  baLookup,
  basePath = "/ba/clients",
}: AppointmentsPreviewProps) {
  const t = useTranslations();
  const groups = useMemo(() => groupByDay(appointments), [appointments]);

  if (appointments.length === 0) {
    return (
      <p className="m-0 text-[16px] font-medium leading-normal text-ink/60">
        Aún no hay citas registradas para este cliente.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            Citas
          </div>
          <p className="m-0 mt-1 text-[14.5px] text-ink/60 leading-snug">
            Citas atendidas y por venir con este cliente — diagnóstico, ritual, fragancia, VIP.
          </p>
        </div>
        <Link
          href={`${basePath}/${clientId}/appointments`}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-line bg-white text-[14px] font-semibold text-ink no-underline transition-colors hover:bg-bone"
        >
          Ver todo
          <Icon name="arrow-right" size={13} />
        </Link>
      </header>

      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <section
            key={group.day}
            className="border border-line rounded-lg bg-white overflow-hidden"
          >
            <header className="flex items-center justify-between gap-3 px-4 py-2.5 bg-bone/60 border-b border-line">
              <span className="text-[13.5px] font-semibold tracking-[0.06em] uppercase text-ink/70">
                {formatDate(group.day)}
              </span>
              <span className="text-[12.5px] font-medium text-ink/55 tabular">
                {group.appointments.length}{" "}
                {group.appointments.length === 1 ? "cita" : "citas"}
              </span>
            </header>
            <ul className="list-none m-0 p-0 flex flex-col">
              {group.appointments.map((a) => {
                const baName = baLookup[a.baId as unknown as string] ?? "—";
                return (
                  <li key={a.id} className="border-b border-line last:border-b-0">
                    <Link
                      href={`${basePath}/${clientId}/appointments/${a.id}`}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3.5 py-3 px-4 text-ink no-underline transition-colors hover:bg-bone/40"
                    >
                      <div className="min-w-0 flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 text-[15px] font-semibold leading-tight">
                            <Icon name="calendar" size={14} className="text-ink/55" />
                            {t(`appointment.kind.${a.kind}`)}
                          </span>
                          <BrandTag brand={a.brand} alwaysShow />
                        </div>
                        <span className="text-[13.5px] text-ink/60 leading-tight truncate">
                          {a.durationMin} min · por {baName}
                        </span>
                      </div>
                      <AppointmentStatusChip
                        status={a.status}
                        label={t(`appointment.status.${a.status}`)}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

interface DayGroup {
  day: string;
  appointments: readonly Appointment[];
}

function groupByDay(appointments: readonly Appointment[]): DayGroup[] {
  // Futuras primero (más recientes arriba dentro de futuras), luego pasadas
  // descendentes. Agrupamos por día YYYY-MM-DD para casar con el header.
  const today = new Date().toISOString().slice(0, 10);
  const byDay = new Map<string, Appointment[]>();
  for (const a of appointments) {
    const day = a.at.slice(0, 10);
    const bucket = byDay.get(day);
    if (bucket) bucket.push(a);
    else byDay.set(day, [a]);
  }
  const entries = [...byDay.entries()];
  entries.sort((a, b) => {
    const aFuture = a[0] >= today;
    const bFuture = b[0] >= today;
    if (aFuture !== bFuture) return aFuture ? -1 : 1;
    // Dentro del mismo bloque: futuras ascendentes (más cercana primero),
    // pasadas descendentes (más reciente primero).
    return aFuture ? a[0].localeCompare(b[0]) : b[0].localeCompare(a[0]);
  });
  return entries.map(([day, group]) => ({ day, appointments: group }));
}

function AppointmentStatusChip({
  status,
  label,
}: {
  status: AppointmentStatus;
  label: string;
}) {
  if (status === "completed" || status === "confirmed") {
    return (
      <Chip variant="ok" size="sm">
        {label}
      </Chip>
    );
  }
  if (status === "cancelled" || status === "no-show") {
    return (
      <Chip variant="danger" size="sm">
        {label}
      </Chip>
    );
  }
  return (
    <Chip variant="warn" size="sm">
      {label}
    </Chip>
  );
}
