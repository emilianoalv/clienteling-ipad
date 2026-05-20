"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import type { Client } from "@/types/client";
import { Avatar, BrandTag, Button, Chip, Icon } from "@/components/primitives";
import { Card, KvRow } from "@/components/patterns";
import { formatDate, formatTime } from "@/lib/format/format-date";

const TONE_BY_BRAND = {
  Lancôme: "lancome",
  YSL: "ysl",
} as const;

function avatarTone(brand: string | undefined): "default" | "lancome" | "ysl" {
  if (!brand) return "default";
  return (TONE_BY_BRAND as Record<string, "lancome" | "ysl">)[brand] ?? "default";
}

export interface AppointmentDetailProps {
  client: Client;
  appointment: Appointment;
  baName: string;
  storeName: string;
}

export function AppointmentDetail({
  client,
  appointment,
  baName,
  storeName,
}: AppointmentDetailProps) {
  const t = useTranslations();
  const kindLabel = t(`appointment.kind.${appointment.kind}`);
  const statusLabel = t(`appointment.status.${appointment.status}`);
  const initial = kindLabel[0]?.toUpperCase() ?? "•";

  return (
    <div className="flex flex-col gap-4">
      <Card variant="luxe" className="flex flex-col gap-5">
        <header className="flex items-start gap-4 justify-between flex-wrap">
          <div className="flex items-center gap-4">
            <Avatar initials={initial} size={56} tone={avatarTone(appointment.brand)} />
            <div>
              <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
                {client.name}
              </div>
              <h2 className="m-0 mt-1 font-display text-[32px] leading-tight tracking-[-0.01em]">
                {kindLabel}
              </h2>
              <p className="m-0 mt-1.5 text-[15px] text-ink/60 leading-snug">
                <Icon name="calendar" size={12} /> {formatDate(appointment.at)} ·{" "}
                {formatTime(appointment.at)} · {appointment.durationMin} min
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <BrandTag brand={appointment.brand} alwaysShow />
            <AppointmentStatusChip status={appointment.status} label={statusLabel} />
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 border-t border-line pt-4">
          <KvRow label="Atendida por" value={baName} />
          <KvRow label="Tienda" value={storeName} />
          <KvRow label="Duración" value={`${appointment.durationMin} min`} />
          <KvRow label="Marca" value={appointment.brand} />
        </section>

        {appointment.notes ? (
          <section className="border-t border-line pt-4">
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-1.5">
              Notas
            </div>
            <p className="m-0 text-[15.5px] leading-snug whitespace-pre-line">
              {appointment.notes}
            </p>
          </section>
        ) : null}

        {appointment.status === "cancelled" ? (
          <section className="border-t border-line pt-4 rounded-lg bg-err/[0.06] -mx-1 px-4 py-3 mt-2">
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-err mb-1.5 inline-flex items-center gap-1.5">
              <Icon name="warning" size={14} />
              Cita cancelada
            </div>
            {appointment.cancelReason ? (
              <p className="m-0 text-[15.5px] leading-snug">
                <strong className="text-ink">Motivo:</strong> {appointment.cancelReason}
              </p>
            ) : null}
            {appointment.cancelledAt ? (
              <p className="m-0 mt-1 text-[14px] text-ink/60 leading-snug">
                Cancelada el {formatDate(appointment.cancelledAt)} a las{" "}
                {formatTime(appointment.cancelledAt)}
              </p>
            ) : null}
          </section>
        ) : null}

        {appointment.status === "rescheduled" && appointment.rescheduledAt ? (
          <section className="border-t border-line pt-4 rounded-lg bg-warn/[0.06] -mx-1 px-4 py-3 mt-2">
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-warn mb-1.5">
              Cita reagendada
            </div>
            <p className="m-0 text-[15.5px] leading-snug">
              Movida el {formatDate(appointment.rescheduledAt)} a las{" "}
              {formatTime(appointment.rescheduledAt)}.
            </p>
          </section>
        ) : null}

        <div className="flex justify-end border-t border-line pt-4">
          <Link href="/ba/appointments">
            <Button variant="ghost" trailing={<Icon name="arrow-right" />}>
              Gestionar agenda
            </Button>
          </Link>
        </div>
      </Card>
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
  if (status === "completed" || status === "confirmed") {
    return (
      <Chip variant="ok" size="md">
        {label}
      </Chip>
    );
  }
  if (status === "cancelled" || status === "no-show") {
    return (
      <Chip variant="danger" size="md">
        {label}
      </Chip>
    );
  }
  return (
    <Chip variant="warn" size="md">
      {label}
    </Chip>
  );
}
