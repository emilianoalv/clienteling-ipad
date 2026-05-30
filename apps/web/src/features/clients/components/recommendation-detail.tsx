"use client";

import Link from "next/link";
import { useState } from "react";
import type { Client } from "@/types/client";
import type { Product, Sku } from "@/types/product";
import type { ProductTech } from "@/types/product-tech";
import type { Recommendation } from "@/types/recommendation";
import { Avatar, BrandTag, Button, Chip, Icon } from "@/components/primitives";
import { Card } from "@/components/patterns";
import { FichaTecnicaModal } from "@/features/catalog/components/ficha-tecnica-modal";
import { formatCurrency } from "@/lib/format/format-currency";
import { formatDate, formatTime } from "@/lib/format/format-date";

const TONE_BY_BRAND = {
  Lancôme: "lancome",
  YSL: "ysl",
} as const;

function avatarTone(brand: string | undefined): "default" | "lancome" | "ysl" {
  if (!brand) return "default";
  return (TONE_BY_BRAND as Record<string, "lancome" | "ysl">)[brand] ?? "default";
}

export interface RecommendationDetailProps {
  client: Client;
  recommendation: Recommendation;
  baName: string;
  storeName: string;
  productBySku: Record<string, Product>;
  techs: ReadonlyMap<Sku, ProductTech>;
  /** Prefijo para el link "Ver ticket asociado". Default `/ba/clients`. */
  basePath?: string;
}

export function RecommendationDetail({
  client,
  recommendation,
  baName,
  storeName,
  productBySku,
  techs,
  basePath = "/ba/clients",
}: RecommendationDetailProps) {
  const [techSku, setTechSku] = useState<Sku | null>(null);

  // productBySku ya es Record — lo pasamos directo al modal sin convertir
  // a Map (que rompe el boundary RSC).
  const productLookup = productBySku;
  const techProduct = techSku ? productBySku[techSku as unknown as string] ?? null : null;
  const techData = techSku ? techs.get(techSku) ?? null : null;

  // Suma del precio de catálogo cuando todos los productos son del catálogo
  // actual. Si alguno no está, omitimos el total para no engañar.
  const allHavePrice = recommendation.items.every(
    (sku) => productBySku[sku as unknown as string]?.price != null,
  );
  const totalCatalog = allHavePrice
    ? recommendation.items.reduce(
        (acc, sku) => acc + (productBySku[sku as unknown as string]?.price ?? 0),
        0,
      )
    : null;

  return (
    <div className="flex flex-col gap-4">
      <Card variant="luxe" className="flex flex-col gap-6 p-7">
        {/* Hero */}
        <header className="flex items-start gap-5 justify-between flex-wrap">
          <div className="flex items-center gap-5">
            <span
              aria-hidden
              className="inline-flex w-20 h-20 items-center justify-center rounded-full bg-bone text-ink shrink-0"
            >
              <Icon name="sparkle" size={32} />
            </span>
            <div>
              <div className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/55">
                {client.name}
              </div>
              <h2 className="m-0 mt-1.5 font-display text-[40px] leading-[1.05] tracking-[-0.01em]">
                Recomendación
              </h2>
              <p className="m-0 mt-2 text-[17px] text-ink/70 leading-snug flex items-center gap-2 flex-wrap">
                <Icon name="calendar" size={14} />
                <span className="font-semibold text-ink">{formatDate(recommendation.at)}</span>
                <span aria-hidden className="text-ink/30">·</span>
                <span>{formatTime(recommendation.at)}</span>
                <span aria-hidden className="text-ink/30">·</span>
                <span>
                  por <strong className="text-ink">{baName}</strong>
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <BrandTag brand={recommendation.brand} alwaysShow />
            <RecStatusChip status={recommendation.status} />
          </div>
        </header>

        {/* Resumen */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 border-t border-line pt-5">
          <BigField label="Tienda" value={storeName} icon="home" />
          <BigField
            label="Productos"
            value={`${recommendation.items.length}`}
            icon="bag"
          />
          {totalCatalog != null ? (
            <BigField label="Total catálogo" value={formatCurrency(totalCatalog)} icon="star" />
          ) : null}
          <BigField label="Marca" value={recommendation.brand} icon="user" />
        </section>

        {/* Ticket asociado (cuando converted) */}
        {recommendation.purchaseId ? (
          <section className="border-t border-line pt-5">
            <Link
              href={`${basePath}/${client.id}/purchases/${recommendation.purchaseId}`}
              className="flex items-center gap-3 px-5 py-4 rounded-xl bg-ok/[0.08] border border-ok/25 text-ink no-underline transition-colors hover:bg-ok/[0.12]"
            >
              <span
                aria-hidden
                className="inline-flex w-10 h-10 items-center justify-center rounded-md bg-ok/15 text-ok shrink-0"
              >
                <Icon name="check" size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold tracking-[0.08em] uppercase text-ok">
                  Recomendación comprada
                </div>
                <p className="m-0 mt-0.5 text-[15.5px] leading-snug">
                  Esta recomendación se convirtió en una venta — ver ticket asociado.
                </p>
              </div>
              <Icon name="arrow-right" size={16} />
            </Link>
          </section>
        ) : null}

        {/* Productos recomendados */}
        <section className="border-t border-line pt-5">
          <div className="text-[14px] font-semibold tracking-[0.12em] uppercase text-ink/55 mb-3">
            Productos recomendados
          </div>
          <ul className="list-none m-0 p-0 flex flex-col gap-3">
            {recommendation.items.map((sku, idx) => {
              const product = productBySku[sku as unknown as string];
              const hasTech = techs.has(sku);
              const initial = (product?.line ?? sku)[0]?.toUpperCase() ?? "•";
              return (
                <li
                  key={`${sku}-${idx}`}
                  className="grid grid-cols-[56px_minmax(0,1fr)_auto] gap-4 items-center bg-bone/50 border border-line rounded-xl p-4"
                >
                  {product?.image ? (
                    <span
                      aria-hidden
                      className="inline-block w-[52px] h-[52px] rounded-md bg-white overflow-hidden flex items-center justify-center"
                    >
                      <img
                        src={product.image}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-contain p-1"
                      />
                    </span>
                  ) : (
                    <Avatar initials={initial} size={52} tone={avatarTone(product?.brand)} />
                  )}
                  <div className="min-w-0 flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[18px] font-semibold leading-tight">
                        {product?.line ?? sku}
                      </span>
                      {product?.brand ? <BrandTag brand={product.brand} alwaysShow /> : null}
                    </div>
                    <span className="text-[15px] text-ink/65 leading-tight">
                      {product?.name ?? "Producto fuera de catálogo"}
                      {product?.size ? ` · ${product.size}` : ""}
                    </span>
                    <span className="text-[12.5px] text-ink/45 tabular tracking-[0.04em] mt-0.5">
                      SKU {sku}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {product?.price != null ? (
                      <span className="font-display text-[22px] leading-none tabular">
                        {formatCurrency(product.price)}
                      </span>
                    ) : null}
                    {hasTech ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTechSku(sku)}
                        leading={<Icon name="pdf" size={13} />}
                      >
                        Ver ficha
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </Card>

      {techProduct ? (
        <FichaTecnicaModal
          open={techSku != null}
          product={techProduct}
          tech={techData}
          productLookup={productLookup}
          onClose={() => setTechSku(null)}
        />
      ) : null}
    </div>
  );
}

function BigField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: "user" | "home" | "calendar" | "star" | "bag";
}) {
  return (
    <div className="flex items-start gap-3">
      {icon ? (
        <span
          aria-hidden
          className="inline-flex w-9 h-9 items-center justify-center rounded-md bg-bone text-ink/60 shrink-0 mt-0.5"
        >
          <Icon name={icon} size={16} />
        </span>
      ) : null}
      <div className="min-w-0 flex flex-col gap-0.5">
        <span className="text-[13px] font-semibold tracking-[0.08em] uppercase text-ink/55">
          {label}
        </span>
        <span className="text-[17px] font-semibold leading-tight">{value}</span>
      </div>
    </div>
  );
}

function RecStatusChip({ status }: { status: Recommendation["status"] }) {
  if (status === "converted") {
    return (
      <Chip variant="ok" size="md">
        Comprada
      </Chip>
    );
  }
  if (status === "dismissed") {
    return (
      <Chip variant="danger" size="md">
        Descartada
      </Chip>
    );
  }
  return (
    <Chip variant="warn" size="md">
      Pendiente de compra
    </Chip>
  );
}
