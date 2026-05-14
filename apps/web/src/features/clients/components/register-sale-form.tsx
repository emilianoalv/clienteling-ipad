"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button, Chip, Icon, Input } from "@/components/primitives";
import { Card, KvRow, SectionHeader } from "@/components/patterns";
import type { Client } from "@/types/client";
import type { Product } from "@/types/product";
import { formatCurrency } from "@/lib/format/format-currency";
import { registerSale } from "../actions/register-sale";
import type { RegisterSaleInput } from "../schemas/register-sale.schema";
import { ProductPicker } from "./product-picker";

const PAYMENTS = ["card", "cash", "transfer", "store-credit"] as const;
type Payment = (typeof PAYMENTS)[number];

interface DraftItem {
  product: Product | null;
  qty: number;
}

const NEW_ITEM: DraftItem = { product: null, qty: 1 };

export interface RegisterSaleFormProps {
  client: Client;
  products: readonly Product[];
}

export function RegisterSaleForm({ client, products }: RegisterSaleFormProps) {
  const t = useTranslations();
  const [items, setItems] = useState<DraftItem[]>([{ ...NEW_ITEM }]);
  const [payment, setPayment] = useState<Payment>("card");
  const [ticketRef, setTicketRef] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  const filledItems = items.filter((it): it is { product: Product; qty: number } => !!it.product);
  const total = useMemo(
    () => filledItems.reduce((acc, it) => acc + it.qty * it.product.price, 0),
    [filledItems],
  );
  const unitCount = filledItems.reduce((acc, it) => acc + it.qty, 0);
  const brandsInSale = Array.from(new Set(filledItems.map((it) => it.product.brand)));

  function patchItem(idx: number, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { ...NEW_ITEM }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function onSubmit() {
    if (filledItems.length === 0) return;
    const input: RegisterSaleInput = {
      clientId: client.id,
      items: filledItems.map((it) => ({
        sku: it.product.sku,
        qty: it.qty,
        unitPrice: it.product.price,
      })),
      payment,
      ...(ticketRef ? { ticketRef } : {}),
      ...(notes ? { notes } : {}),
    };
    startTransition(async () => {
      const result = await registerSale(input);
      if (result && !result.ok) setErrors(result.fieldErrors ?? {});
    });
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
      <Card variant="luxe" className="flex flex-col gap-5">
        <SectionHeader title={t("sale.field.items")} />
        <div className="flex flex-col gap-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[minmax(0,1fr)_80px_120px_32px] gap-2.5 items-end"
            >
              <ProductPicker
                products={products}
                value={item.product}
                onSelect={(p) => patchItem(idx, { product: p })}
              />
              <Input
                label={t("sale.field.qty")}
                type="number"
                min={1}
                value={String(item.qty)}
                onChange={(e) => patchItem(idx, { qty: Math.max(1, Number(e.target.value)) })}
              />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-ink/60 tracking-[0.02em]">
                  {t("sale.field.unit_price")}
                </span>
                <div className="h-10 inline-flex items-center px-[14px] rounded-[10px] bg-bone text-sm font-semibold tabular">
                  {item.product ? formatCurrency(item.product.price) : "—"}
                </div>
              </div>
              <Button
                variant="ghost"
                iconOnly
                onClick={() => removeItem(idx)}
                aria-label={t("sale.field.remove_item")}
                disabled={items.length === 1}
              >
                <Icon name="trash" />
              </Button>
            </div>
          ))}
          {errors.items?.[0] ? (
            <span className="text-xs font-medium leading-snug text-err">{errors.items[0]}</span>
          ) : null}
          <Button variant="ghost" leading={<Icon name="plus" />} onClick={addItem}>
            {t("sale.field.add_item")}
          </Button>
        </div>

        <SectionHeader title={t("sale.field.payment")} />
        <div className="flex flex-wrap gap-1.5">
          {PAYMENTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPayment(p)}
              aria-pressed={payment === p}
              className="bg-transparent border-0 p-0 cursor-pointer"
            >
              <Chip variant={payment === p ? "accent" : "neutral"} size="sm">
                {t(`sale.payment.${p}`)}
              </Chip>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label={t("sale.field.ticket")}
            value={ticketRef}
            onChange={(e) => setTicketRef(e.target.value)}
          />
          <Input
            label={t("sale.field.notes")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button
          variant="primary"
          onClick={onSubmit}
          loading={isPending}
          disabled={filledItems.length === 0 || total <= 0}
        >
          {t("sale.submit")} {total > 0 ? `· ${formatCurrency(total)}` : ""}
        </Button>
      </Card>

      <Card className="sticky top-4 flex flex-col gap-3 bg-gradient-to-b from-white to-bone">
        <SectionHeader title={t("sale.total")} />
        <div className="font-display text-[44px] leading-none tracking-[-0.01em] tabular">
          {formatCurrency(total)}
        </div>
        <KvRow label={t("sale.field.items")} value={String(filledItems.length)} mono />
        <KvRow label="Unidades" value={String(unitCount)} mono />
        <KvRow label="Marcas" value={brandsInSale.join(", ") || "—"} />
        <KvRow label="Cliente" value={client.name} dashed={false} />
      </Card>
    </div>
  );
}
