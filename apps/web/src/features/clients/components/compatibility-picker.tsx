"use client";

import { useMemo, useState } from "react";
import type { Client } from "@/types/client";
import type { Product, Sku } from "@/types/product";
import type { ProductTech } from "@/types/product-tech";
import { Avatar, BrandTag, Icon, Input } from "@/components/primitives";
import { FichaTecnicaModal } from "@/features/catalog/components/ficha-tecnica-modal";
import {
  rankProductsForClient,
  type CompatibilityReason,
} from "../services/score-product-compatibility";

export interface CompatibilityPickerProps {
  client: Client;
  products: readonly Product[];
  /** Optional ficha técnica map. Enables age/routine/timing/active-allergy signals. */
  techs?: ReadonlyMap<Sku, ProductTech>;
  /** SKUs currently selected. */
  selected: readonly string[];
  onChange: (next: string[]) => void;
  /** Show only the top N ranked products plus any selected ones. */
  topN?: number;
  /**
   * Optional override for the product description line. The sample step uses
   * this to display the MINI size (e.g. "Gel Cream · 7 ml") instead of the
   * full-size product info that products carry by default.
   */
  describeProduct?: (product: Product) => string;
}

/**
 * Multi-select picker for visit outcomes (samples + recommendations).
 * Ranks products by compatibility score and shows reason chips.
 */
type CategoryTab = "all" | string;

export function CompatibilityPicker({
  client,
  products,
  techs,
  selected,
  onChange,
  topN = 5,
  describeProduct,
}: CompatibilityPickerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryTab>("all");
  const [techSku, setTechSku] = useState<Sku | null>(null);

  // Derive available categories from the products we received — el sample
  // step solo pasa productos con sample, así que solo veremos las categorías
  // que en efecto tienen muestra disponible.
  const categories = useMemo<readonly CategoryTab[]>(() => {
    const present = new Set<string>();
    for (const p of products) {
      if (p.attrs.tipo) present.add(p.attrs.tipo);
    }
    return ["all", ...Array.from(present)];
  }, [products]);

  const ranked = useMemo(
    () => rankProductsForClient(client, products, techs),
    [client, products, techs],
  );

  const productLookup = useMemo<Readonly<Record<string, Product>>>(() => {
    const out: Record<string, Product> = {};
    for (const p of products) out[p.sku as unknown as string] = p;
    return out;
  }, [products]);
  const techProduct = techSku
    ? productLookup[techSku as unknown as string] ?? null
    : null;
  const techData = techSku && techs ? techs.get(techSku) ?? null : null;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchesQuery = (p: Product) =>
      !q ||
      `${p.sku} ${p.line} ${p.name} ${p.brand}`.toLowerCase().includes(q);
    const matchesCategory = (p: Product) =>
      category === "all" || p.attrs.tipo === category;

    const scoped = ranked.filter(
      (r) => matchesCategory(r.product) && matchesQuery(r.product),
    );

    if (q || category !== "all") {
      // Cuando hay filtro activo mostramos todos los matches — la BA está
      // buscando algo específico, no queremos cortar la lista a topN.
      return scoped;
    }
    // Default: top N + anything already selected (so selected items always stay visible).
    const top = scoped.slice(0, topN);
    const topSkus = new Set(top.map((r) => r.product.sku));
    const extraSelected = scoped.filter(
      (r) => selected.includes(r.product.sku) && !topSkus.has(r.product.sku),
    );
    return [...top, ...extraSelected];
  }, [ranked, query, category, selected, topN]);

  function toggle(sku: Sku) {
    if (selected.includes(sku)) {
      onChange(selected.filter((s) => s !== sku));
    } else {
      onChange([...selected, sku]);
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por SKU, línea o nombre…"
          className="pl-9"
          aria-label="Buscar producto"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40">
          <Icon name="search" size={16} />
        </span>
      </div>

      {categories.length > 2 ? (
        <div className="flex items-center gap-1.5 flex-wrap">
          {categories.map((cat) => {
            const active = category === cat;
            const label = cat === "all" ? "Todas" : cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                aria-pressed={active}
                className={`inline-flex items-center h-7 px-3 rounded-full border text-[12.5px] font-semibold cursor-pointer transition-colors ${
                  active
                    ? "bg-ink text-paper border-ink"
                    : "bg-white text-ink/70 border-line hover:bg-bone hover:text-ink"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <p className="m-0 text-[14.5px] text-ink/60 py-3">No hay productos que coincidan.</p>
      ) : (
        <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
          {visible.map(({ product, score }) => {
            const isSelected = selected.includes(product.sku);
            const hasTech = techs ? techs.has(product.sku) : false;
            return (
              <li key={product.sku}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggle(product.sku)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(product.sku);
                    }
                  }}
                  aria-pressed={isSelected}
                  className={`w-full grid grid-cols-[44px_minmax(0,1fr)_auto] gap-3 items-center text-left p-2.5 rounded-md border transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ink/30 ${
                    isSelected
                      ? "bg-ink/[0.04] border-ink"
                      : "bg-white border-line hover:bg-bone"
                  }`}
                >
                  <Avatar
                    initials={(product.line[0] ?? "•").toUpperCase()}
                    size={40}
                    tone={product.brand === "Lancôme" ? "lancome" : "ysl"}
                  />
                  <div className="min-w-0 flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[15px] font-semibold leading-tight">
                        {product.line}
                      </span>
                      <BrandTag brand={product.brand} alwaysShow />
                      <span className="text-[12.5px] text-ink/60 tabular">{product.sku}</span>
                    </div>
                    <div className="text-[13.5px] text-ink/60 leading-tight truncate">
                      {describeProduct
                        ? describeProduct(product)
                        : `${product.name} · ${product.size}`}
                    </div>
                    {score.reasons.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {score.reasons.map((r, idx) => (
                          <ReasonChip key={idx} reason={r} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <CompatScoreBadge score={score.score} />
                    {hasTech ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTechSku(product.sku);
                        }}
                        className="text-[12px] font-medium text-ink/60 hover:text-ink underline underline-offset-2 cursor-pointer bg-transparent border-0 p-0"
                      >
                        Ver ficha
                      </button>
                    ) : null}
                    {isSelected ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-ink text-paper">
                        <Icon name="check" size={12} />
                      </span>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

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

function CompatScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 7
      ? "bg-ok/15 text-ok"
      : score >= 4
        ? "bg-warn/15 text-warn"
        : "bg-ink/[0.06] text-ink/60";
  return (
    <span
      className={`inline-flex items-center justify-center w-12 h-7 rounded-full text-[12.5px] font-semibold tabular ${tone}`}
    >
      {score}/10
    </span>
  );
}

function ReasonChip({ reason }: { reason: CompatibilityReason }) {
  const className = reason.positive
    ? "inline-flex items-center gap-1 h-5 px-2 rounded-full bg-ok/10 text-ok text-[11.5px] font-medium"
    : "inline-flex items-center gap-1 h-5 px-2 rounded-full bg-err/10 text-err text-[11.5px] font-medium";
  return (
    <span className={className}>
      <span aria-hidden>{reason.positive ? "✓" : "⚠"}</span>
      {reason.label}
    </span>
  );
}
