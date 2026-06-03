"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { Product } from "@/types/product";
import type { Purchase } from "@/types/purchase";
import { BrandTag, Icon } from "@/components/primitives";
import { formatCurrency } from "@/lib/format/format-currency";
import { formatDate } from "@/lib/format/format-date";

export interface PurchasesPreviewProps {
  purchases: readonly Purchase[];
  clientId: string;
  /** Prefijo de ruta para deep-links. Default `/ba/clients`. */
  basePath?: string;
  /** SKU → Product. Se usa para mostrar la foto del primer item del ticket. */
  productBySku?: Record<string, Product>;
}

/**
 * Inline preview shown inside the client-profile "Compras" tab.
 * Agrupada por día (mismo patrón que el tab Muestras) para que sesiones
 * múltiples del mismo día queden visualmente juntas. Cada fila linkea
 * al detalle. El histórico con filtros vive en /…/clients/[id]/purchases.
 */
const PREVIEW_COUNT = 5;

export function PurchasesPreview({
  purchases,
  clientId,
  basePath = "/ba/clients",
  productBySku,
}: PurchasesPreviewProps) {
  const t = useTranslations();
  // Solo las últimas 5 — antes el tab crecía sin límite y se volvía
  // inmanejable en clientes con mucha historia. El "Ver todo" del header
  // expone el historial completo con filtros y KPIs.
  const recent = useMemo(
    () => [...purchases].sort((a, b) => b.at.localeCompare(a.at)).slice(0, PREVIEW_COUNT),
    [purchases],
  );
  const groups = useMemo(() => groupByDay(recent), [recent]);

  if (purchases.length === 0) {
    return (
      <p className="m-0 text-[16px] font-medium leading-normal text-ink/60">
        {t("profile.empty.purchases")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            Historial de compras
          </div>
          <p className="m-0 mt-1 text-[14.5px] text-ink/60 leading-snug">
            Tickets registrados con SKUs, monto y BA responsable.
          </p>
        </div>
        <Link
          href={`${basePath}/${clientId}/purchases`}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-line bg-white text-[14px] font-semibold text-ink no-underline transition-colors hover:bg-bone"
        >
          Ver todo
          <Icon name="arrow-right" size={13} />
        </Link>
      </header>

      <div className="flex flex-col gap-4">
        {groups.map((group) => {
          const dayTotal = group.purchases.reduce((acc, p) => acc + p.total, 0);
          return (
            <section
              key={group.day}
              className="border border-line rounded-lg bg-white overflow-hidden"
            >
              <header className="flex items-center justify-between gap-3 px-4 py-2.5 bg-bone/60 border-b border-line">
                <span className="text-[13.5px] font-semibold tracking-[0.06em] uppercase text-ink/70">
                  {formatDate(group.day)}
                </span>
                <span className="text-[12.5px] font-medium text-ink/55 tabular">
                  {group.purchases.length}{" "}
                  {group.purchases.length === 1 ? "ticket" : "tickets"} ·{" "}
                  {formatCurrency(dayTotal)}
                </span>
              </header>
              <ul className="list-none m-0 p-0 flex flex-col">
                {group.purchases.map((p) => {
                  const ticketLabel = p.ticketRef ?? `MAN-${p.id.toUpperCase().slice(-8)}`;
                  const firstImage = productBySku
                    ? p.items.find((i) => productBySku[i.sku]?.image)?.sku
                    : undefined;
                  const thumb = firstImage ? productBySku?.[firstImage]?.image : undefined;
                  return (
                    <li key={p.id} className="border-b border-line last:border-b-0">
                      <Link
                        href={`${basePath}/${clientId}/purchases/${p.id}`}
                        className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-3.5 py-3 px-4 text-ink no-underline transition-colors hover:bg-bone/40"
                      >
                        {thumb ? (
                          <span
                            aria-hidden
                            className="inline-block w-14 h-14 rounded-md bg-bone overflow-hidden"
                          >
                            <img
                              src={thumb}
                              alt=""
                              loading="lazy"
                              className="w-full h-full object-contain p-1.5"
                            />
                          </span>
                        ) : (
                          <span
                            aria-hidden
                            className="inline-flex w-14 h-14 items-center justify-center rounded-md bg-bone text-ink/60"
                          >
                            <Icon name="bag" size={18} />
                          </span>
                        )}
                        <div className="min-w-0 flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[15px] font-semibold leading-tight">
                              Ticket {ticketLabel}
                            </span>
                            {p.brand ? <BrandTag brand={p.brand} alwaysShow /> : null}
                          </div>
                          <span className="text-[13.5px] text-ink/60 leading-tight">
                            {p.items.length}{" "}
                            {p.items.length === 1 ? "producto" : "productos"}
                          </span>
                        </div>
                        <span className="text-[16px] font-semibold tabular text-ink whitespace-nowrap">
                          {formatCurrency(p.total)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

interface DayGroup {
  /** YYYY-MM-DD — key del agrupamiento, anclado a la fecha del ticket. */
  day: string;
  purchases: readonly Purchase[];
}

function groupByDay(purchases: readonly Purchase[]): DayGroup[] {
  const byDay = new Map<string, Purchase[]>();
  for (const p of purchases) {
    const day = p.at.slice(0, 10);
    const bucket = byDay.get(day);
    if (bucket) bucket.push(p);
    else byDay.set(day, [p]);
  }
  return [...byDay.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([day, group]) => ({ day, purchases: group }));
}
