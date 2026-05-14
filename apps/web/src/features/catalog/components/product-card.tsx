"use client";

import type { KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import type { Product } from "@/types/product";
import type { StoreId } from "@/types/store";
import { BrandTag, Button, Chip, Icon } from "@/components/primitives";
import { formatCurrency } from "@/lib/format/format-currency";
import { ProductThumb } from "./product-thumb";

export interface ProductCardProps {
  product: Product;
  selected: boolean;
  primaryStoreId: StoreId;
  primaryStoreLabel: string;
  onSelect(): void;
}

const LOW_STOCK_THRESHOLD = 5;

export function ProductCard({
  product,
  selected,
  primaryStoreId,
  primaryStoreLabel,
  onSelect,
}: ProductCardProps) {
  const t = useTranslations();
  const stock = product.stock[primaryStoreId] ?? 0;
  const low = stock < LOW_STOCK_THRESHOLD;

  const chips = (() => {
    const a = product.attrs;
    if (a.concerns?.length) return a.concerns.slice(0, 3);
    if (a.piel?.length) return a.piel.slice(0, 3);
    if (a.familia) return [a.familia];
    if (a.tipo) return [a.tipo];
    return [];
  })();

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={onKey}
      aria-pressed={selected}
      className={`flex flex-col text-left bg-white border rounded-lg p-4 cursor-pointer transition-[border-color,box-shadow] duration-150 ease-luxe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
        selected ? "border-ink shadow-lift" : "border-line hover:border-ink/30"
      }`}
    >
      <ProductThumb brand={product.brand} initial={product.line.charAt(0)} height={120} />
      <div className="mt-3 mb-1.5">
        <BrandTag brand={product.brand} alwaysShow />
      </div>
      <div className="text-[17px] font-semibold leading-tight">{product.line}</div>
      <div className="text-[15px] font-medium leading-snug text-ink/60">
        {product.name} · {product.size}
      </div>
      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1 mt-2.5 mb-2.5">
          {chips.map((c) => (
            <Chip key={c} size="sm">
              {c}
            </Chip>
          ))}
        </div>
      ) : null}
      <div className="mt-auto flex items-center justify-between">
        <div>
          <div className="text-[18px] font-semibold tabular">{formatCurrency(product.price)}</div>
          <div className="text-[14px] font-medium leading-snug text-ink/60">
            {t("catalog.card.stock_at", { store: primaryStoreLabel })}{" "}
            <span className={low ? "font-semibold text-err" : "font-semibold text-ok"}>
              {stock}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          iconOnly
          aria-label={t("catalog.card.add_to_recs")}
          onClick={(e) => e.stopPropagation()}
        >
          <Icon name="plus" />
        </Button>
      </div>
    </div>
  );
}
