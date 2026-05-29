"use client";

import { useMemo, useState, useTransition } from "react";
import type { Product, Sku } from "@/types/product";
import type { BrandId } from "@/types/brand";
import { BRAND_IDS } from "@/types/brand";
import { BrandTag, Button, Chip, Icon, Input } from "@/components/primitives";
import { Card } from "@/components/patterns";
import { Modal } from "@/components/feedback";
import { createProductAction } from "../actions/create-product";
import { updateProductAction } from "../actions/update-product";
import { deleteProductAction } from "../actions/delete-product";

type Mode = "create" | "edit" | "delete" | null;
type FieldErrors = Record<string, string[]>;
type FilterBrand = "all" | BrandId;

interface FormState {
  sku: string;
  brand: BrandId;
  line: string;
  name: string;
  size: string;
  price: string;
  category: string;
  lifecycleDays: string;
}

const INITIAL_FORM: FormState = {
  sku: "",
  brand: "Lancôme",
  line: "",
  name: "",
  size: "",
  price: "",
  category: "",
  lifecycleDays: "120",
};

function fromProduct(p: Product): FormState {
  return {
    sku: p.sku as unknown as string,
    brand: p.brand,
    line: p.line,
    name: p.name,
    size: p.size,
    price: String(p.price),
    category: p.attrs.tipo ?? "",
    lifecycleDays: String(p.lifecycleDays),
  };
}

export interface CatalogScreenProps {
  products: readonly Product[];
}

/**
 * CRUD de catálogo (RF-17 + RF-55). El Admin mantiene line, name, price,
 * category y lifecycle de cada SKU sin redeploy. Stock por tienda
 * NO se edita aquí — RF-22 dicta que viene del POS.
 *
 * Eliminar bloquea si el SKU está en algún ticket histórico (los
 * Purchase apuntarían a un SKU fantasma). Lo correcto sería
 * "descontinuar" con soft-delete, queda como Sprint 2.
 */
export function CatalogScreen({ products }: CatalogScreenProps) {
  const [mode, setMode] = useState<Mode>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [brandFilter, setBrandFilter] = useState<FilterBrand>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (brandFilter !== "all" && p.brand !== brandFilter) return false;
      if (!q) return true;
      return `${p.sku} ${p.line} ${p.name} ${p.attrs.tipo ?? ""}`
        .toLowerCase()
        .includes(q);
    });
  }, [products, query, brandFilter]);

  function close() {
    setMode(null);
    setEditing(null);
    setForm(INITIAL_FORM);
    setErrors({});
    setError(null);
  }

  function openCreate() {
    setForm(INITIAL_FORM);
    setErrors({});
    setError(null);
    setMode("create");
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm(fromProduct(p));
    setErrors({});
    setError(null);
    setMode("edit");
  }

  function openDelete(p: Product) {
    setEditing(p);
    setError(null);
    setMode("delete");
  }

  function flash(message: string) {
    setNotice(message);
    setTimeout(() => setNotice(null), 3500);
  }

  function buildInput() {
    const price = Number(form.price);
    const lifecycle = Number(form.lifecycleDays);
    return {
      sku: form.sku,
      brand: form.brand,
      line: form.line,
      name: form.name,
      size: form.size,
      price: Number.isNaN(price) ? 0 : price,
      category: form.category,
      lifecycleDays: Number.isNaN(lifecycle) ? 0 : lifecycle,
    };
  }

  function onSubmitCreate() {
    setErrors({});
    setError(null);
    startTransition(async () => {
      const result = await createProductAction(buildInput());
      if (result.ok) {
        flash(`Producto ${form.sku.toUpperCase()} creado.`);
        close();
      } else {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        if (result.message) setError(result.message);
      }
    });
  }

  function onSubmitEdit() {
    if (!editing) return;
    setErrors({});
    setError(null);
    startTransition(async () => {
      const result = await updateProductAction(editing.sku, buildInput());
      if (result.ok) {
        flash(`Producto ${editing.sku} actualizado.`);
        close();
      } else {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        if (result.message) setError(result.message);
      }
    });
  }

  function onSubmitDelete() {
    if (!editing) return;
    setError(null);
    const target = editing;
    startTransition(async () => {
      const result = await deleteProductAction(target.sku);
      if (result.ok) {
        flash(`Producto ${target.sku} eliminado.`);
        close();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <>
      <Card variant="luxe" className="flex flex-col gap-4">
        <header className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <span className="block text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              Catálogo nacional
            </span>
            <h2 className="m-0 font-display text-[28px] leading-tight">
              {products.length} SKUs activos
            </h2>
          </div>
          <Button
            variant="outline"
            leading={<Icon name="plus" size={12} />}
            onClick={openCreate}
          >
            Crear producto
          </Button>
        </header>

        {notice ? (
          <div className="inline-flex items-center gap-2 px-4 py-3 bg-ok/[0.1] text-ok rounded-md text-[15px] font-semibold leading-snug border border-ok/25 self-start">
            <Icon name="check" /> {notice}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Input
              aria-label="Buscar producto"
              placeholder="Buscar por SKU, línea o nombre"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40">
              <Icon name="search" size={16} />
            </span>
          </div>
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
          <Chip size="sm">{filtered.length} resultados</Chip>
        </div>

        <ul className="list-none m-0 p-0">
          {filtered.map((p) => (
            <li
              key={p.sku as unknown as string}
              className="grid grid-cols-[auto_1.6fr_1fr_auto_auto] gap-3 items-center py-3 border-b border-dashed border-line last:border-b-0"
            >
              <BrandTag brand={p.brand} alwaysShow />
              <div className="min-w-0 flex flex-col gap-0.5">
                <div className="text-[16px] font-semibold leading-tight">
                  {p.line} <span className="text-ink/60 font-medium">· {p.name}</span>
                </div>
                <div className="text-[13.5px] font-mono text-ink/55 leading-tight">
                  {p.sku} · {p.size} · {p.attrs.tipo ?? "—"}
                </div>
              </div>
              <span className="text-[15px] font-semibold tabular text-ink/80 text-right">
                {formatPrice(p.price)}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label={`Editar ${p.sku}`}
                  onClick={() => openEdit(p)}
                >
                  <Icon name="more" size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label={`Eliminar ${p.sku}`}
                  onClick={() => openDelete(p)}
                >
                  <Icon name="x" size={14} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Modal
        open={mode === "create" || mode === "edit"}
        onClose={close}
        title={mode === "edit" ? "Editar producto" : "Crear producto"}
        description={
          mode === "edit"
            ? "Modifica los datos comerciales. SKU es identidad — no se renombra. Stock por tienda y atributos finos (concerns, ingredientes) no se editan aquí."
            : "Da de alta un SKU nuevo en el catálogo nacional. Stock arranca en 0 — se llenará desde la integración POS."
        }
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={close} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={mode === "edit" ? onSubmitEdit : onSubmitCreate}
              loading={isPending}
              disabled={
                !form.sku ||
                !form.line ||
                !form.name ||
                !form.size ||
                !form.price ||
                !form.category
              }
            >
              {mode === "edit" ? "Guardar cambios" : "Crear producto"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3.5">
          <Input
            label="SKU"
            value={form.sku}
            onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value.toUpperCase() }))}
            placeholder="LCM-GEN-30"
            autoFocus
            disabled={mode === "edit"}
            hint={mode === "edit" ? "El SKU es la identidad del producto y no se puede cambiar." : "Solo mayúsculas, números y guiones."}
            {...(errors.sku?.[0] ? { error: errors.sku[0] } : {})}
          />

          <div>
            <div className="text-[14px] font-semibold mb-1.5">Marca</div>
            <div className="flex gap-1.5">
              {BRAND_IDS.map((b) => {
                const active = form.brand === b;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, brand: b }))}
                    className={`inline-flex items-center h-9 px-3.5 rounded-md border text-[13.5px] font-semibold cursor-pointer transition-colors ${
                      active
                        ? "bg-ink text-paper border-ink"
                        : "bg-white text-ink border-line hover:bg-bone"
                    }`}
                  >
                    {b}
                  </button>
                );
              })}
            </div>
            {errors.brand?.[0] ? (
              <span className="block mt-1 text-[12.5px] text-err">{errors.brand[0]}</span>
            ) : null}
          </div>

          <Input
            label="Línea"
            value={form.line}
            onChange={(e) => setForm((f) => ({ ...f, line: e.target.value }))}
            placeholder="Génifique"
            {...(errors.line?.[0] ? { error: errors.line[0] } : {})}
          />

          <Input
            label="Nombre comercial"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Advanced Serum"
            {...(errors.name?.[0] ? { error: errors.name[0] } : {})}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Presentación"
              value={form.size}
              onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
              placeholder="30 ml"
              {...(errors.size?.[0] ? { error: errors.size[0] } : {})}
            />
            <Input
              label="Precio (MXN)"
              type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="2050"
              {...(errors.price?.[0] ? { error: errors.price[0] } : {})}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Categoría"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="Sérum"
              hint="Sérum · Crema · Mascarilla · Labial · Fragancia · etc."
              {...(errors.category?.[0] ? { error: errors.category[0] } : {})}
            />
            <Input
              label="Vida útil (días)"
              type="number"
              value={form.lifecycleDays}
              onChange={(e) =>
                setForm((f) => ({ ...f, lifecycleDays: e.target.value }))
              }
              placeholder="120"
              hint="Para sugerir reposición."
              {...(errors.lifecycleDays?.[0]
                ? { error: errors.lifecycleDays[0] }
                : {})}
            />
          </div>

          {error ? (
            <p className="m-0 text-[14px] font-medium text-err">{error}</p>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={mode === "delete"}
        onClose={close}
        title="Eliminar producto"
        description="Esta acción no se puede deshacer."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={close} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={onSubmitDelete}
              loading={isPending}
            >
              Eliminar producto
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="m-0 text-[15px] leading-snug">
            Vas a eliminar{" "}
            <strong>
              {editing?.sku} · {editing?.line}
            </strong>
            . Si el SKU ya tiene tickets históricos, la acción será bloqueada
            para no dejar las compras apuntando a un SKU fantasma.
          </p>
          {error ? (
            <p className="m-0 text-[14px] font-medium text-err">{error}</p>
          ) : null}
        </div>
      </Modal>
    </>
  );
}

function formatPrice(n: number): string {
  try {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${n}`;
  }
}

// Re-export para evitar warning de Sku unused.
export type { Sku };
