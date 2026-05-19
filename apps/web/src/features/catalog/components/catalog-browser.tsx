"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Product, Sku } from "@/types/product";
import type { ProductTech } from "@/types/product-tech";
import type { BrandId } from "@/types/brand";
import type { Store, StoreId } from "@/types/store";
import { Icon, Input } from "@/components/primitives";
import { Card, EmptyState } from "@/components/patterns";
import { ProductCard } from "./product-card";
import { ProductDetail } from "./product-detail";

type BrandTab = "all" | BrandId;
type CategoryTab = "all" | "Sérum" | "Crema" | "Base" | "Fragancia" | "Labial" | "Corrector";

const BRAND_TABS: ReadonlyArray<BrandTab> = ["all", "Lancôme", "YSL"];
const CATEGORY_TABS: ReadonlyArray<CategoryTab> = [
  "all",
  "Sérum",
  "Crema",
  "Base",
  "Fragancia",
  "Labial",
  "Corrector",
];

export interface CatalogBrowserProps {
  products: readonly Product[];
  stores: readonly Store[];
  /** Map of SKU → ficha técnica. Products without an entry render the modal in empty state. */
  techs: ReadonlyMap<Sku, ProductTech>;
  primaryStoreId: StoreId;
}

export function CatalogBrowser({
  products,
  stores,
  techs,
  primaryStoreId,
}: CatalogBrowserProps) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [brand, setBrand] = useState<BrandTab>("all");
  const [category, setCategory] = useState<CategoryTab>("all");
  const [selectedSku, setSelectedSku] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (brand !== "all" && p.brand !== brand) return false;
      if (category !== "all" && p.attrs.tipo !== category) return false;
      if (!q) return true;
      return `${p.line} ${p.name} ${p.sku}`.toLowerCase().includes(q);
    });
  }, [products, query, brand, category]);

  const selected = selectedSku
    ? filtered.find((p) => p.sku === selectedSku) ?? filtered[0] ?? null
    : filtered[0] ?? null;
  const primaryStore =
    stores.find((s) => s.id === primaryStoreId) ?? stores[0] ?? null;
  const primaryStoreLabel = primaryStore?.name ?? "—";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_360px] gap-6">
      <div className="flex flex-col gap-4 min-w-0">
        <Card variant="flat" className="flex items-center gap-2.5 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Input
              aria-label={t("catalog.search")}
              placeholder={t("catalog.search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40">
              <Icon name="search" size={16} />
            </span>
          </div>
          <Pills
            value={brand}
            options={BRAND_TABS}
            onChange={(v) => setBrand(v)}
            labelFor={brandLabel(t)}
          />
          <Pills
            value={category}
            options={CATEGORY_TABS}
            onChange={(v) => setCategory(v)}
            labelFor={categoryLabel(t)}
          />
        </Card>

        {filtered.length === 0 ? (
          <EmptyState
            title={t("catalog.empty.title")}
            description={t("catalog.empty.description")}
          />
        ) : (
          <div className="grid grid-cols-3 gap-3.5">
            {filtered.map((p) => (
              <ProductCard
                key={p.sku}
                product={p}
                selected={selected?.sku === p.sku}
                primaryStoreId={primaryStoreId}
                primaryStoreLabel={primaryStoreLabel}
                onSelect={() => setSelectedSku(p.sku)}
              />
            ))}
          </div>
        )}
      </div>

      {selected ? (
        <ProductDetail
          product={selected}
          stores={stores}
          tech={techs.get(selected.sku) ?? null}
          allProducts={products}
        />
      ) : null}
    </div>
  );
}

function Pills<T extends string>({
  value,
  options,
  onChange,
  labelFor,
}: {
  value: T;
  options: ReadonlyArray<T>;
  onChange(v: T): void;
  labelFor(v: T): string;
}) {
  return (
    <div className="inline-flex bg-bone rounded-pill p-[3px] border border-line">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            aria-pressed={active}
            className={`h-7 px-3.5 rounded-pill border-0 text-[16px] font-medium cursor-pointer transition-colors ${
              active ? "bg-white text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : "bg-transparent text-ink/60"
            }`}
          >
            {labelFor(opt)}
          </button>
        );
      })}
    </div>
  );
}

function brandLabel(t: ReturnType<typeof useTranslations>): (v: BrandTab) => string {
  return (v) => (v === "all" ? t("catalog.filters.all" as Parameters<typeof t>[0]) : v);
}

function categoryLabel(t: ReturnType<typeof useTranslations>): (v: CategoryTab) => string {
  return (v) =>
    v === "all"
      ? t("catalog.filters.all" as Parameters<typeof t>[0])
      : t(`catalog.category.${categoryKey(v)}` as Parameters<typeof t>[0]);
}

function categoryKey(v: Exclude<CategoryTab, "all">): string {
  return (
    {
      Sérum: "serum",
      Crema: "cream",
      Base: "foundation",
      Fragancia: "fragrance",
      Labial: "lipstick",
      Corrector: "corrector",
    } as const
  )[v];
}
