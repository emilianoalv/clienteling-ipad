"use client";

import Link from "next/link";
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

const PREVIEW_COUNT = 4;

/**
 * Inline preview shown inside the client-profile "Recomendaciones" tab.
 * Each row is a clickable link to the recommendation detail page. The full
 * history lives at `/ba/clients/[id]/recommendations`.
 */
export function RecsPreview({
  recommendations,
  clientId,
  productBySku,
  basePath = "/ba/clients",
}: RecsPreviewProps) {
  const t = useTranslations();
  if (recommendations.length === 0) {
    return (
      <p className="m-0 text-[16px] font-medium leading-normal text-ink/60">
        {t("profile.empty.recs")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
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

      <ul className="list-none m-0 p-0 flex flex-col">
        {recommendations.slice(0, PREVIEW_COUNT).map((r) => {
          // Foto del primer SKU recomendado que tenga imagen. Fallback al
          // ícono sparkle (heredado) cuando ningún SKU tiene foto.
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
              className="grid grid-cols-[40px_minmax(0,1fr)_auto_auto] items-start gap-3.5 py-3.5 px-1 text-ink no-underline transition-colors hover:bg-bone/60 rounded-md"
            >
              {thumb ? (
                <span
                  aria-hidden
                  className="inline-block w-10 h-10 rounded-md bg-bone overflow-hidden mt-0.5"
                >
                  <img
                    src={thumb}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-contain p-1"
                  />
                </span>
              ) : (
                <span
                  aria-hidden
                  className="inline-flex w-10 h-10 items-center justify-center rounded-md bg-bone text-ink/60 mt-0.5"
                >
                  <Icon name="sparkle" size={18} />
                </span>
              )}
              <div className="min-w-0 flex flex-col gap-1.5">
                <RecItemList items={r.items} productBySku={productBySku} />
                <span className="text-[12.5px] text-ink/50 tabular tracking-[0.04em]">
                  {r.items.length} {r.items.length === 1 ? "producto" : "productos"} ·{" "}
                  {r.items.join(" · ")}
                </span>
              </div>
              <RecStatusChip status={r.status} />
              <span className="text-[13.5px] text-ink/60 leading-none whitespace-nowrap mt-1">
                {formatDate(r.at)}
              </span>
            </Link>
          </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Renderiza los nombres reales de los productos recomendados:
 * - 1 producto: "Hydra Zen · Gel Cream"
 * - 2 productos: "Hydra Zen, Génifique" (apilados en una sola línea con bullets)
 * - 3+: lista vertical compacta con bullets
 */
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

  // 2+ productos: lista vertical compacta con bullets — limpio y escaneable.
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
