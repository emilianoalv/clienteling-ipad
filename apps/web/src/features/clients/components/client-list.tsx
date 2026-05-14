"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar, Button, Icon } from "@/components/primitives";
import { EmptyState } from "@/components/patterns";
import { formatCurrency } from "@/lib/format/format-currency";
import type { Client, Segment } from "@/types/client";
import { segmentClient } from "../services/segment-client";

type SegmentFilter = Segment | "all";

const SEGMENT_LABEL: Record<SegmentFilter, string> = {
  all: "Todas",
  VIP: "VIP",
  Recurrent: "Recurrente",
  New: "Nueva",
  AtRisk: "En riesgo",
};

const SEGMENT_CHIP: Record<Segment, { bg: string; fg: string }> = {
  VIP: { bg: "bg-[#1F2A24]", fg: "text-[#E9D6A6]" },
  Recurrent: { bg: "bg-[#E6EEE7]", fg: "text-[#1F7A5A]" },
  New: { bg: "bg-[#FFF1DE]", fg: "text-[#9F6A18]" },
  AtRisk: { bg: "bg-[#FBE6E2]", fg: "text-[#A23A2E]" },
};

export interface ClientListProps {
  clients: readonly Client[];
}

export function ClientList({ clients }: ClientListProps) {
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<SegmentFilter>("all");

  const enriched = useMemo(
    () => clients.map((c) => ({ client: c, segment: segmentClient(c) })),
    [clients],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return enriched.filter(({ client, segment: s }) => {
      if (segment !== "all" && s !== segment) return false;
      if (!needle) return true;
      const hay = `${client.name} ${client.email} ${client.phone}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [enriched, query, segment]);

  const counts = useMemo<Record<SegmentFilter, number>>(() => {
    const acc: Record<SegmentFilter, number> = {
      all: enriched.length,
      VIP: 0,
      Recurrent: 0,
      New: 0,
      AtRisk: 0,
    };
    for (const { segment: s } of enriched) acc[s]++;
    return acc;
  }, [enriched]);

  const filters: ReadonlyArray<SegmentFilter> = ["all", "VIP", "Recurrent", "New", "AtRisk"];

  return (
    <div className="flex flex-col gap-4">
      {/* Search + New client */}
      <article className="bg-white border border-line rounded-xl p-4 flex items-center gap-2.5 shadow-[0_1px_2px_rgba(14,14,15,0.03)]">
        <div className="relative flex-1">
          <span
            aria-hidden
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40"
          >
            <Icon name="search" size={18} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, teléfono o email…"
            aria-label="Buscar clientas"
            className="h-[52px] w-full rounded-[10px] border border-transparent bg-bone pl-[48px] pr-4 text-[18px] text-ink outline-none placeholder:text-ink/40 focus-visible:border-ink"
          />
        </div>
        <Link href="/ba/clients/new">
          <Button variant="primary" leading={<Icon name="plus" />} className="h-[52px] px-5">
            Nueva clienta
          </Button>
        </Link>
      </article>

      {/* Segment filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mr-1">
          Segmento
        </span>
        {filters.map((id) => {
          const active = segment === id;
          const count = counts[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSegment(id)}
              aria-pressed={active}
              className={`inline-flex items-center gap-1.5 h-[30px] px-3 rounded-full border text-[16px] font-semibold tracking-[0.01em] cursor-pointer transition-colors ${
                active
                  ? segmentChipClass(id)
                  : "bg-white border-line text-ink/70 hover:text-ink"
              }`}
            >
              <span>{SEGMENT_LABEL[id]}</span>
              <span className="opacity-70 font-medium">· {count}</span>
            </button>
          );
        })}
        <div className="flex-1" />
        <span className="text-xs text-ink/60">
          {filtered.length} de {enriched.length} clientas
        </span>
        <Button size="sm" leading={<Icon name="download" size={12} />}>
          Exportar
        </Button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="search"
          title="Sin resultados"
          description="No hay clientas que coincidan con esta búsqueda o segmento."
        />
      ) : (
        <article className="bg-white border border-line rounded-xl overflow-hidden">
          <div
            role="row"
            className="grid grid-cols-[44px_1.8fr_1fr_1.1fr_1fr_1fr_30px] gap-4 px-5 py-3 bg-bone border-b border-line"
          >
            <span />
            <span className="text-[14px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              Clienta · Email
            </span>
            <span className="text-[14px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              Teléfono
            </span>
            <span className="text-[14px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              Segmento
            </span>
            <span className="text-[14px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              LTV
            </span>
            <span className="text-[14px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              Última visita
            </span>
            <span />
          </div>
          <ul className="list-none m-0 p-0">
            {filtered.map(({ client, segment: s }) => (
              <li key={client.id}>
                <Link
                  href={`/ba/clients/${client.id}`}
                  className="grid grid-cols-[44px_1.8fr_1fr_1.1fr_1fr_1fr_30px] items-center gap-4 px-5 py-3.5 border-b border-line last:border-b-0 text-ink no-underline transition-colors hover:bg-bone/60"
                >
                  <Avatar
                    initials={initials(client.name)}
                    size={40}
                    tone={client.brands[0] === "Lancôme" ? "lancome" : "ysl"}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{client.name}</div>
                    <div className="text-[15.5px] text-ink/60 truncate">{client.email || "—"}</div>
                  </div>
                  <span className="text-[16px] text-ink/80 tabular">{client.phone || "—"}</span>
                  <SegmentChip segment={s} />
                  <span className="text-sm font-medium tabular">
                    {formatCurrency(client.stats.ltv)}
                  </span>
                  <span className="text-xs text-ink/60">
                    {formatRelative(client.stats.lastPurchase)}
                  </span>
                  <Icon name="arrow-right" size={14} className="text-ink/40" />
                </Link>
              </li>
            ))}
          </ul>
        </article>
      )}
    </div>
  );
}

function SegmentChip({ segment }: { segment: Segment }) {
  const tone = SEGMENT_CHIP[segment];
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full text-[15px] font-semibold w-fit ${tone.bg} ${tone.fg}`}
    >
      <span className="text-[11px]">●</span>
      {SEGMENT_LABEL[segment]}
    </span>
  );
}

function segmentChipClass(id: SegmentFilter): string {
  if (id === "all") return "bg-bone border-transparent text-ink";
  const tone = SEGMENT_CHIP[id];
  return `${tone.bg} ${tone.fg} border-transparent`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
}

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const days = Math.round((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  if (days < 30) return `hace ${Math.round(days / 7)} sem`;
  if (days < 365) return `hace ${Math.round(days / 30)} meses`;
  return `hace ${Math.round(days / 365)} años`;
}
