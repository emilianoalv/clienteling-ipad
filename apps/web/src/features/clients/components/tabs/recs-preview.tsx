"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { Product } from "@/types/product";
import type { Recommendation } from "@/types/recommendation";
import { Chip, Icon } from "@/components/primitives";
import { formatDate } from "@/lib/format/format-date";

export interface RecsPreviewProps {
  recommendations: readonly Recommendation[];
  clientId: string;
  /** SKU → Product. Used to render real product names instead of raw SKUs. */
  productBySku: Record<string, Product>;
  /** Prefijo de ruta para deep-links. Default `/ba/clients`. */
  basePath?: string;
}

/**
 * Inline preview shown inside the client-profile "Recomendaciones" tab.
 * Agrupada por día (mismo patrón que el tab Muestras) — una sesión puede
 * dejar varias recomendaciones y agrupar por día las muestra juntas.
 * El historial filtrado vive en /…/clients/[id]/recommendations.
 */
export function RecsPreview({
  recommendations,
  clientId,
  productBySku,
  basePath = "/ba/clients",
}: RecsPreviewProps) {
  const t = useTranslations();
  const groups = useMemo(() => groupByDay(recommendations), [recommendations]);

  if (recommendations.length === 0) {
    return (
      <p className="m-0 text-[16px] font-medium leading-normal text-ink/60">
        {t("profile.empty.recs")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            Historial de recomendaciones
          </div>
          <p className="m-0 mt-1 text-[14.5px] text-ink/60 leading-snug">
            Productos sugeridos al cliente y su estado de conversión.
          </p>
        </div>
        <Link
          href={`${basePath}/${clientId}/recommendations`}
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-line bg-white text-[14px] font-semibold text-ink no-underline transition-colors hover:bg-bone"
        >
          Ver todo
          <Icon name="arrow-right" size={13} />
        </Link>
      </header>

      <div className="flex flex-col gap-4">
        {groups.map((group) => (
          <section
            key={group.day}
            className="border border-line rounded-lg bg-white overflow-hidden"
          >
            <header className="flex items-center justify-between gap-3 px-4 py-2.5 bg-bone/60 border-b border-line">
              <span className="text-[13.5px] font-semibold tracking-[0.06em] uppercase text-ink/70">
                {formatDate(group.day)}
              </span>
              <span className="text-[12.5px] font-medium text-ink/55 tabular">
                {group.recs.length}{" "}
                {group.recs.length === 1 ? "recomendación" : "recomendaciones"}
              </span>
            </header>
            <ul className="list-none m-0 p-0 flex flex-col">
              {group.recs.map((r) => {
                const firstWithImage = r.items.find(
                  (sku) => productBySku[sku as unknown as string]?.image,
                );
                const thumb = firstWithImage
                  ? productBySku[firstWithImage as unknown as string]?.image
                  : undefined;
                return (
                  <li key={r.id} className="border-b border-line last:border-b-0">
                    <Link
                      href={`${basePath}/${clientId}/recommendations/${r.id}`}
                      className="grid grid-cols-[56px_minmax(0,1fr)_auto] items-start gap-3.5 py-3 px-4 text-ink no-underline transition-colors hover:bg-bone/40"
                    >
                      {thumb ? (
                        <span
                          aria-hidden
                          className="inline-block w-14 h-14 rounded-md bg-bone overflow-hidden mt-0.5"
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
                          className="inline-flex w-14 h-14 items-center justify-center rounded-md bg-bone text-ink/60 mt-0.5"
                        >
                          <Icon name="sparkle" size={18} />
                        </span>
                      )}
                      <div className="min-w-0 flex flex-col gap-1.5">
                        <RecItemList items={r.items} productBySku={productBySku} />
                        <span className="text-[12.5px] text-ink/50 tabular tracking-[0.04em]">
                          {r.items.length}{" "}
                          {r.items.length === 1 ? "producto" : "productos"} ·{" "}
                          {r.items.join(" · ")}
                        </span>
                      </div>
                      <RecStatusChip status={r.status} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

interface DayGroup {
  day: string;
  recs: readonly Recommendation[];
}

function groupByDay(recs: readonly Recommendation[]): DayGroup[] {
  const byDay = new Map<string, Recommendation[]>();
  for (const r of recs) {
    const day = r.at.slice(0, 10);
    const bucket = byDay.get(day);
    if (bucket) bucket.push(r);
    else byDay.set(day, [r]);
  }
  return [...byDay.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([day, group]) => ({ day, recs: group }));
}

function RecItemList({
  items,
  productBySku,
}: {
  items: readonly string[];
  productBySku: Record<string, Product>;
}) {
  if (items.length === 1) {
    const sku = items[0]!;
    const product = productBySku[sku as unknown as string];
    return (
      <span className="text-[15px] font-semibold leading-tight">
        {product?.line ?? sku}
        {product?.name ? (
          <span className="text-ink/55 font-medium"> · {product.name}</span>
        ) : null}
      </span>
    );
  }

  return (
    <ul className="list-none m-0 p-0 flex flex-col gap-0.5">
      {items.map((sku) => {
        const product = productBySku[sku as unknown as string];
        return (
          <li
            key={sku}
            className="text-[15px] font-semibold leading-snug flex items-baseline gap-2"
          >
            <span aria-hidden className="text-ink/35 text-[12px] mt-0.5">
              ●
            </span>
            <span>
              {product?.line ?? sku}
              {product?.name ? (
                <span className="text-ink/55 font-medium"> · {product.name}</span>
              ) : null}
            </span>
          </li>
        );
      })}
    </ul>
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
