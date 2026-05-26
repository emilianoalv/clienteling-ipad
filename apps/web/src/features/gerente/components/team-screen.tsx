"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BrandId } from "@/types/brand";
import type { Segment } from "@/types/client";
import { Avatar, BrandTag, Chip, Icon, Input } from "@/components/primitives";
import { Card } from "@/components/patterns";
import { formatCurrency } from "@/lib/format/format-currency";

export interface TeamBaSummary {
  baId: string;
  name: string;
  brand: BrandId | null;
  storeName: string;
  monthlyTarget: number;
  clientsCount: number;
  pendingTasks: number;
  monthSales: number;
}

export interface TeamClientSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  brands: readonly BrandId[];
  /**
   * Segmento derivado (no el tier de loyalty). Refleja salud del cliente:
   * VIP (alto LTV+visits), Recurrent (compras frecuentes), New (≤90 días),
   * AtRisk (>180d sin comprar).
   */
  segment: Segment;
  lastPurchase: string | null;
  ltv: number;
}

export interface TeamScreenProps {
  team: readonly TeamBaSummary[];
  clientsByBa: Readonly<Record<string, readonly TeamClientSummary[]>>;
  selectedBaId: string | null;
}

const SEGMENT_VARIANT: Record<Segment, "neutral" | "accent" | "ok" | "danger"> = {
  VIP: "accent",
  Recurrent: "ok",
  New: "neutral",
  AtRisk: "danger",
};

const SEGMENT_LABEL: Record<Segment, string> = {
  VIP: "VIP",
  Recurrent: "Recurrente",
  New: "Nueva",
  AtRisk: "En riesgo",
};

export function TeamScreen({ team, clientsByBa, selectedBaId }: TeamScreenProps) {
  const [activeBa, setActiveBa] = useState<string | null>(selectedBaId);
  const [query, setQuery] = useState("");

  const selectedBa = useMemo(
    () => team.find((b) => b.baId === activeBa) ?? team[0] ?? null,
    [activeBa, team],
  );
  const clients = activeBa ? (clientsByBa[activeBa] ?? []) : [];

  const filteredClients = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return clients;
    return clients.filter((c) =>
      `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(needle),
    );
  }, [clients, query]);

  return (
    <div className="grid grid-cols-[360px_minmax(0,1fr)] gap-5 items-start">
      {/* Sidebar: lista de BAs con KPIs */}
      <aside className="flex flex-col gap-2">
        <div className="text-[12.5px] font-semibold tracking-[0.12em] uppercase text-ink/55 px-1">
          Beauty Advisors · {team.length}
        </div>
        {team.map((ba) => {
          const active = ba.baId === activeBa;
          const progress =
            ba.monthlyTarget > 0
              ? Math.min(100, Math.round((ba.monthSales / ba.monthlyTarget) * 100))
              : 0;
          return (
            <button
              key={ba.baId}
              type="button"
              onClick={() => setActiveBa(ba.baId)}
              className={`text-left w-full rounded-lg border p-3.5 flex flex-col gap-2 cursor-pointer transition-colors ${
                active
                  ? "bg-white border-ink shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                  : "bg-white/60 border-line hover:bg-bone/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <Avatar
                  initials={initials(ba.name)}
                  size={40}
                  tone={ba.brand === "Lancôme" ? "lancome" : ba.brand === "YSL" ? "ysl" : "default"}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[15.5px] font-semibold leading-tight truncate">
                    {ba.name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {ba.brand ? <BrandTag brand={ba.brand} alwaysShow /> : null}
                    <span className="text-[12.5px] text-ink/60 truncate">{ba.storeName}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[12px]">
                <Stat label="Clientes" value={String(ba.clientsCount)} />
                <Stat label="Tareas" value={String(ba.pendingTasks)} />
                <Stat label="Mes" value={formatCurrency(ba.monthSales)} />
              </div>
              {ba.monthlyTarget > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-bone rounded-full overflow-hidden">
                    <div
                      className={`h-full ${progress >= 100 ? "bg-ok" : progress >= 70 ? "bg-warn" : "bg-ink/40"}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[11.5px] font-medium tabular text-ink/60">
                    {progress}% de meta
                  </span>
                </div>
              ) : null}
            </button>
          );
        })}
      </aside>

      {/* Main: clientes asignados al BA seleccionado */}
      <main className="flex flex-col gap-4 min-w-0">
        {selectedBa ? (
          <Card variant="flat" className="flex flex-col gap-4">
            <header className="flex items-baseline justify-between gap-3 flex-wrap">
              <div>
                <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
                  Clientes de {selectedBa.name.split(/\s+/)[0]}
                </div>
                <p className="m-0 mt-1 text-[14.5px] text-ink/60 leading-snug">
                  {clients.length} {clients.length === 1 ? "cliente asignada" : "clientes asignadas"}.{" "}
                  Toca cualquiera para abrir su perfil.
                </p>
              </div>
            </header>
            <div className="relative">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, correo o teléfono…"
                className="pl-9"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40">
                <Icon name="search" size={16} />
              </span>
            </div>
            {filteredClients.length === 0 ? (
              <p className="m-0 text-[14.5px] text-ink/55 text-center py-8">
                {clients.length === 0
                  ? "Sin clientes asignadas todavía."
                  : `Sin coincidencias para "${query}".`}
              </p>
            ) : (
              <ul className="list-none m-0 p-0 flex flex-col">
                {filteredClients.map((c) => (
                  <li key={c.id} className="border-b border-line last:border-b-0">
                    <Link
                      href={`/gerente/clients/${c.id}`}
                      className="grid grid-cols-[40px_minmax(0,1fr)_120px_120px_auto] items-center gap-3.5 py-3 px-1 text-ink no-underline hover:bg-bone/40 rounded-md"
                    >
                      <Avatar initials={initials(c.name)} size={36} />
                      <div className="min-w-0">
                        <div className="text-[15.5px] font-semibold leading-tight truncate">
                          {c.name}
                        </div>
                        <div className="text-[13.5px] text-ink/55 leading-snug truncate">
                          {c.email} · {c.phone}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {c.brands.map((b) => (
                          <BrandTag key={b} brand={b} alwaysShow />
                        ))}
                      </div>
                      <Chip variant={SEGMENT_VARIANT[c.segment]} size="sm">
                        {SEGMENT_LABEL[c.segment]}
                      </Chip>
                      <div className="text-right">
                        <div className="text-[14px] font-semibold tabular leading-tight">
                          {formatCurrency(c.ltv)}
                        </div>
                        <div className="text-[12px] text-ink/50 leading-tight mt-0.5">
                          {c.lastPurchase ? `Última: ${formatRelative(c.lastPurchase)}` : "Sin compras"}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : null}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bone rounded-md px-2 py-1.5">
      <div className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-ink/55 leading-none">
        {label}
      </div>
      <div className="text-[13px] font-semibold tabular mt-0.5 leading-none">{value}</div>
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

function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const days = Math.round((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days}d`;
  if (days < 30) return `hace ${Math.round(days / 7)}sem`;
  if (days < 365) return `hace ${Math.round(days / 30)}m`;
  return `hace ${Math.round(days / 365)}y`;
}
