"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Product } from "@/types/product";
import { BrandTag, Icon, Input } from "@/components/primitives";
import { formatCurrency } from "@/lib/format/format-currency";

export interface ProductPickerProps {
  products: readonly Product[];
  value: Product | null;
  onSelect(product: Product | null): void;
  brandScope?: string;
}

export function ProductPicker({ products, value, onSelect, brandScope }: ProductPickerProps) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => {
        if (brandScope && brandScope !== "Todas" && p.brand !== brandScope) return false;
        if (!q) return true;
        return `${p.sku} ${p.line} ${p.name} ${p.brand}`.toLowerCase().includes(q);
      })
      .slice(0, 8);
  }, [products, query, brandScope]);

  const display = value ? `${value.sku} · ${value.line}` : query;

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          aria-label={t("sale.field.product_search")}
          value={display}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onSelect(null);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder={t("sale.field.product_search")}
          className="pl-9"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40">
          <Icon name="search" size={16} />
        </span>
      </div>

      {open && candidates.length > 0 ? (
        <ul
          className="absolute top-[calc(100%+4px)] left-0 right-0 z-20 m-0 list-none p-0 max-h-72 overflow-y-auto bg-white border border-line rounded-md shadow-lift"
          role="listbox"
        >
          {candidates.map((p) => (
            <li key={p.sku}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(p);
                  setQuery("");
                  setOpen(false);
                }}
                className="w-full text-left grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2.5 border-b border-line last:border-b-0 hover:bg-bone cursor-pointer bg-transparent"
              >
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2">
                    <span className="text-[14px] font-medium tabular text-ink/60">{p.sku}</span>
                    <BrandTag brand={p.brand} alwaysShow />
                  </div>
                  <div className="text-[16px] font-semibold leading-tight mt-0.5">{p.line}</div>
                  <div className="text-[15px] font-medium leading-tight text-ink/60">
                    {p.name} · {p.size}
                  </div>
                </div>
                <div className="text-[16px] font-semibold tabular">{formatCurrency(p.price)}</div>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
