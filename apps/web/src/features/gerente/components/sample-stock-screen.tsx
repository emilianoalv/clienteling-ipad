"use client";

import { useMemo, useState, useTransition } from "react";
import type { SampleInventoryItem } from "@/server/repositories/sample.repository";
import type { BrandId } from "@/types/brand";
import { BRAND_IDS } from "@/types/brand";
import { BrandTag, Button, Chip, Icon, Input, ProgressBar } from "@/components/primitives";
import { Card } from "@/components/patterns";
import { Modal } from "@/components/feedback";
import { updateSampleStockAction } from "../actions/update-sample-stock";

type FilterBrand = "all" | BrandId;
type FieldErrors = Record<string, string[]>;

interface FormState {
  have: string;
  capacity: string;
  /** Cantidad recibida — atajo UX: si tienes lote nuevo lo agregas aquí y la UI lo suma al have actual. */
  receive: string;
}

export interface SampleStockScreenProps {
  inventory: readonly SampleInventoryItem[];
}

/**
 * Gestión de inventario de muestras (deluxe minis) para la Gerente.
 * A diferencia del stock comercial — que viene del POS — las muestras
 * NO se venden, así que tampoco entran ni salen vía integración.
 * Llegan por canal Lancôme/YSL central a la tienda y la Gerente
 * registra el lote acá. Cuando la BA entrega una muestra, hoy el
 * sistema no decrementa automático (eso requiere refactor de
 * register-visit); la Gerente hace conteo físico semanal y ajusta.
 */
export function SampleStockScreen({ inventory }: SampleStockScreenProps) {
  const [editing, setEditing] = useState<SampleInventoryItem | null>(null);
  const [form, setForm] = useState<FormState>({ have: "", capacity: "", receive: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [brandFilter, setBrandFilter] = useState<FilterBrand>("all");
  const [showLowOnly, setShowLowOnly] = useState(false);

  const filtered = useMemo(() => {
    return inventory.filter((row) => {
      if (brandFilter !== "all" && row.brand !== brandFilter) return false;
      if (showLowOnly) {
        const ratio = row.capacity > 0 ? row.have / row.capacity : 1;
        if (ratio >= 0.3) return false;
      }
      return true;
    });
  }, [inventory, brandFilter, showLowOnly]);

  const lowCount = useMemo(() => {
    return inventory.filter((r) => {
      const ratio = r.capacity > 0 ? r.have / r.capacity : 1;
      return ratio < 0.3;
    }).length;
  }, [inventory]);

  function openEdit(row: SampleInventoryItem) {
    setEditing(row);
    setForm({
      have: String(row.have),
      capacity: String(row.capacity),
      receive: "",
    });
    setErrors({});
    setError(null);
  }

  function close() {
    setEditing(null);
    setForm({ have: "", capacity: "", receive: "" });
    setErrors({});
    setError(null);
  }

  function flash(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(null), 3500);
  }

  function onSubmit() {
    if (!editing) return;
    setErrors({});
    setError(null);
    const target = editing;
    const haveBase = Number(form.have);
    const received = Number(form.receive);
    const haveFinal = Number.isNaN(haveBase) ? 0 : haveBase;
    const receivedSafe = Number.isNaN(received) ? 0 : Math.max(0, received);
    const capacity = Number(form.capacity);
    const capacityFinal = Number.isNaN(capacity) ? 0 : capacity;

    startTransition(async () => {
      const result = await updateSampleStockAction(target.sku, {
        have: haveFinal + receivedSafe,
        capacity: capacityFinal,
      });
      if (result.ok) {
        flash(`Stock de ${target.name} actualizado.`);
        close();
      } else {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        if (result.message) setError(result.message);
      }
    });
  }

  return (
    <>
      <Card variant="luxe" className="flex flex-col gap-4">
        <header className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <span className="block text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              Inventario de muestras
            </span>
            <h2 className="m-0 font-display text-[28px] leading-tight">
              {inventory.length} SKUs sampleables
            </h2>
            <p className="m-0 mt-1.5 text-[14px] text-ink/60 leading-snug max-w-[640px]">
              Las muestras llegan por canal Lancôme / YSL central. Registra
              aquí los lotes recibidos y corrige tras conteo físico. El stock
              comercial vive en el POS — no se gestiona acá.
            </p>
          </div>
          {lowCount > 0 ? (
            <Chip variant="danger" size="sm">
              {lowCount} {lowCount === 1 ? "SKU" : "SKUs"} en bajo stock
            </Chip>
          ) : (
            <Chip variant="ok" size="sm">
              Stock saludable
            </Chip>
          )}
        </header>

        {notice ? (
          <div className="inline-flex items-center gap-2 px-4 py-3 bg-ok/[0.1] text-ok rounded-md text-[15px] font-semibold leading-snug border border-ok/25 self-start">
            <Icon name="check" /> {notice}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5">
            {(["all", ...BRAND_IDS] as const).map((b) => {
              const active = brandFilter === b;
              const label = b === "all" ? "Todas" : b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBrandFilter(b)}
                  className={`inline-flex items-center h-9 px-3.5 rounded-md border text-[13.5px] font-semibold cursor-pointer transition-colors ${
                    active
                      ? "bg-ink text-paper border-ink"
                      : "bg-white text-ink border-line hover:bg-bone"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => setShowLowOnly((v) => !v)}
            aria-pressed={showLowOnly}
            className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border text-[13.5px] font-semibold cursor-pointer transition-colors ${
              showLowOnly
                ? "bg-err text-paper border-err"
                : "bg-white text-ink border-line hover:bg-bone"
            }`}
          >
            <Icon name="warning" size={12} />
            Solo bajo stock
          </button>
          <div className="flex-1" />
          <Chip size="sm">{filtered.length} resultados</Chip>
        </div>

        <ul className="list-none m-0 p-0 flex flex-col gap-3">
          {filtered.map((row) => {
            const ratio = row.capacity > 0 ? row.have / row.capacity : 0;
            const tone = ratio < 0.2 ? "danger" : ratio < 0.4 ? "warn" : "neutral";
            return (
              <li
                key={row.sku}
                className="grid grid-cols-[auto_1.4fr_auto_1fr_auto] gap-3 items-center py-2.5 border-b border-dashed border-line last:border-b-0"
              >
                <BrandTag brand={row.brand} alwaysShow />
                <div className="min-w-0">
                  <div className="text-[16px] font-semibold leading-tight truncate">
                    {row.name}
                  </div>
                  <div className="text-[13px] font-mono text-ink/55 leading-tight">
                    {row.sku}
                  </div>
                </div>
                <div className="text-[15px] font-semibold tabular text-ink/80 text-right whitespace-nowrap min-w-[80px]">
                  {row.have} / {row.capacity}
                </div>
                <ProgressBar value={ratio} tone={tone} ariaLabel={`${row.have} de ${row.capacity}`} />
                <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                  Ajustar
                </Button>
              </li>
            );
          })}
          {filtered.length === 0 ? (
            <li className="py-8 text-center text-[15px] text-ink/55">
              Sin resultados con los filtros actuales.
            </li>
          ) : null}
        </ul>
      </Card>

      <Modal
        open={editing !== null}
        onClose={close}
        title={editing ? `Ajustar ${editing.name}` : "Ajustar"}
        description="Captura un lote recibido o corrige el conteo después de inventario físico."
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={close} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={onSubmit}
              loading={isPending}
              disabled={form.have === "" || form.capacity === ""}
            >
              Guardar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3.5">
          <Input
            label="Stock actual"
            type="number"
            value={form.have}
            onChange={(e) => setForm((f) => ({ ...f, have: e.target.value }))}
            hint="Lo que físicamente hay en cajón hoy."
            {...(errors.have?.[0] ? { error: errors.have[0] } : {})}
          />
          <Input
            label="Lote recibido"
            type="number"
            value={form.receive}
            onChange={(e) => setForm((f) => ({ ...f, receive: e.target.value }))}
            placeholder="0"
            hint="Atajo: si llegó un lote nuevo, ponlo aquí y se suma al stock actual al guardar."
          />
          <Input
            label="Capacidad meta"
            type="number"
            value={form.capacity}
            onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
            hint="Referencia para el progreso visual. No es un tope, solo una meta."
            {...(errors.capacity?.[0] ? { error: errors.capacity[0] } : {})}
          />

          {error ? (
            <p className="m-0 text-[14px] font-medium text-err">{error}</p>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
