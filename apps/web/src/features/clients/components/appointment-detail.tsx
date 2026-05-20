"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import type { Client } from "@/types/client";
import { Avatar, BrandTag, Button, Chip, Icon, Input } from "@/components/primitives";
import { Card } from "@/components/patterns";
import {
  cancelAppointment,
  rescheduleAppointment,
  transitionAppointment,
} from "@/features/appointments";
import { formatDate, formatTime } from "@/lib/format/format-date";

type Mode = "view" | "reschedule" | "cancel";

const TONE_BY_BRAND = {
  Lancôme: "lancome",
  YSL: "ysl",
} as const;

function avatarTone(brand: string | undefined): "default" | "lancome" | "ysl" {
  if (!brand) return "default";
  return (TONE_BY_BRAND as Record<string, "lancome" | "ysl">)[brand] ?? "default";
}

function isFinalStatus(status: AppointmentStatus): boolean {
  return status === "completed" || status === "cancelled" || status === "no-show";
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
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
  const [mode, setMode] = useState<Mode>("view");
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const kindLabel = t(`appointment.kind.${appointment.kind}`);
  const statusLabel = t(`appointment.status.${appointment.status}`);
  const initial = kindLabel[0]?.toUpperCase() ?? "•";
  const isFinal = isFinalStatus(appointment.status);

  function withSuccess(message: string, run: () => Promise<unknown>) {
    startTransition(async () => {
      await run();
      setNotice(message);
      setMode("view");
      setTimeout(() => setNotice(null), 1600);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card variant="luxe" className="flex flex-col gap-6 p-7">
        {/* Hero */}
        <header className="flex items-start gap-5 justify-between flex-wrap">
          <div className="flex items-center gap-5">
            <Avatar initials={initial} size={80} tone={avatarTone(appointment.brand)} />
            <div>
              <div className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/55">
                {client.name}
              </div>
              <h2 className="m-0 mt-1.5 font-display text-[40px] leading-[1.05] tracking-[-0.01em]">
                {kindLabel}
              </h2>
              <p className="m-0 mt-2 text-[17px] text-ink/70 leading-snug flex items-center gap-2 flex-wrap">
                <Icon name="calendar" size={14} />
                <span className="font-semibold text-ink">{formatDate(appointment.at)}</span>
                <span aria-hidden className="text-ink/30">·</span>
                <span>{formatTime(appointment.at)}</span>
                <span aria-hidden className="text-ink/30">·</span>
                <span>{appointment.durationMin} min</span>
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <BrandTag brand={appointment.brand} alwaysShow />
            <AppointmentStatusChip status={appointment.status} label={statusLabel} />
          </div>
        </header>

        {/* KvRows enriquecido */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 border-t border-line pt-5">
          <BigField label="Atendida por" value={baName} icon="user" />
          <BigField label="Tienda" value={storeName} icon="home" />
          <BigField label="Duración" value={`${appointment.durationMin} min`} icon="calendar" />
          <BigField label="Marca" value={appointment.brand} icon="star" />
        </section>

        {/* Notas */}
        {appointment.notes ? (
          <section className="border-t border-line pt-5">
            <div className="text-[14px] font-semibold tracking-[0.12em] uppercase text-ink/55 mb-2">
              Notas
            </div>
            <p className="m-0 text-[17px] leading-relaxed whitespace-pre-line">
              {appointment.notes}
            </p>
          </section>
        ) : null}

        {/* Bloque de cancelación */}
        {appointment.status === "cancelled" ? (
          <section className="border-t border-line pt-5">
            <div className="rounded-xl bg-err/[0.07] border border-err/20 px-5 py-4">
              <div className="text-[14px] font-semibold tracking-[0.12em] uppercase text-err mb-2 inline-flex items-center gap-2">
                <Icon name="warning" size={15} />
                Cita cancelada
              </div>
              {appointment.cancelReason ? (
                <p className="m-0 text-[16.5px] leading-snug">
                  <strong className="text-ink">Motivo:</strong> {appointment.cancelReason}
                </p>
              ) : null}
              {appointment.cancelledAt ? (
                <p className="m-0 mt-1.5 text-[14.5px] text-ink/60 leading-snug">
                  Cancelada el {formatDate(appointment.cancelledAt)} a las{" "}
                  {formatTime(appointment.cancelledAt)}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* Bloque de reagenda */}
        {appointment.status === "rescheduled" && appointment.rescheduledAt ? (
          <section className="border-t border-line pt-5">
            <div className="rounded-xl bg-warn/[0.08] border border-warn/25 px-5 py-4">
              <div className="text-[14px] font-semibold tracking-[0.12em] uppercase text-warn mb-2 inline-flex items-center gap-2">
                <Icon name="calendar" size={15} />
                Cita reagendada
              </div>
              <p className="m-0 text-[16.5px] leading-snug">
                Movida el {formatDate(appointment.rescheduledAt)} a las{" "}
                {formatTime(appointment.rescheduledAt)}
              </p>
            </div>
          </section>
        ) : null}

        {/* Notice de éxito */}
        {notice ? (
          <div className="inline-flex items-center gap-2 px-4 py-3 bg-ok/[0.1] text-ok rounded-md text-[16px] font-semibold leading-none border border-ok/25 self-start">
            <Icon name="check" /> {notice}
          </div>
        ) : null}

        {/* Acciones (solo si no es final) */}
        {!isFinal && !notice ? (
          <section className="border-t border-line pt-5">
            <div className="text-[14px] font-semibold tracking-[0.12em] uppercase text-ink/55 mb-3">
              Acciones
            </div>
            {mode === "view" ? (
              <ViewActions
                appointment={appointment}
                isPending={isPending}
                onConfirm={() =>
                  withSuccess("Cita confirmada", () =>
                    transitionAppointment(appointment.id, "confirm"),
                  )
                }
                onComplete={() =>
                  withSuccess("Cita marcada como completada", () =>
                    transitionAppointment(appointment.id, "complete"),
                  )
                }
                onStartReschedule={() => setMode("reschedule")}
                onStartCancel={() => setMode("cancel")}
              />
            ) : mode === "reschedule" ? (
              <RescheduleForm
                appointment={appointment}
                isPending={isPending}
                onBack={() => setMode("view")}
                onSubmit={(date, time) =>
                  withSuccess("Cita reagendada", () =>
                    rescheduleAppointment({
                      appointmentId: appointment.id,
                      date,
                      time,
                    }),
                  )
                }
              />
            ) : (
              <CancelForm
                isPending={isPending}
                onBack={() => setMode("view")}
                onSubmit={(reason) =>
                  withSuccess("Cita cancelada", () =>
                    cancelAppointment({
                      appointmentId: appointment.id,
                      ...(reason ? { reason } : {}),
                    }),
                  )
                }
              />
            )}
          </section>
        ) : null}
      </Card>
    </div>
  );
}

function BigField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: "user" | "home" | "calendar" | "star";
}) {
  return (
    <div className="flex items-start gap-3">
      {icon ? (
        <span
          aria-hidden
          className="inline-flex w-9 h-9 items-center justify-center rounded-md bg-bone text-ink/60 shrink-0 mt-0.5"
        >
          <Icon name={icon} size={16} />
        </span>
      ) : null}
      <div className="min-w-0 flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold tracking-[0.08em] uppercase text-ink/55">
          {label}
        </span>
        <span className="text-[17px] font-semibold leading-tight">{value}</span>
      </div>
    </div>
  );
}

function ViewActions({
  appointment,
  isPending,
  onConfirm,
  onComplete,
  onStartReschedule,
  onStartCancel,
}: {
  appointment: Appointment;
  isPending: boolean;
  onConfirm: () => void;
  onComplete: () => void;
  onStartReschedule: () => void;
  onStartCancel: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {appointment.status !== "confirmed" ? (
        <Button
          variant="primary"
          leading={<Icon name="check" />}
          loading={isPending}
          onClick={onConfirm}
        >
          Confirmar cita
        </Button>
      ) : null}
      <Button
        variant="ghost"
        leading={<Icon name="check" />}
        loading={isPending}
        onClick={onComplete}
      >
        Marcar como completada
      </Button>
      <Button variant="ghost" leading={<Icon name="calendar" />} onClick={onStartReschedule}>
        Reagendar
      </Button>
      <Button variant="danger" leading={<Icon name="x" />} onClick={onStartCancel}>
        Cancelar cita
      </Button>
    </div>
  );
}

function RescheduleForm({
  appointment,
  isPending,
  onBack,
  onSubmit,
}: {
  appointment: Appointment;
  isPending: boolean;
  onBack: () => void;
  onSubmit: (date: string, time: string) => void;
}) {
  const at = new Date(appointment.at);
  const [date, setDate] = useState<string>(
    `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`,
  );
  const [time, setTime] = useState<string>(`${pad(at.getHours())}:${pad(at.getMinutes())}`);

  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-[15.5px] text-ink/70 leading-snug">
        Selecciona la nueva fecha y hora. La cita actual queda como{" "}
        <strong className="text-ink">reagendada</strong> y se crea esta nueva entrada.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[480px]">
        <Input label="Nueva fecha" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input label="Nueva hora" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onBack}>
          Volver
        </Button>
        <Button variant="primary" loading={isPending} onClick={() => onSubmit(date, time)}>
          Confirmar reagenda
        </Button>
      </div>
    </div>
  );
}

function CancelForm({
  isPending,
  onBack,
  onSubmit,
}: {
  isPending: boolean;
  onBack: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-[15.5px] text-ink/70 leading-snug">
        Cancelar es definitivo. Opcionalmente captura el motivo para tener contexto en el historial.
      </p>
      <Input
        label="Motivo (opcional)"
        placeholder='ej. "Cliente sin disponibilidad"'
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onBack}>
          Volver
        </Button>
        <Button variant="danger" loading={isPending} onClick={() => onSubmit(reason)}>
          Confirmar cancelación
        </Button>
      </div>
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
