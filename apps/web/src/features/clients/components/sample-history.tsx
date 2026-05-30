"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product } from "@/types/product";
import type { Sample } from "@/types/sample";
import { Avatar, BrandTag, Chip, Icon } from "@/components/primitives";
import { formatDate } from "@/lib/format/format-date";

export type RangeFilter = "3m" | "6m" | "12m" | "all";
export type StatusFilter = "all" | "converted" | "pending";

const RANGES: ReadonlyArray<{ id: RangeFilter; label: string; months: number | null }> = [
  { id: "3m", label: "3 meses", months: 3 },
  { id: "6m", label: "6 meses", months: 6 },
  { id: "12m", label: "12 meses", months: 12 },
  { id: "all", label: "Todo", months: null },
];

const STATUSES: ReadonlyArray<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "Todas" },
  { id: "pending", label: "Pendientes de feedback" },
  { id: "converted", label: "Convertidas" },
];

const TONE_BY_BRAND = {
  Lancôme: "lancome",
  YSL: "ysl",
} as const;

function avatarTone(brand: string | undefined): "default" | "lancome" | "ysl" {
  if (!brand) return "default";
  return (TONE_BY_BRAND as Record<string, "lancome" | "ysl">)[brand] ?? "default";
}

function daysBetween(fromIso: string, toIso?: string): number {
  const from = new Date(fromIso).getTime();
  const to = toIso ? new Date(toIso).getTime() : Date.now();
  return Math.round((to - from) / 86_400_000);
}

export interface SampleHistoryProps {
  clientId: string;
  clientName: string;
  samples: readonly Sample[];
  /** Map from sample SKU to its full product, when the sample maps to a catalog item. */
  productBySampleSku: Record<string, Product>;
  /** Prefijo para el link de cada fila al detalle. Default `/ba/clients`. */
  basePath?: string;
}

export function SampleHistory({
  clientId,
  clientName,
  samples,
  productBySampleSku,
  basePath = "/ba/clients",
}: SampleHistoryProps) {
  const [range, setRange] = useState<RangeFilter>("12m");
  const [status, setStatus] = useState<StatusFilter>("all");

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
    return samples.filter((s) => {
      if (status === "converted" && !s.converted) return false;
      if (status === "pending" && s.converted) return false;
      if (cutoff != null && new Date(s.givenAt).getTime() < cutoff) return false;
      return true;
    });
  }, [samples, range, status]);

  const total = filtered.length;
  const converted = filtered.filter((s) => s.converted).length;
  const conversionRate = total === 0 ? 0 : Math.round((converted / total) * 100);

  // Avg days to convert (only for samples that converted).
  // We don't have the purchase date here, so use givenAt → now as proxy for pending
  // and best-effort heuristic. For accuracy this would need purchase joining.
  const avgDaysPending = (() => {
    const pending = filtered.filter((s) => !s.converted);
    if (pending.length === 0) return null;
    const total = pending.reduce((acc, s) => acc + daysBetween(s.givenAt), 0);
    return Math.round(total / pending.length);
  })();

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <span
            aria-hidden
            className="inline-flex w-12 h-12 items-center justify-center rounded-full bg-bone text-ink shrink-0 mt-1"
          >
            <Icon name="gift" size={22} />
          </span>
          <div>
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              {clientName} · prueba en casa
            </div>
            <h2 className="m-0 mt-1 font-display text-[32px] leading-tight tracking-[-0.01em]">
              Muestras entregadas
            </h2>
            <p className="m-0 mt-1.5 text-[15px] text-ink/60 leading-snug max-w-[640px]">
              Minis físicas que el cliente se llevó. Pasan a{" "}
              <strong className="text-ink">Convertida</strong> cuando el frasco completo aparece en
              un ticket posterior.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center h-8 px-3 rounded-full border border-line text-[14px] font-medium text-ink/70">
            {total} {total === 1 ? "muestra" : "muestras"}
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
        <KpiCard label="Total" value={String(total)} accent="gift" />
        <KpiCard
          label="Conversión post-prueba"
          value={`${conversionRate}%`}
          subtitle={`${converted} terminaron en venta del frasco completo`}
          accent="gift"
        />
        <KpiCard
          label="Días promedio sin feedback"
          value={avgDaysPending == null ? "—" : `${avgDaysPending}d`}
          subtitle="entre entrega y hoy en pendientes"
        />
      </div>

      {filtered.length === 0 ? (
        <article className="bg-white border border-line rounded-xl p-10 text-center flex flex-col items-center gap-2">
          <span
            aria-hidden
            className="inline-flex w-12 h-12 items-center justify-center rounded-full bg-bone text-ink/55"
          >
            <Icon name="gift" size={22} />
          </span>
          <p className="m-0 text-[15.5px] font-semibold">Sin muestras entregadas</p>
          <p className="m-0 text-[14px] text-ink/55 max-w-[420px]">
            Empieza a samplear desde el wizard de Registrar visita para impulsar la conversión post-
            prueba — es la palanca más fuerte en skincare premium.
          </p>
        </article>
      ) : (
        <article className="bg-white border border-line rounded-xl divide-y divide-line">
          {filtered.map((s) => (
            <SampleRow
              key={s.id}
              sample={s}
              clientId={clientId}
              productBySampleSku={productBySampleSku}
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
  accent,
}: {
  label: string;
  value: string;
  subtitle?: string;
  accent?: "gift";
}) {
  return (
    <div className="bg-white border border-line rounded-xl px-5 py-4">
      <div className="flex items-center gap-2">
        <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          {label}
        </span>
        {accent === "gift" ? <Icon name="gift" size={12} /> : null}
      </div>
      <div className="font-display text-[32px] mt-1.5 leading-none tabular">{value}</div>
      {subtitle ? (
        <p className="m-0 mt-1 text-[13.5px] text-ink/55 leading-snug">{subtitle}</p>
      ) : null}
    </div>
  );
}

/**
 * Cuenta regresiva visual al feedback ideal (14 días desde entrega).
 * - 0-7 días: discreta (info gris)
 * - 7-14 días: amarilla (acercándose)
 * - 14+ días: roja (vencido, hay que actuar)
 */
function FeedbackCountdown({ days, converted }: { days: number; converted: boolean }) {
  if (converted) return null;
  const TARGET = 14;
  const left = TARGET - days;
  if (left > 7) {
    return (
      <span className="text-[12.5px] text-ink/50">
        Feedback ideal en {left} {left === 1 ? "día" : "días"}
      </span>
    );
  }
  if (left > 0) {
    return (
      <span className="text-[12.5px] font-semibold text-warn">
        Feedback en {left} {left === 1 ? "día" : "días"}
      </span>
    );
  }
  return (
    <span className="text-[12.5px] font-semibold text-err">
      Feedback vencido hace {Math.abs(left)} {Math.abs(left) === 1 ? "día" : "días"}
    </span>
  );
}

function SampleRow({
  sample,
  clientId,
  productBySampleSku,
  basePath,
}: {
  sample: Sample;
  clientId: string;
  productBySampleSku: Record<string, Product>;
  basePath: string;
}) {
  const fullProduct = productBySampleSku[sample.sku as unknown as string];
  const days = daysBetween(sample.givenAt);
  const initial = (sample.name ?? sample.sku)[0]?.toUpperCase() ?? "•";

  return (
    <Link
      href={`${basePath}/${clientId}/samples/${sample.id}`}
      className="block p-5 text-ink no-underline transition-colors hover:bg-bone/40"
    >
      <div className="grid grid-cols-[44px_minmax(0,1fr)_auto] gap-3.5 items-center">
        {fullProduct?.image ? (
          <span
            aria-hidden
            className="inline-block w-10 h-10 rounded-md bg-bone overflow-hidden flex items-center justify-center"
          >
            <img
              src={fullProduct.image}
              alt=""
              loading="lazy"
              className="w-full h-full object-contain p-1"
            />
          </span>
        ) : (
          <Avatar initials={initial} size={40} tone={avatarTone(sample.brand)} />
        )}
        <div className="min-w-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-[20px] leading-none">{sample.name}</span>
          <BrandTag brand={sample.brand} alwaysShow />
          {fullProduct ? (
            <span className="text-[13.5px] text-ink/60">
              · representa <strong className="text-ink/70">{fullProduct.line}</strong>{" "}
              {fullProduct.size}
            </span>
          ) : null}
          <span className="w-full text-[14px] text-ink/60 mt-0.5 flex items-center gap-2 flex-wrap">
            <span>
              Entregada {formatDate(sample.givenAt)} · hace {days} {days === 1 ? "día" : "días"}
            </span>
            <span aria-hidden className="text-ink/30">·</span>
            <FeedbackCountdown days={days} converted={sample.converted} />
          </span>
        </div>
        {sample.converted ? (
          <Chip variant="ok" size="sm" leading={<Icon name="bag" size={11} />}>
            Convertida en venta
          </Chip>
        ) : (
          <Chip variant="warn" size="sm">
            Pendiente de feedback
          </Chip>
        )}
      </div>
    </Link>
  );
}
