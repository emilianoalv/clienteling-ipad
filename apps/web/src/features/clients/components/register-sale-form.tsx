"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Avatar, Button, Icon, Input } from "@/components/primitives";
import { Card } from "@/components/patterns";
import { BarcodeScanner } from "@/components/feedback/barcode-scanner";
import type { Client } from "@/types/client";
import type { Product } from "@/types/product";
import { VISIT_MOTIVES, type VisitMotive } from "@/types/visit-motive";
import { FOLLOWUP_TYPES, type FollowupType } from "@/types/followup-task";
import { formatCurrency } from "@/lib/format/format-currency";
import { registerSale } from "../actions/register-sale";
import type { RegisterSaleInput } from "../schemas/register-sale.schema";
import { ProductPicker } from "./product-picker";
import { buildFollowupDescription } from "../services/build-followup-description";

// El seguimiento de una VENTA nunca debería ser "Feedback de muestra"
// porque en venta no se entrega muestra. Filtramos ese tipo del picker.
const SALE_FOLLOWUP_TYPES = FOLLOWUP_TYPES.filter((ft) => ft.id !== "sample-feedback");

const PAYMENTS = ["card", "cash", "transfer", "store-credit"] as const;
type Payment = (typeof PAYMENTS)[number];

interface DraftItem {
  product: Product | null;
  qty: number;
}

const NEW_ITEM: DraftItem = { product: null, qty: 1 };

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nowHHMM(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
}

const PAYMENT_DETAIL_PLACEHOLDER: Record<Payment, string> = {
  card: "Visa · 4321",
  cash: "Recibido en MXN",
  transfer: "Banorte · ref",
  "store-credit": "Crédito #",
};

export interface RegisterSaleFormProps {
  client: Client;
  products: readonly Product[];
  baName: string;
  storeName: string;
}

export function RegisterSaleForm({ client, products, baName, storeName }: RegisterSaleFormProps) {
  const t = useTranslations();
  const [motive, setMotive] = useState<VisitMotive>("new-purchase");
  const [purchaseDate, setPurchaseDate] = useState<string>(todayISO());
  const [purchaseTime, setPurchaseTime] = useState<string>(nowHHMM());
  const [items, setItems] = useState<DraftItem[]>([{ ...NEW_ITEM }]);
  const [payment, setPayment] = useState<Payment>("card");
  const [paymentDetail, setPaymentDetail] = useState("");
  const [ticketRef, setTicketRef] = useState("");
  const [notes, setNotes] = useState("");
  const [showFollowup, setShowFollowup] = useState(false);
  const [followupType, setFollowupType] = useState<FollowupType>("call");
  const [followupDescription, setFollowupDescription] = useState("");
  const [followupDueAt, setFollowupDueAt] = useState<string>(addDaysISO(14));
  // Lock: cuando el BA edita la descripción manualmente, dejamos de
  // re-armarla al cambiar el tipo. Sin esto, escribir un mensaje y darle
  // a otro chip lo pisa.
  const [descriptionEdited, setDescriptionEdited] = useState(false);

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [scannerOpen, setScannerOpen] = useState<number | null>(null);
  const [scanWarning, setScanWarning] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filledItems = items.filter((it): it is { product: Product; qty: number } => !!it.product);
  const total = useMemo(
    () => filledItems.reduce((acc, it) => acc + it.qty * it.product.price, 0),
    [filledItems],
  );

  function recomputeFollowupDescription(type: FollowupType): string {
    const productNames = filledItems.map((it) => it.product.line);
    return buildFollowupDescription({
      type,
      firstName: client.name.split(/\s+/)[0] ?? client.name,
      ...(productNames.length > 0
        ? { context: { kind: "purchase", productNames } }
        : {}),
    });
  }

  function toggleFollowup(next: boolean) {
    setShowFollowup(next);
    if (next && !followupDescription) {
      setFollowupDescription(recomputeFollowupDescription(followupType));
    }
  }

  function changeFollowupType(next: FollowupType) {
    setFollowupType(next);
    if (!descriptionEdited) {
      setFollowupDescription(recomputeFollowupDescription(next));
    }
  }

  function changeFollowupDescription(next: string) {
    setFollowupDescription(next);
    setDescriptionEdited(true);
  }
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

  function handleScan(code: string) {
    const idx = scannerOpen;
    setScannerOpen(null);
    if (idx === null) return;
    const found = products.find(
      (p) => p.sku.toLowerCase() === code.toLowerCase() || p.sku.replace(/\s/g, "") === code,
    );
    if (!found) {
      setScanWarning(`SKU "${code}" no está en tu catálogo de marca`);
      window.setTimeout(() => setScanWarning(null), 4000);
      return;
    }
    patchItem(idx, { product: found });
  }

  function onSubmit() {
    if (filledItems.length === 0) return;
    const input: RegisterSaleInput = {
      clientId: client.id,
      motive,
      purchaseDate,
      purchaseTime,
      items: filledItems.map((it) => ({
        sku: it.product.sku,
        qty: it.qty,
        unitPrice: it.product.price,
      })),
      payment,
      ...(paymentDetail ? { paymentDetail } : {}),
      ...(ticketRef ? { ticketRef } : {}),
      ...(notes ? { notes } : {}),
      ...(showFollowup
        ? {
            followup: {
              type: followupType,
              description: followupDescription,
              dueAt: followupDueAt,
            },
          }
        : {}),
    };
    startTransition(async () => {
      const result = await registerSale(input);
      if (result && !result.ok) setErrors(result.fieldErrors ?? {});
    });
  }

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">
        <Card variant="luxe" className="flex flex-col gap-5">
          {/* Eyebrow + heading */}
          <header>
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              Registrar venta · Manual
            </div>
            <h2 className="m-0 mt-1 font-display text-[30px] leading-tight tracking-[-0.01em]">
              Captura una compra
            </h2>
            <p className="m-0 mt-1.5 text-[15px] text-ink/60 leading-snug">
              Usa esta vista cuando no haya integración con POS. La venta se atribuye automáticamente
              a <strong className="text-ink">{baName}</strong>.
            </p>
          </header>

          {/* Client banner */}
          <article className="bg-bone rounded-xl px-4 py-3 flex items-center gap-3.5">
            <Avatar initials={initials(client.name)} size={48} />
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-semibold leading-tight">{client.name}</div>
              <div className="text-[14px] text-ink/60 leading-tight mt-0.5 truncate">
                {client.phone} · {client.email}
              </div>
            </div>
            <span className="inline-flex items-center h-9 px-4 rounded-full bg-ink text-paper text-[13px] font-semibold">
              Atribuir a {baName.split(/\s+/)[0]}
            </span>
          </article>

          {/* Motivo de la visita */}
          <section>
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2.5">
              Motivo de la visita *
            </div>
            <div className="flex flex-wrap gap-1.5">
              {VISIT_MOTIVES.map((m) => {
                const active = motive === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMotive(m.id)}
                    aria-pressed={active}
                    className={`inline-flex items-center h-9 px-4 rounded-full border text-[13.5px] font-semibold cursor-pointer transition-colors ${
                      active
                        ? "bg-ink text-paper border-ink"
                        : "bg-white text-ink border-line hover:bg-bone"
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
            {errors.motive?.[0] ? (
              <span className="block mt-1.5 text-xs text-err">{errors.motive[0]}</span>
            ) : null}
          </section>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-4 max-w-[420px]">
            <Input
              label="Fecha de la compra *"
              type="date"
              value={purchaseDate}
              max={todayISO()}
              onChange={(e) => setPurchaseDate(e.target.value)}
              {...(errors.purchaseDate?.[0] ? { error: errors.purchaseDate[0] } : {})}
            />
            <Input
              label="Hora"
              type="time"
              value={purchaseTime}
              onChange={(e) => setPurchaseTime(e.target.value)}
              {...(errors.purchaseTime?.[0] ? { error: errors.purchaseTime[0] } : {})}
            />
          </div>

          {/* Products */}
          <section>
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2.5">
              Productos vendidos *
            </div>
            <article className="bg-bone/60 border border-line rounded-xl p-3 flex flex-col gap-2.5">
              <div className="grid grid-cols-[minmax(0,1fr)_36px_80px_120px_32px] gap-2.5 px-1 text-[13px] font-medium text-ink/60">
                <span>SKU / producto</span>
                <span />
                <span>Cantidad</span>
                <span>Precio</span>
                <span />
              </div>
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[minmax(0,1fr)_36px_80px_120px_32px] gap-2.5 items-center"
                >
                  <ProductPicker
                    products={products}
                    value={item.product}
                    onSelect={(p) => patchItem(idx, { product: p })}
                  />
                  <Button
                    variant="ghost"
                    iconOnly
                    onClick={() => setScannerOpen(idx)}
                    aria-label="Escanear SKU con cámara"
                    className="h-10 w-10"
                  >
                    <Icon name="scan" size={20} />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    value={String(item.qty)}
                    onChange={(e) =>
                      patchItem(idx, { qty: Math.max(1, Number(e.target.value)) })
                    }
                    aria-label="Cantidad"
                  />
                  <div className="h-10 inline-flex items-center px-[14px] rounded-[10px] bg-bone text-[15px] font-semibold tabular text-ink/80">
                    {item.product ? formatCurrency(item.product.price) : "—"}
                  </div>
                  <Button
                    variant="ghost"
                    iconOnly
                    onClick={() => removeItem(idx)}
                    aria-label={t("sale.field.remove_item")}
                    disabled={items.length === 1}
                  >
                    <Icon name="x" />
                  </Button>
                </div>
              ))}
              {errors.items?.[0] ? (
                <span className="text-xs font-medium leading-snug text-err px-1">
                  {errors.items[0]}
                </span>
              ) : null}
            </article>
            <div className="mt-3">
              <Button variant="ghost" leading={<Icon name="plus" />} onClick={addItem}>
                Agregar otro producto
              </Button>
            </div>
            {scanWarning ? (
              <span className="block mt-2 text-[14.5px] text-warn font-medium leading-snug">
                {scanWarning}
              </span>
            ) : null}
          </section>

          {/* Payment method */}
          <section>
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2.5">
              Método de pago
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENTS.map((p) => {
                const active = payment === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPayment(p)}
                    aria-pressed={active}
                    className={`inline-flex items-center h-9 px-4 rounded-full border text-[13px] font-semibold cursor-pointer transition-colors ${
                      active
                        ? "bg-ink text-paper border-ink"
                        : "bg-white text-ink border-line hover:bg-bone"
                    }`}
                  >
                    {t(`sale.payment.${p}`)}
                  </button>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input
                label="Detalle (opcional)"
                value={paymentDetail}
                onChange={(e) => setPaymentDetail(e.target.value)}
                placeholder={PAYMENT_DETAIL_PLACEHOLDER[payment]}
              />
              <Input
                label="Ticket / folio (opcional)"
                value={ticketRef}
                onChange={(e) => setTicketRef(e.target.value)}
                placeholder="LV-260514-XXXX (vacío → folio MAN-…)"
              />
            </div>
          </section>

          {/* Notes */}
          <section>
            <label
              htmlFor="sale-notes"
              className="block text-[14.5px] font-semibold tracking-[0.02em] text-ink/70 mb-1.5"
            >
              Notas (opcional)
            </label>
            <textarea
              id="sale-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Comentarios sobre la venta, regalo, instrucciones especiales…"
              className="w-full rounded-[10px] border border-line bg-white px-[14px] py-2.5 text-[15px] text-ink outline-none placeholder:text-ink/40 focus-visible:border-ink resize-y"
            />
          </section>

          {/* Optional follow-up */}
          <section>
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-3">
              ¿Programar seguimiento? (opcional)
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showFollowup}
                onChange={(e) => toggleFollowup(e.target.checked)}
                className="mt-1 w-[18px] h-[18px] accent-ink shrink-0"
              />
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-semibold leading-tight">
                  Sí, agendar tarea post-venta
                </span>
                <span className="block text-[13.5px] text-ink/60 leading-snug mt-0.5">
                  Aparecerá en tu inbox de Seguimientos. Útil para llamar y pedir feedback.
                </span>
              </span>
            </label>
            {showFollowup ? (
              <div className="pl-9 pr-1 mt-3 flex flex-col gap-3">
                <div>
                  <div className="text-[12.5px] font-semibold text-ink/70 mb-1.5">Tipo</div>
                  <div className="flex flex-wrap gap-1.5">
                    {SALE_FOLLOWUP_TYPES.map((ft) => {
                      const active = followupType === ft.id;
                      return (
                        <button
                          key={ft.id}
                          type="button"
                          onClick={() => changeFollowupType(ft.id)}
                          aria-pressed={active}
                          className={`inline-flex items-center h-8 px-3 rounded-full border text-[12.5px] font-semibold cursor-pointer transition-colors ${
                            active
                              ? "bg-ink text-paper border-ink"
                              : "bg-white text-ink border-line hover:bg-bone"
                          }`}
                        >
                          {ft.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3 items-start">
                  <Input
                    label="Descripción *"
                    placeholder='ej. "Llamar para feedback post-compra"'
                    value={followupDescription}
                    onChange={(e) => changeFollowupDescription(e.target.value)}
                    {...(errors["followup.description"]?.[0]
                      ? { error: errors["followup.description"][0] }
                      : {})}
                  />
                  <Input
                    label="Vence *"
                    type="date"
                    value={followupDueAt}
                    min={todayISO()}
                    onChange={(e) => setFollowupDueAt(e.target.value)}
                    {...(errors["followup.dueAt"]?.[0]
                      ? { error: errors["followup.dueAt"][0] }
                      : {})}
                  />
                </div>
              </div>
            ) : null}
          </section>

          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={onSubmit}
              loading={isPending}
              disabled={filledItems.length === 0 || total <= 0}
            >
              Registrar venta {total > 0 ? `· ${formatCurrency(total)}` : ""}
            </Button>
          </div>
        </Card>

        {/* Right side panel */}
        <aside className="flex flex-col gap-5 sticky top-4">
          <Card className="flex flex-col gap-4 bg-gradient-to-b from-white to-bone">
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              Total venta
            </div>
            <div className="font-display text-[44px] leading-none tracking-[-0.01em] tabular">
              {formatCurrency(total)}
            </div>
            <ul className="list-none m-0 p-0 flex flex-col gap-2.5 border-t border-line pt-4">
              <SummaryRow label="Productos" value={filledItems.length} mono />
              <SummaryRow label="Unidades" value={unitCount} mono />
              <SummaryRow label="Marcas" value={brandsInSale.join(", ") || "—"} />
              <SummaryRow label="Atribución" value={baName} />
              <SummaryRow label="Tienda" value={storeName} />
            </ul>
          </Card>

          <Card variant="flat" className="bg-bone/60">
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              Integración POS
            </div>
            <p className="m-0 mt-2 text-[14.5px] text-ink/70 leading-snug">
              En tiendas con integración bidireccional, las compras llegan automáticamente desde el
              POS. Esta pantalla es para captura manual cuando no hay sincronización.
            </p>
          </Card>
        </aside>
      </div>

      <BarcodeScanner
        open={scannerOpen !== null}
        onScan={handleScan}
        onClose={() => setScannerOpen(null)}
        hint="Apunta al código del producto. Si no está en tu catálogo, se ignora."
      />
    </>
  );
}

function SummaryRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 text-[15px]">
      <span className="text-ink/60">{label}</span>
      <span className={`font-semibold ${mono ? "tabular" : ""}`}>{value}</span>
    </li>
  );
}
