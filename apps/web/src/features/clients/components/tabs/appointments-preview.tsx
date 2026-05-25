"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import { BrandTag, Chip, Icon } from "@/components/primitives";
import { formatDate } from "@/lib/format/format-date";

export interface AppointmentsPreviewProps {
  appointments: readonly Appointment[];
  clientId: string;
  /** Map of StaffId → BA display name. */
  baLookup: Record<string, string>;
}

const PREVIEW_COUNT = 4;

/**
 * Inline preview shown inside the client-profile "Citas" tab.
 * Each row is a clickable link to the appointment detail page. The full
 * history lives at `/ba/clients/[id]/appointments`.
 */
export function AppointmentsPreview({
  appointments,
  clientId,
  baLookup,
}: AppointmentsPreviewProps) {
  const t = useTranslations();

  if (appointments.length === 0) {
    return (
      <p className="m-0 text-[16px] font-medium leading-normal text-ink/60">
        Aún no hay citas registradas para este cliente.
      </p>
    );
  }

  // Mixed view: future appointments first, then past, both sorted by date desc.
  const now = Date.now();
  const sorted = [...appointments].sort((a, b) => {
    const aFuture = new Date(a.at).getTime() >= now;
    const bFuture = new Date(b.at).getTime() >= now;
    if (aFuture !== bFuture) return aFuture ? -1 : 1;
    return b.at.localeCompare(a.at);
  });

  return (
    <div className="flex flex-col gap-3">
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
          href={`/ba/clients/${clientId}/appointments`}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-line bg-white text-[14px] font-semibold text-ink no-underline transition-colors hover:bg-bone"
        >
          Ver todo
          <Icon name="arrow-right" size={13} />
        </Link>
      </header>

      <ul className="list-none m-0 p-0 flex flex-col">
        {sorted.slice(0, PREVIEW_COUNT).map((a) => {
          const baName = baLookup[a.baId as unknown as string] ?? "—";
          return (
            <li key={a.id} className="border-b border-line last:border-b-0">
              <Link
                href={`/ba/clients/${clientId}/appointments/${a.id}`}
                className="grid grid-cols-[40px_minmax(0,1fr)_auto_auto] items-center gap-3.5 py-3.5 px-1 text-ink no-underline transition-colors hover:bg-bone/60 rounded-md"
              >
                <span
                  aria-hidden
                  className="inline-flex w-10 h-10 items-center justify-center rounded-md bg-bone text-ink/60"
                >
                  <Icon name="calendar" size={18} />
                </span>
                <div className="min-w-0 flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[15px] font-semibold leading-tight">
                      {t(`appointment.kind.${a.kind}`)}
                    </span>
                    <BrandTag brand={a.brand} alwaysShow />
                  </div>
                  <span className="text-[13.5px] text-ink/60 leading-tight truncate">
                    {a.durationMin} min · por {baName}
                  </span>
                </div>
                <AppointmentStatusChip status={a.status} label={t(`appointment.status.${a.status}`)} />
                <span className="text-[13.5px] text-ink/60 leading-none whitespace-nowrap">
                  {formatDate(a.at)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AppointmentStatusChip({
  status,
  label,
}: {
  status: AppointmentStatus;
  label: string;
}) {
  if (status === "completed") {
    return (
      <Chip variant="ok" size="sm">
        {label}
      </Chip>
    );
  }
  if (status === "confirmed") {
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
