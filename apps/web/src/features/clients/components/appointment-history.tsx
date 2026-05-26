"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import { Avatar, BrandTag, Chip, Icon } from "@/components/primitives";
import { formatDate, formatTime } from "@/lib/format/format-date";

export type RangeFilter = "3m" | "6m" | "12m" | "all";
export type StatusFilter = "all" | "upcoming" | "completed" | "cancelled";

const RANGES: ReadonlyArray<{ id: RangeFilter; label: string; months: number | null }> = [
  { id: "3m", label: "3 meses", months: 3 },
  { id: "6m", label: "6 meses", months: 6 },
  { id: "12m", label: "12 meses", months: 12 },
  { id: "all", label: "Todo", months: null },
];

const STATUSES: ReadonlyArray<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "Todas" },
  { id: "upcoming", label: "Próximas" },
  { id: "completed", label: "Completadas" },
  { id: "cancelled", label: "Canceladas / No show" },
];

const TONE_BY_BRAND = {
  Lancôme: "lancome",
  YSL: "ysl",
} as const;

function avatarTone(brand: string | undefined): "default" | "lancome" | "ysl" {
  if (!brand) return "default";
  return (TONE_BY_BRAND as Record<string, "lancome" | "ysl">)[brand] ?? "default";
}

export interface AppointmentHistoryProps {
  clientId: string;
  clientName: string;
  appointments: readonly Appointment[];
  baLookup: Record<string, string>;
  /** Prefijo para el link de cada fila al detalle. Default `/ba/clients`. */
  basePath?: string;
}

export function AppointmentHistory({
  clientId,
  clientName,
  appointments,
  baLookup,
  basePath = "/ba/clients",
}: AppointmentHistoryProps) {
  const t = useTranslations();
  const [range, setRange] = useState<RangeFilter>("12m");
  const [status, setStatus] = useState<StatusFilter>("all");

  const now = Date.now();

  const filtered = useMemo(() => {
    const cfg = RANGES.find((r) => r.id === range)!;
    const cutoff =
      cfg.months == null
        ? null
        : (() => {
            const d = new Date();
            d.setMonth(d.getMonth() - cfg.months);
            return d.getTime();
          })();
    return appointments
      .filter((a) => {
        const t = new Date(a.at).getTime();
        if (status === "upcoming") {
          if (t < now) return false;
          if (a.status === "cancelled" || a.status === "completed" || a.status === "no-show")
            return false;
        }
        if (status === "completed" && a.status !== "completed") return false;
        if (status === "cancelled" && a.status !== "cancelled" && a.status !== "no-show")
          return false;
        if (cutoff != null && t < cutoff) return false;
        return true;
      })
      .sort((a, b) => {
        const aFuture = new Date(a.at).getTime() >= now;
        const bFuture = new Date(b.at).getTime() >= now;
        if (aFuture !== bFuture) return aFuture ? -1 : 1;
        return b.at.localeCompare(a.at);
      });
  }, [appointments, range, status, now]);

  const total = filtered.length;
  const completed = filtered.filter((a) => a.status === "completed").length;
  const concluded = filtered.filter(
    (a) => a.status === "completed" || a.status === "cancelled" || a.status === "no-show",
  ).length;
  const attendanceRate = concluded === 0 ? 0 : Math.round((completed / concluded) * 100);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            {clientName}
          </div>
          <h2 className="m-0 mt-1 font-display text-[32px] leading-tight tracking-[-0.01em]">
            Citas
          </h2>
          <p className="m-0 mt-1.5 text-[15px] text-ink/60 leading-snug">
            Citas atendidas y por venir. La tasa de asistencia compara completadas vs canceladas y
            no-shows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center h-8 px-3 rounded-full border border-line text-[14px] font-medium text-ink/70">
            {total} {total === 1 ? "cita" : "citas"}
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-2.5">
        <FilterRow
          label="Periodo"
          options={RANGES}
          value={range}
          onChange={(v) => setRange(v as RangeFilter)}
        />
        <FilterRow
          label="Estado"
          options={STATUSES}
          value={status}
          onChange={(v) => setStatus(v as StatusFilter)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Total" value={String(total)} />
        <KpiCard label="Completadas" value={String(completed)} subtitle={`de ${concluded} concluidas`} />
        <KpiCard label="Tasa de asistencia" value={`${attendanceRate}%`} />
      </div>

      {filtered.length === 0 ? (
        <article className="bg-white border border-line rounded-xl p-10 text-center">
          <p className="m-0 text-[15px] text-ink/60">No hay citas en este filtro.</p>
        </article>
      ) : (
        <article className="bg-white border border-line rounded-xl divide-y divide-line">
          {filtered.map((a) => (
            <AppointmentRow
              key={a.id}
              appointment={a}
              clientId={clientId}
              baLookup={baLookup}
              kindLabel={t(`appointment.kind.${a.kind}`)}
              statusLabel={t(`appointment.status.${a.status}`)}
              basePath={basePath}
            />
          ))}
        </article>
      )}
    </div>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<{ id: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-[13px] font-semibold tracking-[0.08em] uppercase text-ink/55 min-w-[60px]">
        {label}
      </span>
      <div className="flex items-center gap-2 flex-wrap">
        {options.map((o) => {
          const active = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              aria-pressed={active}
              className={`inline-flex items-center h-9 px-4 rounded-full border text-[14px] font-semibold cursor-pointer transition-colors ${
                active
                  ? "bg-ink text-paper border-ink"
                  : "bg-white text-ink border-line hover:bg-bone"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white border border-line rounded-xl px-5 py-4">
      <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        {label}
      </div>
      <div className="font-display text-[32px] mt-1.5 leading-none tabular">{value}</div>
      {subtitle ? (
        <p className="m-0 mt-1 text-[13.5px] text-ink/55 leading-snug">{subtitle}</p>
      ) : null}
    </div>
  );
}

function AppointmentRow({
  appointment,
  clientId,
  baLookup,
  kindLabel,
  statusLabel,
  basePath,
}: {
  appointment: Appointment;
  clientId: string;
  baLookup: Record<string, string>;
  kindLabel: string;
  statusLabel: string;
  basePath: string;
}) {
  const baName = baLookup[appointment.baId as unknown as string] ?? "—";
  const initial = kindLabel[0]?.toUpperCase() ?? "•";

  return (
    <Link
      href={`${basePath}/${clientId}/appointments/${appointment.id}`}
      className="block p-5 text-ink no-underline transition-colors hover:bg-bone/40"
    >
      <div className="grid grid-cols-[44px_minmax(0,1fr)_auto] gap-3.5 items-center">
        <Avatar initials={initial} size={40} tone={avatarTone(appointment.brand)} />
        <div className="min-w-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-[20px] leading-none">{kindLabel}</span>
          <BrandTag brand={appointment.brand} alwaysShow />
          <span className="text-[13.5px] text-ink/60">{appointment.durationMin} min</span>
          <span className="w-full text-[14px] text-ink/60 mt-0.5">
            <Icon name="calendar" size={12} /> {formatDate(appointment.at)} ·{" "}
            {formatTime(appointment.at)} · por <strong className="text-ink/75">{baName}</strong>
          </span>
        </div>
        <AppointmentStatusChip status={appointment.status} label={statusLabel} />
      </div>
    </Link>
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
