"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { Client } from "@/types/client";
import type { Product, Sku } from "@/types/product";
import type { Recommendation } from "@/types/recommendation";
import type { Staff } from "@/types/staff";
import { Avatar, type AvatarTone, BrandTag, Button, Chip, Icon } from "@/components/primitives";
import { Card, KvRow } from "@/components/patterns";
import { formatCurrency } from "@/lib/format/format-currency";
import { handoffRecommendation } from "../actions/handoff-recommendation";

const IVA_RATE = 0.16;
const POINTS_PER_MXN = 1 / 10;

interface BasketLine {
  sku: Sku;
  qty: number;
  product: Product;
}

export interface BasketProps {
  recommendation: Recommendation;
  client: Client;
  baLabel: string;
  productLookup: Readonly<Record<Sku, Product>>;
  staffRole: Staff["role"];
}

export function Basket({ recommendation, client, baLabel, productLookup, staffRole: _staffRole }: BasketProps) {
  const t = useTranslations();
  const [items, setItems] = useState<BasketLine[]>(() =>
    recommendation.items
      .map((sku) => {
        const product = productLookup[sku];
        return product ? { sku, qty: 1, product } : null;
      })
      .filter((line): line is BasketLine => line !== null),
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const subtotal = useMemo(
    () => items.reduce((sum, line) => sum + line.product.price * line.qty, 0),
    [items],
  );
  const iva = subtotal * IVA_RATE;
  const totalWithIva = subtotal + iva;
  const points = Math.round(subtotal * POINTS_PER_MXN);
  const tone: AvatarTone = brandToTone(client.brands[0]);
  const isHandedOff = recommendation.status === "converted";

  function patchQty(sku: Sku, delta: number) {
    setItems((prev) =>
      prev.map((line) =>
        line.sku === sku ? { ...line, qty: Math.max(1, line.qty + delta) } : line,
      ),
    );
  }

  function removeLine(sku: Sku) {
    setItems((prev) => prev.filter((line) => line.sku !== sku));
  }

  function onHandoff() {
    setError(null);
    startTransition(async () => {
      const result = await handoffRecommendation({ recommendationId: recommendation.id });
      if (!result.ok) setError(result.message ?? t("basket.error.handoff"));
    });
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
      <Card variant="luxe" className="flex flex-col gap-5">
        <header>
          <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            {t("basket.eyebrow", { id: recommendation.id, name: client.name })}
          </span>
          <h2 className="m-0 font-display text-[30px] leading-tight tracking-[-0.005em]">
            {t("basket.title")}
          </h2>
          {isHandedOff ? (
            <Chip variant="ok" size="md" leading={<Icon name="check" size={12} />}>
              {t("basket.handed_off")}
            </Chip>
          ) : null}
        </header>

        <ul className="list-none m-0 p-0">
          {items.length === 0 ? (
            <li className="text-[16px] font-medium text-ink/60 py-6 text-center">
              {t("basket.empty")}
            </li>
          ) : (
            items.map((line) => (
              <li
                key={line.sku}
                className="grid grid-cols-[56px_minmax(0,1fr)_auto_auto_auto] gap-4 items-center py-3.5 border-b border-line last:border-b-0"
              >
                <span
                  aria-hidden
                  className={`inline-flex w-14 h-14 items-center justify-center rounded font-display text-[24px] ${
                    line.product.brand === "Lancôme"
                      ? "bg-lancome-rose text-lancome-ink"
                      : "bg-ysl-ink text-ysl-gold"
                  }`}
                >
                  {line.product.line.charAt(0)}
                </span>
                <div className="min-w-0">
                  <BrandTag brand={line.product.brand} alwaysShow />
                  <div className="text-[17px] font-semibold leading-tight mt-1 truncate">
                    {line.product.line}
                  </div>
                  <div className="text-[15px] font-medium leading-snug text-ink/60 truncate">
                    {line.product.name} · {line.product.size}
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 border border-line rounded-pill p-0.5">
                  <button
                    type="button"
                    onClick={() => patchQty(line.sku, -1)}
                    disabled={line.qty <= 1 || isHandedOff}
                    aria-label={t("basket.qty.decrement")}
                    className="w-6 h-6 inline-flex items-center justify-center bg-transparent border-0 cursor-pointer text-ink disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <span className="min-w-[16px] text-center text-[16px] font-semibold tabular">
                    {line.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => patchQty(line.sku, +1)}
                    disabled={isHandedOff}
                    aria-label={t("basket.qty.increment")}
                    className="w-6 h-6 inline-flex items-center justify-center bg-transparent border-0 cursor-pointer text-ink disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                <span className="text-[17px] font-semibold tabular">
                  {formatCurrency(line.product.price * line.qty)}
                </span>
                <Button
                  variant="ghost"
                  iconOnly
                  size="sm"
                  aria-label={t("basket.remove")}
                  onClick={() => removeLine(line.sku)}
                  disabled={isHandedOff}
                >
                  <Icon name="trash" size={14} />
                </Button>
              </li>
            ))
          )}
        </ul>

        <Card variant="flat" className="flex items-center gap-3 bg-bone border-transparent">
          <Icon name="gift" />
          <div className="flex-1">
            <div className="text-[16px] font-semibold">{t("basket.samples.title")}</div>
            <div className="text-[15px] font-medium text-ink/60">
              {t("basket.samples.hint")}
            </div>
          </div>
          <Button variant="ghost" size="sm" disabled aria-disabled="true">
            {t("basket.samples.add")}
          </Button>
        </Card>

        {error ? (
          <p className="m-0 text-[16px] font-medium leading-snug text-err">{error}</p>
        ) : null}
      </Card>

      <aside className="flex flex-col gap-4 sticky top-4">
        <Card>
          <KvRow label={t("basket.totals.subtotal")} value={formatCurrency(subtotal)} mono />
          <KvRow label={t("basket.totals.points")} value={`+${points}`} mono />
          <KvRow label={t("basket.totals.iva")} value={formatCurrency(iva)} mono />
          <hr className="my-3 border-0 border-t border-line" />
          <div className="flex justify-between items-baseline">
            <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              {t("basket.totals.total")}
            </span>
            <span className="font-display text-[36px] leading-none tabular">
              {formatCurrency(totalWithIva)}
            </span>
          </div>
        </Card>

        <Card className="flex flex-col items-center gap-3">
          <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60 self-start">
            {t("basket.handoff.title")}
          </span>
          <FakeQr />
          <p className="m-0 text-[16px] font-medium text-center leading-snug">
            {t("basket.handoff.scan")}
            <br />
            <span className="text-[15px] text-ink/60">{t("basket.handoff.attribution_hint")}</span>
          </p>
          <div className="font-mono text-[15px] tracking-[0.2em] text-ink/60">
            TCKT · {recommendation.id.toUpperCase()}
          </div>
          <Button
            variant="primary"
            className="w-full"
            onClick={onHandoff}
            loading={isPending}
            disabled={items.length === 0 || isHandedOff}
            leading={<Icon name="check" />}
          >
            {isHandedOff ? t("basket.handoff.done") : t("basket.handoff.cta")}
          </Button>
        </Card>

        <Card>
          <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            {t("basket.attribution.title")}
          </span>
          <div className="mt-2">
            <KvRow label={t("basket.attribution.ba")} value={baLabel} />
            <KvRow label={t("basket.attribution.recommendation")} value={recommendation.id} mono />
            <KvRow label={t("basket.attribution.client")} value={client.name} />
            <KvRow
              label={t("basket.attribution.client_tier")}
              value={
                <span className="inline-flex items-center gap-2">
                  <Avatar initials={initials(client.name)} size={22} tone={tone} />
                  {client.tier}
                </span>
              }
              dashed={false}
            />
          </div>
        </Card>

        <Link
          href={`/ba/clients/${client.id}`}
          className="text-[16px] font-medium text-ink/60 hover:text-ink no-underline self-start"
        >
          ← {t("basket.back_to_profile")}
        </Link>
      </aside>
    </div>
  );
}

function brandToTone(brand: string | undefined): AvatarTone {
  if (brand === "Lancôme") return "lancome";
  if (brand === "YSL") return "ysl";
  return "default";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
}

function FakeQr() {
  // Deterministic, decorative dotted square — visual stand-in for a QR until
  // a real handoff backend exists.
  const cells = Array.from({ length: 144 }, (_, i) => {
    const isEdge = i < 12 || i > 131 || i % 12 === 0 || i % 12 === 11;
    const hash = (i * 7) % 5;
    const on = isEdge || hash === 0 || hash === 2;
    return on;
  });
  return (
    <div
      aria-hidden
      className="w-40 h-40 bg-white border border-line rounded-md p-2.5 grid"
      style={{ gridTemplateColumns: "repeat(12, 1fr)", gap: 2 }}
    >
      {cells.map((on, i) => (
        <span
          key={i}
          className={`block rounded-sm ${on ? "bg-ink" : "bg-transparent"}`}
          style={{ aspectRatio: "1" }}
        />
      ))}
    </div>
  );
}
