import type { Client } from "@/types/client";
import type { Product } from "@/types/product";
import type { Purchase } from "@/types/purchase";
import { Avatar, BrandTag, Icon } from "@/components/primitives";
import { Card, KvRow } from "@/components/patterns";
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

const PAYMENT_LABEL: Record<Purchase["payment"], string> = {
  card: "Tarjeta",
  cash: "Efectivo",
  transfer: "Transferencia",
  "store-credit": "Crédito tienda",
};

export interface PurchaseDetailProps {
  client: Client;
  purchase: Purchase;
  baName: string;
  storeName: string;
  productBySku: Record<string, Product>;
}

export function PurchaseDetail({
  client,
  purchase,
  baName,
  storeName,
  productBySku,
}: PurchaseDetailProps) {
  const ticketLabel = purchase.ticketRef ?? `MAN-${purchase.id.toUpperCase().slice(-8)}`;
  const totalUnits = purchase.items.reduce((acc, i) => acc + i.qty, 0);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">
      <Card variant="luxe" className="flex flex-col gap-5">
        {/* Header */}
        <header>
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            Detalle de compra
          </div>
          <div className="mt-2 flex items-baseline flex-wrap gap-x-4 gap-y-1.5">
            <span className="font-display text-[44px] leading-none tabular tracking-[-0.01em]">
              {formatCurrency(purchase.total)}
            </span>
            {purchase.brand ? <BrandTag brand={purchase.brand} alwaysShow /> : null}
            <span className="text-[15px] text-ink/60">Ticket {ticketLabel}</span>
          </div>
          <p className="m-0 mt-2 text-[14.5px] text-ink/70 leading-snug">
            {formatDate(purchase.at)} · {formatTime(purchase.at)} · {baName} ·{" "}
            {PAYMENT_LABEL[purchase.payment]}
            {purchase.paymentDetail ? ` · ${purchase.paymentDetail}` : ""}
          </p>
        </header>

        {/* Items */}
        <section>
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-3">
            Productos ({purchase.items.length})
          </div>
          <ul className="list-none m-0 p-0 flex flex-col gap-3">
            {purchase.items.map((item, idx) => {
              const product = productBySku[item.sku];
              const initial = (product?.line ?? item.sku)[0]?.toUpperCase() ?? "•";
              const lineTotal = item.qty * item.unitPrice;
              return (
                <li
                  key={`${item.sku}-${idx}`}
                  className="grid grid-cols-[80px_minmax(0,1fr)_auto] gap-4 items-center p-3.5 bg-bone/60 rounded-lg"
                >
                  {product?.image ? (
                    <span
                      aria-hidden
                      className="inline-block w-[72px] h-[72px] rounded-md bg-white overflow-hidden flex items-center justify-center"
                    >
                      <img
                        src={product.image}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-contain p-1.5"
                      />
                    </span>
                  ) : (
                    <Avatar initials={initial} size={72} tone={avatarTone(product?.brand)} />
                  )}
                  <div className="min-w-0 flex flex-col gap-1">
                    <div className="text-[12.5px] font-medium text-ink/60 tabular">
                      SKU {item.sku}
                    </div>
                    <div className="text-[17px] font-semibold leading-tight">
                      {product?.line ?? item.sku}
                    </div>
                    {product?.name ? (
                      <div className="text-[14.5px] text-ink/70 leading-snug">
                        {product.name}
                        {product.size ? ` · ${product.size}` : ""}
                      </div>
                    ) : null}
                    <div className="mt-1 inline-flex items-center gap-2 flex-wrap">
                      {product?.brand ? <BrandTag brand={product.brand} alwaysShow /> : null}
                      <span className="text-[14px] text-ink/60">
                        {item.qty} ud. × {formatCurrency(item.unitPrice)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-[22px] leading-none tabular">
                      {formatCurrency(lineTotal)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Notes / extra info */}
        {purchase.recommendationId ? (
          <section className="bg-bone/60 rounded-md p-3.5 flex items-start gap-2.5">
            <span className="text-ink/60 mt-0.5">
              <Icon name="sparkle" size={16} />
            </span>
            <p className="m-0 text-[14.5px] text-ink/70 leading-snug">
              Compra asociada a la recomendación{" "}
              <strong className="text-ink">{purchase.recommendationId}</strong>.
            </p>
          </section>
        ) : null}
      </Card>

      {/* Side summary */}
      <aside className="flex flex-col gap-5 sticky top-4">
        <Card className="flex flex-col gap-3 bg-gradient-to-b from-white to-bone">
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            Resumen
          </div>
          <ul className="list-none m-0 p-0 flex flex-col gap-2.5 border-t border-line pt-3.5">
            <SummaryRow label="Total" value={formatCurrency(purchase.total)} mono />
            <SummaryRow label="Productos" value={String(purchase.items.length)} mono />
            <SummaryRow label="Unidades" value={String(totalUnits)} mono />
            <SummaryRow label="Pago" value={PAYMENT_LABEL[purchase.payment]} />
            <SummaryRow label="Captura" value={purchase.manual ? "Manual" : "POS"} />
          </ul>
        </Card>

        <Card variant="flat">
          <KvRow label="Cliente" value={client.name} dashed={false} />
          <KvRow label="Atribución" value={baName} />
          <KvRow label="Tienda" value={storeName} />
          <KvRow label="Fecha" value={`${formatDate(purchase.at)} · ${formatTime(purchase.at)}`} />
        </Card>
      </aside>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 text-[15px]">
      <span className="text-ink/60">{label}</span>
      <span className={`font-semibold ${mono ? "tabular" : ""}`}>{value}</span>
    </li>
  );
}
