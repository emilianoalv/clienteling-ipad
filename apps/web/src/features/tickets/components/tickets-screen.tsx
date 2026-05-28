"use client";

import { useMemo, useState } from "react";
import type { Ticket, TicketStatus } from "@/types/ticket";
import { Button, Chip, Icon, ProgressBar } from "@/components/primitives";
import { Card, KpiCard, SectionHeader } from "@/components/patterns";
import { aggregateTicketStats } from "../services/aggregate-ticket-stats";

const STATUS_VARIANT: Record<TicketStatus, "ok" | "warn" | "danger"> = {
  Abierto: "danger",
  "En curso": "warn",
  Resuelto: "ok",
};

const STATUS_FILTERS: ReadonlyArray<TicketStatus | "Todas"> = [
  "Todas",
  "Abierto",
  "En curso",
  "Resuelto",
];

const DAY_MS = 86_400_000;
const TODAY = new Date("2026-04-23T00:00:00Z").getTime();

export interface TicketsScreenProps {
  tickets: readonly Ticket[];
}

export function TicketsScreen({ tickets }: TicketsScreenProps) {
  const [filter, setFilter] = useState<TicketStatus | "Todas">("Todas");

  const filtered = useMemo(() => {
    if (filter === "Todas") return tickets;
    return tickets.filter((t) => t.status === filter);
  }, [tickets, filter]);

  const stats = useMemo(() => aggregateTicketStats(tickets), [tickets]);
  const maxCategory = Math.max(1, ...stats.byCategory.map((c) => c.count));

  return (
    <div className="grid grid-cols-[1.4fr_1fr] gap-5 items-start">
      <div className="flex flex-col gap-4">
        <Card variant="luxe" className="flex items-center gap-4">
          <div>
            <span className="block text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              Incidencias
            </span>
            <h2 className="m-0 font-display text-[24px] leading-tight">Soporte técnico</h2>
          </div>
          <div className="flex-1" />
          <div className="inline-flex bg-bone rounded-pill p-[3px] border border-line">
            {STATUS_FILTERS.map((s) => {
              const active = filter === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilter(s)}
                  aria-pressed={active}
                  className={`h-7 px-3 rounded-pill border-0 text-[15px] font-semibold cursor-pointer transition-colors ${
                    active
                      ? "bg-white text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                      : "bg-transparent text-ink/60"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <Button variant="primary" leading={<Icon name="plus" size={12} />}>
            Nuevo ticket
          </Button>
        </Card>

        <Card variant="flat" className="p-0 overflow-hidden">
          <div className="grid grid-cols-[0.8fr_2fr_1fr_1fr_0.8fr_0.8fr] gap-3 px-5 py-3 bg-bone border-b border-line text-[14px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            <span>ID</span>
            <span>Título</span>
            <span>Categoría</span>
            <span>Estado</span>
            <span>Abierto</span>
            <span>Resuelto</span>
          </div>
          <ul className="list-none m-0 p-0">
            {filtered.map((t) => {
              const opened = new Date(t.openedAt).getTime();
              const refTime = t.resolvedAt ? new Date(t.resolvedAt).getTime() : TODAY;
              const days = Math.max(0, Math.round((refTime - opened) / DAY_MS));
              return (
                <li
                  key={t.id}
                  className="grid grid-cols-[0.8fr_2fr_1fr_1fr_0.8fr_0.8fr] gap-3 px-5 py-3.5 border-b border-line last:border-b-0 items-center"
                >
                  <span className="font-mono text-[16px] font-semibold">{t.id}</span>
                  <span className="text-[16px]">{t.title}</span>
                  <Chip size="sm">{t.category}</Chip>
                  <span>
                    <Chip variant={STATUS_VARIANT[t.status]} size="sm">
                      {t.status}
                    </Chip>
                  </span>
                  <span className="text-[16px] tabular">{formatShortDate(t.openedAt)}</span>
                  <span
                    className={
                      t.resolvedAt
                        ? "text-[16px] tabular"
                        : "text-[16px] tabular text-warn"
                    }
                  >
                    {t.resolvedAt ? `${days} d` : `${days} d abierto`}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <aside className="flex flex-col gap-4 sticky top-4">
        <Card variant="flat" className="grid grid-cols-2 gap-5">
          <KpiCard
            label="Tiempo medio resol."
            value={`${stats.mttrDays.toFixed(1)} d`}
            size="lg"
          />
          <KpiCard
            label="SLA cumplido"
            value={`${Math.round(stats.slaPct * 100)}%`}
            size="lg"
            tone={stats.slaPct >= 0.9 ? "ok" : stats.slaPct >= 0.7 ? "warn" : "danger"}
          />
        </Card>

        <Card>
          <SectionHeader size="inline" title="Por categoría" />
          <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
            {stats.byCategory.map((c) => (
              <li key={c.category}>
                <div className="flex justify-between text-[16px] mb-1">
                  <span>{c.category}</span>
                  <span className="tabular">{c.count}</span>
                </div>
                <ProgressBar value={c.count / maxCategory} />
              </li>
            ))}
          </ul>
        </Card>
      </aside>
    </div>
  );
}

function formatShortDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}
