"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product } from "@/types/product";
import type { Recommendation, RecommendationStatus } from "@/types/recommendation";
import { Avatar, BrandTag, Chip, Icon } from "@/components/primitives";
import { formatDate } from "@/lib/format/format-date";

function daysBetween(fromIso: string, toIso?: string): number {
  const from = new Date(fromIso).getTime();
  const to = toIso ? new Date(toIso).getTime() : Date.now();
  return Math.round((to - from) / 86_400_000);
}

export type RangeFilter = "3m" | "6m" | "12m" | "all";
export type StatusFilter = "all" | RecommendationStatus;

const RANGES: ReadonlyArray<{ id: RangeFilter; label: string; months: number | null }> = [
  { id: "3m", label: "3 meses", months: 3 },
  { id: "6m", label: "6 meses", months: 6 },
  { id: "12m", label: "12 meses", months: 12 },
  { id: "all", label: "Todo", months: null },
];

const STATUSES: ReadonlyArray<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "Todas" },
  { id: "pending", label: "Pendientes de compra" },
  { id: "converted", label: "Compradas" },
  { id: "dismissed", label: "Descartadas" },
];

const TONE_BY_BRAND = {
  Lancôme: "lancome",
  YSL: "ysl",
} as const;

function avatarTone(brand: string | undefined): "default" | "lancome" | "ysl" {
  if (!brand) return "default";
  return (TONE_BY_BRAND as Record<string, "lancome" | "ysl">)[brand] ?? "default";
}

export interface RecommendationHistoryProps {
  clientId: string;
  clientName: string;
  recommendations: readonly Recommendation[];
  productBySku: Record<string, Product>;
}

export function RecommendationHistory({
  clientId,
  clientName,
  recommendations,
  productBySku,
}: RecommendationHistoryProps) {
  const [range, setRange] = useState<RangeFilter>("12m");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const cfg = RANGES.find((r) => r.id === range)!;
    const cutoff =
      cfg.months == null ? null : (() => {
        const d = new Date();
        d.setMonth(d.getMonth() - cfg.months);
        return d.getTime();
      })();
    return recommendations.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (cutoff != null && new Date(r.at).getTime() < cutoff) return false;
      return true;
    });
  }, [recommendations, range, status]);

  const total = filtered.length;
  const converted = filtered.filter((r) => r.status === "converted").length;
  // Closing rate verbal: % de recomendaciones que terminaron en venta vs todas
  // las hechas. Esta es la métrica de persuasión en piso.
  const closingRate = total === 0 ? 0 : Math.round((converted / total) * 100);
  const avgItems =
    total === 0
      ? 0
      : Math.round((filtered.reduce((acc, r) => acc + r.items.length, 0) / total) * 10) / 10;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <span
            aria-hidden
            className="inline-flex w-12 h-12 items-center justify-center rounded-full bg-bone text-ink shrink-0 mt-1"
          >
            <Icon name="sparkle" size={22} />
          </span>
          <div>
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              {clientName} · venta verbal
            </div>
            <h2 className="m-0 mt-1 font-display text-[32px] leading-tight tracking-[-0.01em]">
              Recomendaciones
            </h2>
            <p className="m-0 mt-1.5 text-[15px] text-ink/60 leading-snug max-w-[640px]">
              Productos que sugeriste verbalmente. Una recomendación pasa a{" "}
              <strong className="text-ink">Comprada</strong> cuando aparece un ticket con uno de los
              SKUs sugeridos.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center h-8 px-3 rounded-full border border-line text-[14px] font-medium text-ink/70">
            {total} {total === 1 ? "recomendación" : "recomendaciones"}
          </span>
        </div>
      </header>

      {/* Filter rows */}
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

      {/* KPI cards — venta verbal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Total" value={String(total)} accent="sparkle" />
        <KpiCard
          label="Tasa de cierre verbal"
          value={`${closingRate}%`}
          subtitle={`${converted} de ${total} terminaron en venta`}
          accent="sparkle"
        />
        <KpiCard label="Productos promedio" value={avgItems.toString()} subtitle="sugeridos por sesión" />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <article className="bg-white border border-line rounded-xl p-10 text-center flex flex-col items-center gap-2">
          <span
            aria-hidden
            className="inline-flex w-12 h-12 items-center justify-center rounded-full bg-bone text-ink/55"
          >
            <Icon name="sparkle" size={22} />
          </span>
          <p className="m-0 text-[15.5px] font-semibold">Aún no hay recomendaciones</p>
          <p className="m-0 text-[14px] text-ink/55 max-w-[420px]">
            Sugiere productos a la clienta desde el wizard de Registrar visita para construir tu
            historial de cierre verbal.
          </p>
        </article>
      ) : (
        <article className="bg-white border border-line rounded-xl divide-y divide-line">
          {filtered.map((r) => (
            <RecRow key={r.id} rec={r} clientId={clientId} productBySku={productBySku} />
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
  accent,
}: {
  label: string;
  value: string;
  subtitle?: string;
  accent?: "sparkle";
}) {
  return (
    <div className="bg-white border border-line rounded-xl px-5 py-4">
      <div className="flex items-center gap-2">
        <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          {label}
        </span>
        {accent === "sparkle" ? (
          <Icon name="sparkle" size={12} />
        ) : null}
      </div>
      <div className="font-display text-[32px] mt-1.5 leading-none tabular">{value}</div>
      {subtitle ? (
        <p className="m-0 mt-1 text-[13.5px] text-ink/55 leading-snug">{subtitle}</p>
      ) : null}
    </div>
  );
}

function RecRow({
  rec,
  clientId,
  productBySku,
}: {
  rec: Recommendation;
  clientId: string;
  productBySku: Record<string, Product>;
}) {
  const daysSince = daysBetween(rec.at);
  return (
    <Link
      href={`/ba/clients/${clientId}/recommendations/${rec.id}`}
      className="block p-5 text-ink no-underline transition-colors hover:bg-bone/40"
    >
      <div className="grid grid-cols-[40px_minmax(0,1fr)_auto] gap-3.5 items-start">
        <span
          aria-hidden
          className="inline-flex w-10 h-10 items-center justify-center rounded-md bg-bone text-ink/60"
        >
          <Icon name="sparkle" size={18} />
        </span>
        <div className="min-w-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-[20px] leading-none">
            {rec.items.length} {rec.items.length === 1 ? "producto sugerido" : "productos sugeridos"}
          </span>
          <BrandTag brand={rec.brand} alwaysShow />
          <span className="w-full text-[14px] text-ink/60 mt-0.5">
            {formatDate(rec.at)}
            {rec.status === "pending" && daysSince > 0
              ? ` · hace ${daysSince} ${daysSince === 1 ? "día" : "días"} sin cerrar`
              : null}
          </span>
        </div>
        <RecStatusChip status={rec.status} />
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
        {rec.items.map((sku, idx) => {
          const product = productBySku[sku as unknown as string];
          const initial = (product?.line ?? sku)[0]?.toUpperCase() ?? "•";
          return (
            <div
              key={`${sku}-${idx}`}
              className="flex items-center gap-3 bg-bone/60 rounded-md p-2.5"
            >
              <Avatar initials={initial} size={36} tone={avatarTone(product?.brand)} />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold leading-tight truncate">
                  {product?.line ?? sku}
                </div>
                <div className="text-[13.5px] text-ink/60 leading-tight mt-0.5 truncate">
                  {product?.name ?? "—"}
                  {product?.size ? ` · ${product.size}` : ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Link>
  );
}

function RecStatusChip({ status }: { status: Recommendation["status"] }) {
  if (status === "converted") {
    return (
      <Chip variant="ok" size="sm">
        Comprada
      </Chip>
    );
  }
  if (status === "dismissed") {
    return (
      <Chip variant="danger" size="sm">
        Descartada
      </Chip>
    );
  }
  return (
    <Chip variant="warn" size="sm">
      Pendiente de compra
    </Chip>
  );
}
