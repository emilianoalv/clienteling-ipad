"use client";

import Link from "next/link";
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

const PREVIEW_COUNT = 4;

/**
 * Inline preview shown inside the client-profile "Compras" tab.
 * Each row is a clickable link to the purchase detail page. The full history
 * lives at `/ba/clients/[id]/purchases`.
 */
export function PurchasesPreview({
  purchases,
  clientId,
  basePath = "/ba/clients",
  productBySku,
}: PurchasesPreviewProps) {
  const t = useTranslations();
  if (purchases.length === 0) {
    return (
      <p className="m-0 text-[16px] font-medium leading-normal text-ink/60">
        {t("profile.empty.purchases")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
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

      <ul className="list-none m-0 p-0 flex flex-col">
        {purchases.slice(0, PREVIEW_COUNT).map((p) => {
          const ticketLabel = p.ticketRef ?? `MAN-${p.id.toUpperCase().slice(-8)}`;
          const ba = "Valentina Ríos";
          // Foto del primer item del ticket que tenga imagen. Caemos al
          // icono de bag genérico cuando no hay match — productos manuales
          // o SKUs descontinuados.
          const firstImage = productBySku
            ? p.items.find((i) => productBySku[i.sku]?.image)?.sku
            : undefined;
          const thumb = firstImage ? productBySku?.[firstImage]?.image : undefined;
          return (
            <li key={p.id} className="border-b border-line last:border-b-0">
              <Link
                href={`${basePath}/${clientId}/purchases/${p.id}`}
                className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3.5 py-3.5 px-1 text-ink no-underline transition-colors hover:bg-bone/60 rounded-md"
              >
                {thumb ? (
                  <span
                    aria-hidden
                    className="inline-block w-10 h-10 rounded-md bg-bone overflow-hidden"
                  >
                    <img
                      src={thumb}
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className="inline-flex w-10 h-10 items-center justify-center rounded-md bg-bone text-ink/60"
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
                  <span className="text-[14px] text-ink/60 leading-tight">
                    {formatDate(p.at)} · {p.items.length}{" "}
                    {p.items.length === 1 ? "producto" : "productos"} · por {ba}
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
    </div>
  );
}
