"use client";

import Link from "next/link";
import { useState } from "react";
import type { Client } from "@/types/client";
import type { Product } from "@/types/product";
import type { ProductTech } from "@/types/product-tech";
import type { Sample } from "@/types/sample";
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

function daysSince(iso: string): number {
  return Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export interface SampleDetailProps {
  client: Client;
  sample: Sample;
  /** Full product behind this sample (resolved via sampleSku reverse lookup). */
  fullProduct: Product | null;
  /** Tech sheet of the full product, if available. */
  fullProductTech: ProductTech | null;
  baName: string;
  storeName: string;
  /**
   * Catalog products keyed by SKU — needed by la ficha técnica modal para
   * resolver `layerWith`. Record, no Map: los Maps rompen el boundary RSC
   * cuando este componente cliente lo recibe desde la page server.
   */
  productLookup: Readonly<Record<string, Product>>;
  /** Prefijo para el link "Ver compra". Default `/ba/clients`. */
  basePath?: string;
}

export function SampleDetail({
  client,
  sample,
  fullProduct,
  fullProductTech,
  baName,
  storeName,
  productLookup,
  basePath = "/ba/clients",
}: SampleDetailProps) {
  const [showTech, setShowTech] = useState(false);
  const days = daysSince(sample.givenAt);
  const initial = (sample.name ?? sample.sku)[0]?.toUpperCase() ?? "•";

  return (
    <div className="flex flex-col gap-4">
      <Card variant="luxe" className="flex flex-col gap-5">
        <header className="flex items-start gap-4 justify-between flex-wrap">
          <div className="flex items-center gap-4">
            <Avatar initials={initial} size={56} tone={avatarTone(sample.brand)} />
            <div>
              <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
                {client.name}
              </div>
              <h2 className="m-0 mt-1 font-display text-[32px] leading-tight tracking-[-0.01em]">
                {sample.name}
              </h2>
              <p className="m-0 mt-1.5 text-[15px] text-ink/60 leading-snug">
                SKU {sample.sku} · entregada {formatDate(sample.givenAt)} ·{" "}
                {formatTime(sample.givenAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <BrandTag brand={sample.brand} alwaysShow />
            {sample.converted ? (
              <Chip variant="ok" size="md">
                Convertida en venta
              </Chip>
            ) : (
              <Chip variant="warn" size="md">
                Pendiente de feedback
              </Chip>
            )}
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 border-t border-line pt-4">
          <KvRow label="Entregada por" value={baName} />
          <KvRow label="Tienda" value={storeName} />
          <KvRow
            label="Días desde entrega"
            value={`${days} ${days === 1 ? "día" : "días"}`}
          />
          {sample.followUpAt ? (
            <KvRow label="Seguimiento programado" value={formatDate(sample.followUpAt)} />
          ) : null}
          {sample.purchaseId ? (
            <KvRow
              label="Ticket asociado"
              value={
                <Link
                  href={`${basePath}/${client.id}/purchases/${sample.purchaseId}`}
                  className="text-ink underline underline-offset-2 hover:text-ink/80"
                >
                  Ver compra →
                </Link>
              }
            />
          ) : null}
        </section>

        {fullProduct ? (
          <section className="border-t border-line pt-4">
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2.5">
              Producto completo
            </div>
            <div className="grid grid-cols-[48px_minmax(0,1fr)_auto] gap-3.5 items-center bg-bone/60 rounded-md p-3">
              <Avatar
                initials={(fullProduct.line[0] ?? "•").toUpperCase()}
                size={44}
                tone={avatarTone(fullProduct.brand)}
              />
              <div className="min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[16px] font-semibold leading-tight">{fullProduct.line}</span>
                  <BrandTag brand={fullProduct.brand} alwaysShow />
                  <span className="text-[12.5px] text-ink/55 tabular">{fullProduct.sku}</span>
                </div>
                <span className="text-[14px] text-ink/60 leading-tight">
                  {fullProduct.name} · {fullProduct.size}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[15px] font-semibold tabular">
                  {formatCurrency(fullProduct.price)}
                </span>
                {fullProductTech ? (
                  <Button
                    variant="ghost"
                    onClick={() => setShowTech(true)}
                    className="!h-7 !px-3 !text-[12.5px]"
                  >
                    Ver ficha
                  </Button>
                ) : null}
              </div>
            </div>
          </section>
        ) : (
          <section className="border-t border-line pt-4">
            <p className="m-0 text-[14px] text-ink/55 leading-snug">
              Sample externo al catálogo actual. No hay producto completo asociado.
            </p>
          </section>
        )}
      </Card>

      {fullProduct && showTech ? (
        <FichaTecnicaModal
          open={showTech}
          product={fullProduct}
          tech={fullProductTech}
          productLookup={productLookup}
          onClose={() => setShowTech(false)}
        />
      ) : null}
    </div>
  );
}
