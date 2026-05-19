"use client";

import Link from "next/link";
import { useState } from "react";
import type { Client } from "@/types/client";
import type { Product, Sku } from "@/types/product";
import type { ProductTech } from "@/types/product-tech";
import type { Recommendation } from "@/types/recommendation";
import { Avatar, BrandTag, Button, Chip } from "@/components/primitives";
import { Card, KvRow } from "@/components/patterns";
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
}

export function RecommendationDetail({
  client,
  recommendation,
  baName,
  storeName,
  productBySku,
  techs,
}: RecommendationDetailProps) {
  const [techSku, setTechSku] = useState<Sku | null>(null);

  const productLookup = new Map<string, Product>(
    Object.entries(productBySku).map(([sku, product]) => [sku, product]),
  );
  const techProduct = techSku ? productBySku[techSku as unknown as string] ?? null : null;
  const techData = techSku ? techs.get(techSku) ?? null : null;

  const statusChip = (() => {
    if (recommendation.status === "converted") {
      return (
        <Chip variant="ok" size="md">
          Comprada
        </Chip>
      );
    }
    if (recommendation.status === "dismissed") {
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
  })();

  return (
    <div className="flex flex-col gap-4">
      <Card variant="luxe" className="flex flex-col gap-5">
        <header className="flex items-start gap-4 justify-between flex-wrap">
          <div>
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              {client.name}
            </div>
            <h2 className="m-0 mt-1 font-display text-[32px] leading-tight tracking-[-0.01em]">
              Recomendación
            </h2>
            <p className="m-0 mt-1.5 text-[15px] text-ink/60 leading-snug">
              {formatDate(recommendation.at)} · {formatTime(recommendation.at)} · por{" "}
              <strong className="text-ink">{baName}</strong>
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <BrandTag brand={recommendation.brand} alwaysShow />
            {statusChip}
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 border-t border-line pt-4">
          <KvRow label="Tienda" value={storeName} />
          <KvRow label="Productos" value={`${recommendation.items.length}`} />
          {recommendation.purchaseId ? (
            <KvRow
              label="Ticket asociado"
              value={
                <Link
                  href={`/ba/clients/${client.id}/purchases/${recommendation.purchaseId}`}
                  className="text-ink underline underline-offset-2 hover:text-ink/80"
                >
                  Ver compra →
                </Link>
              }
            />
          ) : null}
        </section>

        <section>
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2.5">
            Productos recomendados
          </div>
          <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
            {recommendation.items.map((sku, idx) => {
              const product = productBySku[sku as unknown as string];
              const hasTech = techs.has(sku);
              const initial = (product?.line ?? sku)[0]?.toUpperCase() ?? "•";
              return (
                <li
                  key={`${sku}-${idx}`}
                  className="grid grid-cols-[48px_minmax(0,1fr)_auto] gap-3.5 items-center bg-bone/60 rounded-md p-3"
                >
                  <Avatar initials={initial} size={44} tone={avatarTone(product?.brand)} />
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[16px] font-semibold leading-tight">
                        {product?.line ?? sku}
                      </span>
                      {product?.brand ? <BrandTag brand={product.brand} alwaysShow /> : null}
                      <span className="text-[12.5px] text-ink/55 tabular">{sku}</span>
                    </div>
                    <span className="text-[14px] text-ink/60 leading-tight">
                      {product?.name ?? "Producto fuera de catálogo"}
                      {product?.size ? ` · ${product.size}` : ""}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    {product?.price != null ? (
                      <span className="text-[15px] font-semibold tabular">
                        {formatCurrency(product.price)}
                      </span>
                    ) : null}
                    {hasTech ? (
                      <Button
                        variant="ghost"
                        onClick={() => setTechSku(sku)}
                        className="!h-7 !px-3 !text-[12.5px]"
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
