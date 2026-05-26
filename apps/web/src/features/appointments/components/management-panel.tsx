"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import { Avatar, type AvatarTone, BrandTag, Icon, Input } from "@/components/primitives";
import { Card } from "@/components/patterns";
import { aggregateAppointmentStats } from "../services/appointment-stats";

const FILTER_STATUSES: ReadonlyArray<AppointmentStatus | "all"> = [
  "all",
  "scheduled",
  "rescheduled",
  "cancelled",
  "completed",
];

const FILTER_LABEL_KEY: Record<AppointmentStatus | "all", string> = {
  all: "appointment.management.filter_all",
  scheduled: "appointment.status.scheduled",
  confirmed: "appointment.status.confirmed",
  rescheduled: "appointment.status.rescheduled",
  cancelled: "appointment.status.cancelled",
  completed: "appointment.status.completed",
  "no-show": "appointment.status.no-show",
};

const STATUS_TONE: Record<AppointmentStatus, string> = {
  scheduled: "bg-ok/10 text-ok border-ok/20",
  confirmed: "bg-ok/10 text-ok border-ok/20",
  rescheduled: "bg-warn/10 text-warn border-warn/20",
  cancelled: "bg-err/10 text-err border-err/20",
  completed: "bg-bone text-ink border-line",
  "no-show": "bg-err/10 text-err border-err/20",
};

export interface ManagementPanelProps {
  appointments: readonly Appointment[];
  clientLookup: Readonly<Record<string, string>>;
}

export function ManagementPanel({ appointments, clientLookup }: ManagementPanelProps) {
  const t = useTranslations();
  const stats = useMemo(() => aggregateAppointmentStats(appointments), [appointments]);
  const [filter, setFilter] = useState<AppointmentStatus | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const byStatus =
      filter === "all"
        ? appointments
        : filter === "scheduled"
          ? appointments.filter((a) => a.status === "scheduled" || a.status === "confirmed")
          : appointments.filter((a) => a.status === filter);
    if (!needle) return byStatus;
    return byStatus.filter((a) =>
      (clientLookup[a.clientId] ?? "").toLowerCase().includes(needle),
    );
  }, [appointments, filter, query, clientLookup]);

  const ratePct = (rate: number) => Math.round(rate * 100);

  return (
    <div className="flex flex-col gap-4">
      {/* KPI strip */}
      <div className="grid grid-cols-5 gap-3">
        <KpiBlock
          eyebrow={t("appointment.management.kpi.total")}
          value={stats.total}
          sub={t("appointment.management.kpi.total_subtitle")}
        />
        <KpiBlock
          eyebrow={t("appointment.management.kpi.scheduled")}
          value={stats.scheduled}
          sub={t("appointment.management.kpi.scheduled_subtitle")}
          accent="border-l-ok"
        />
        <KpiBlock
          eyebrow={t("appointment.management.kpi.rescheduled")}
          value={stats.rescheduled}
          sub={t("appointment.management.kpi.rate", { rate: ratePct(stats.rescheduleRate) })}
          accent="border-l-warn"
        />
        <KpiBlock
          eyebrow={t("appointment.management.kpi.cancelled")}
          value={stats.cancelled}
          sub={t("appointment.management.kpi.rate", { rate: ratePct(stats.cancelRate) })}
          accent="border-l-err"
        />
        <KpiBlock
          eyebrow={t("appointment.management.kpi.completed")}
          value={stats.completed}
          sub={t("appointment.management.kpi.completed_subtitle")}
        />
      </div>

      {/* Search + filter chips — mismo estilo que Catálogo (Card flat con
          input grande + segmented control en pills al lado). */}
      <Card variant="flat" className="flex items-center gap-2.5 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cliente por nombre…"
            aria-label="Buscar cliente"
            className="pl-9"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40">
            <Icon name="search" size={16} />
          </span>
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md inline-flex items-center justify-center text-ink/55 hover:bg-ink/[0.04] cursor-pointer"
            >
              <Icon name="x" size={14} />
            </button>
          ) : null}
        </div>
        <div className="inline-flex bg-bone rounded-pill p-[3px] border border-line">
          {FILTER_STATUSES.map((s) => {
            const active = filter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                aria-pressed={active}
                className={`h-7 px-3.5 rounded-pill border-0 text-[16px] font-medium cursor-pointer transition-colors ${
                  active
                    ? "bg-white text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                    : "bg-transparent text-ink/60"
                }`}
              >
                {t(FILTER_LABEL_KEY[s] as Parameters<typeof t>[0])}
              </button>
            );
          })}
        </div>
      </Card>

      {/* History table */}
      <Card variant="flat" className="p-0 overflow-hidden">
        <div className="grid grid-cols-[1.5fr_1.1fr_0.9fr_0.9fr_1fr_1.2fr_1.4fr] gap-3 px-5 py-3 bg-bone border-b border-line text-[14px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          <span>{t("appointment.management.column.client")}</span>
          <span>{t("appointment.management.column.kind")}</span>
          <span>{t("appointment.management.column.original")}</span>
          <span>{t("appointment.management.column.status")}</span>
          <span>{t("appointment.management.column.new_date")}</span>
          <span>{t("appointment.management.column.reason")}</span>
          <span>{t("appointment.management.column.notes")}</span>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-[16px] font-medium text-ink/60">
            {query
              ? `Sin coincidencias para "${query}"`
              : t("appointment.management.empty")}
          </div>
        ) : (
          <ul className="list-none m-0 p-0">
            {filtered.map((a) => {
              const tone: AvatarTone = brandToTone(a.brand);
              const clientName = clientLookup[a.clientId] ?? "—";
              return (
                <li key={a.id} className="border-b border-line last:border-b-0">
                  <Link
                    href={`/ba/clients/${a.clientId}/appointments/${a.id}`}
                    className="grid grid-cols-[1.5fr_1.1fr_0.9fr_0.9fr_1fr_1.2fr_1.4fr] gap-3 px-5 py-3 items-center text-ink no-underline transition-colors hover:bg-bone/50"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar initials={initials(clientName)} size={32} tone={tone} />
                      <div className="min-w-0">
                        <div className="text-[16px] font-semibold leading-tight truncate">
                          {clientName}
                        </div>
                        <BrandTag brand={a.brand} alwaysShow />
                      </div>
                    </div>
                    <div className="text-[16px] font-medium leading-snug">
                      {t(`appointment.kind.${a.kind}`)}
                    </div>
                    <div className="text-[16px] font-medium tabular">
                      <span>{formatDate(a.at)}</span>
                      <span className="text-ink/60"> · {formatTime(a.at)}</span>
                    </div>
                    <span
                      className={`inline-flex w-fit h-6 px-2.5 items-center rounded-pill border text-[15px] font-semibold ${STATUS_TONE[a.status]}`}
                    >
                      {t(`appointment.status.${a.status}`)}
                    </span>
                    <div className="text-[16px] font-medium tabular">
                      {a.rescheduledAt ? (
                        <>
                          <span>{formatDate(a.rescheduledAt)}</span>
                          <span className="text-ink/60"> · {formatTime(a.rescheduledAt)}</span>
                        </>
                      ) : (
                        <span className="text-ink/40">—</span>
                      )}
                    </div>
                    <div className="text-[16px] font-medium leading-snug text-ink/60 truncate">
                      {a.cancelReason ?? (
                        <span className="text-ink/40">—</span>
                      )}
                    </div>
                    <div className="text-[16px] font-medium leading-snug text-ink/60 truncate">
                      {a.notes ?? <span className="text-ink/40">—</span>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function KpiBlock({
  eyebrow,
  value,
  sub,
  accent,
}: {
  eyebrow: string;
  value: number;
  sub: string;
  accent?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(14,14,15,0.03)] ${
        accent ? `border-l-[3px] ${accent}` : ""
      }`}
    >
      <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        {eyebrow}
      </span>
      <div className="mt-1 font-display text-[32px] leading-none tabular">{value}</div>
      <div className="mt-1.5 text-[15px] font-medium leading-snug text-ink/60">{sub}</div>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
}

function brandToTone(brand: Appointment["brand"]): AvatarTone {
  if (brand === "Lancôme") return "lancome";
  if (brand === "YSL") return "ysl";
  return "default";
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}
