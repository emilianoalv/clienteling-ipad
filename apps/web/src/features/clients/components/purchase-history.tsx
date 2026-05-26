"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product } from "@/types/product";
import type { Purchase } from "@/types/purchase";
import { Avatar, BrandTag, Icon } from "@/components/primitives";
import { formatCurrency } from "@/lib/format/format-currency";
import { formatDate } from "@/lib/format/format-date";

export type RangeFilter = "3m" | "6m" | "12m" | "all";

const FILTERS: ReadonlyArray<{ id: RangeFilter; label: string; months: number | null }> = [
  { id: "3m", label: "3 meses", months: 3 },
  { id: "6m", label: "6 meses", months: 6 },
  { id: "12m", label: "12 meses", months: 12 },
  { id: "all", label: "Todo", months: null },
];

const TONE_BY_BRAND = {
  Lancôme: "lancome",
  YSL: "ysl",
} as const;

function avatarTone(brand: string | undefined): "default" | "lancome" | "ysl" {
  if (!brand) return "default";
  return (TONE_BY_BRAND as Record<string, "lancome" | "ysl">)[brand] ?? "default";
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(d);
}

export interface PurchaseHistoryProps {
  clientId: string;
  clientName: string;
  baName: string;
  purchases: readonly Purchase[];
  /** SKU → Product map for displaying item details inline. */
  productBySku: Record<string, Product>;
  /** Prefijo para el link de cada fila al detalle. Default `/ba/clients`. */
  basePath?: string;
}

export function PurchaseHistory({
  clientId,
  clientName,
  baName,
  purchases,
  productBySku,
  basePath = "/ba/clients",
}: PurchaseHistoryProps) {
  const [range, setRange] = useState<RangeFilter>("12m");

  const filtered = useMemo(() => {
    const config = FILTERS.find((f) => f.id === range)!;
    if (config.months === null) return purchases;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - config.months);
    return purchases.filter((p) => new Date(p.at).getTime() >= cutoff.getTime());
  }, [purchases, range]);

  const totalSpent = filtered.reduce((acc, p) => acc + p.total, 0);
  const avgTicket = filtered.length === 0 ? 0 : totalSpent / filtered.length;
  const totalUnits = filtered.reduce(
    (acc, p) => acc + p.items.reduce((a, i) => a + i.qty, 0),
    0,
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <header className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            {clientName}
          </div>
          <h2 className="m-0 mt-1 font-display text-[32px] leading-tight tracking-[-0.01em]">
            Historial de compras
          </h2>
          <p className="m-0 mt-1.5 text-[15px] text-ink/60 leading-snug">
            Cada transacción con desglose por SKU, pago y BA. Útil para reposiciones, reclamos y
            aniversarios.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center h-8 px-3 rounded-full border border-line text-[14px] font-medium text-ink/70">
            {filtered.length} {filtered.length === 1 ? "compra" : "compras"}
          </span>
          <span className="inline-flex items-center h-8 px-3 rounded-full border border-line text-[14px] font-medium text-ink/70">
            {totalUnits} unidades
          </span>
        </div>
      </header>

      {/* Filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const active = f.id === range;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setRange(f.id)}
              aria-pressed={active}
              className={`inline-flex items-center h-9 px-4 rounded-full border text-[14px] font-semibold cursor-pointer transition-colors ${
                active
                  ? "bg-ink text-paper border-ink"
                  : "bg-white text-ink border-line hover:bg-bone"
              }`}
            >
              {f.label}
            </button>
          );
        })}
        <div className="flex-1" />
        <button
          type="button"
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-line bg-white text-[14px] font-semibold text-ink hover:bg-bone cursor-pointer"
          aria-label="Exportar a PDF"
        >
          <Icon name="pdf" size={14} />
          Exportar PDF
        </button>
      </div>

      {/* KPI cards (only 2: Total + Ticket promedio) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KpiCard label="Total comprado" value={formatCurrency(totalSpent)} />
        <KpiCard label="Ticket promedio" value={formatCurrency(avgTicket)} />
      </div>

      {/* Purchase list */}
      {filtered.length === 0 ? (
        <article className="bg-white border border-line rounded-xl p-10 text-center">
          <p className="m-0 text-[15px] text-ink/60">
            No hay compras en este rango.
          </p>
        </article>
      ) : (
        <article className="bg-white border border-line rounded-xl divide-y divide-line">
          {filtered.map((p) => (
            <PurchaseRow
              key={p.id}
              purchase={p}
              clientId={clientId}
              baName={baName}
              productBySku={productBySku}
              basePath={basePath}
            />
          ))}
        </article>
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-line rounded-xl px-5 py-4">
      <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        {label}
      </div>
      <div className="font-display text-[32px] mt-1.5 leading-none tabular">{value}</div>
    </div>
  );
}

interface PurchaseRowProps {
  purchase: Purchase;
  clientId: string;
  baName: string;
  productBySku: Record<string, Product>;
  basePath: string;
}

function PurchaseRow({ purchase, clientId, baName, productBySku, basePath }: PurchaseRowProps) {
  const ticketLabel = purchase.ticketRef ?? `MAN-${purchase.id.toUpperCase().slice(-8)}`;
  const paymentLabel: Record<Purchase["payment"], string> = {
    card: "Tarjeta",
    cash: "Efectivo",
    transfer: "Transferencia",
    "store-credit": "Crédito tienda",
  };

  return (
    <Link
      href={`${basePath}/${clientId}/purchases/${purchase.id}`}
      className="block p-5 text-ink no-underline transition-colors hover:bg-bone/40"
    >
      {/* Header row */}
      <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-3.5 items-center">
        <span
          aria-hidden
          className="inline-flex w-10 h-10 items-center justify-center rounded-md bg-bone text-ink/60"
        >
          <Icon name="bag" size={18} />
        </span>
        <div className="min-w-0 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-[24px] leading-none tabular">
            {formatCurrency(purchase.total)}
          </span>
          {purchase.brand ? <BrandTag brand={purchase.brand} alwaysShow /> : null}
          <span className="text-[13.5px] text-ink/60">Ticket {ticketLabel}</span>
          <span className="w-full text-[14px] text-ink/60 mt-0.5">
            {formatDate(purchase.at)} · {formatTime(purchase.at)} · {baName} ·{" "}
            {paymentLabel[purchase.payment]}
            {purchase.paymentDetail ? ` · ${purchase.paymentDetail}` : ""}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
        {purchase.items.map((item, idx) => {
          const product = productBySku[item.sku];
          const initial = (product?.line ?? item.sku)[0]?.toUpperCase() ?? "•";
          return (
            <div
              key={`${item.sku}-${idx}`}
              className="flex items-center gap-3 bg-bone/60 rounded-md p-2.5"
            >
              <Avatar initials={initial} size={36} tone={avatarTone(product?.brand)} />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold leading-tight truncate">
                  {product?.line ?? item.sku}
                </div>
                <div className="text-[13.5px] text-ink/60 leading-tight mt-0.5 truncate">
                  {product?.name ?? "—"} · {item.qty} ud.
                </div>
              </div>
              <span className="text-[15px] font-semibold tabular whitespace-nowrap">
                {formatCurrency(item.qty * item.unitPrice)}
              </span>
            </div>
          );
        })}
      </div>
    </Link>
  );
}
