"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Product } from "@/types/product";
import type { ProductTech } from "@/types/product-tech";
import type { Store, StoreId } from "@/types/store";
import { BrandTag, Button, Icon } from "@/components/primitives";
import { Card } from "@/components/patterns";
import { formatCurrency } from "@/lib/format/format-currency";
import { ProductThumb } from "./product-thumb";
import { FichaTecnicaModal } from "./ficha-tecnica-modal";

const LOW_STOCK_THRESHOLD = 5;

export interface ProductDetailProps {
  product: Product;
  stores: readonly Store[];
  /** Ficha técnica for the selected product (null if not yet authored). */
  tech: ProductTech | null;
  /** All products visible in the catalog scope — resolves `layerWith` SKUs. */
  allProducts: readonly Product[];
  /** Tienda del BA — se destaca primero en availability para que coincida
   *  con el stock mostrado en la ProductCard del grid. */
  primaryStoreId: StoreId;
}

export function ProductDetail({
  product,
  stores,
  tech,
  allProducts,
  primaryStoreId,
}: ProductDetailProps) {
  const t = useTranslations();
  const [showTech, setShowTech] = useState(false);
  const storeLookup = new Map(stores.map((s) => [s.id, s.name]));
  const productLookup = useMemo<Readonly<Record<string, Product>>>(() => {
    const out: Record<string, Product> = {};
    for (const p of allProducts) out[p.sku as unknown as string] = p;
    return out;
  }, [allProducts]);

  // Reordenamos para que la tienda del BA salga primero — así el número
  // que ve en el sidebar coincide exacto con el "Stock en X" del grid.
  const availability = Object.entries(product.stock)
    .map(([id, qty]) => ({
      id,
      label: storeLookup.get(id as Store["id"]) ?? id,
      qty: qty ?? 0,
      isPrimary: id === primaryStoreId,
    }))
    .sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return a.label.localeCompare(b.label, "es");
    });

  return (
    <Card className="self-start sticky top-4 flex flex-col gap-3">
      <BrandTag brand={product.brand} alwaysShow />
      <div>
        <div className="font-display text-[28px] leading-tight tracking-[-0.005em]">
          {product.line}
        </div>
        <div className="text-[16px] font-medium leading-snug text-ink/60">
          {product.name} · {product.size}
        </div>
      </div>

      <ProductThumb brand={product.brand} initial={product.line.charAt(0)} height={160} />

      <div className="font-display text-[30px] leading-none tabular">
        {formatCurrency(product.price)}
      </div>

      <hr className="border-0 border-t border-dashed border-line my-1" />

      <div>
        <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          {t("catalog.detail.selling")}
        </span>
        <ul className="list-disc pl-5 m-0 mt-2 flex flex-col gap-1">
          {product.selling.map((s) => (
            <li key={s} className="text-[16px] leading-snug">
              {s}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          {t("catalog.detail.how_to")}
        </span>
        <p className="m-0 mt-2 text-[16px] leading-snug">{product.howTo}</p>
      </div>

      <hr className="border-0 border-t border-dashed border-line my-1" />

      <div>
        <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          {t("catalog.detail.availability")}
        </span>
        <ul className="list-none m-0 mt-2 p-0 flex flex-col gap-1.5">
          {availability.map((row) => {
            const low = row.qty < LOW_STOCK_THRESHOLD;
            return (
              <li key={row.id} className="flex justify-between text-[16px]">
                <span>
                  {row.label}
                  {row.isPrimary ? (
                    <span className="ml-1.5 text-[12.5px] font-medium text-ink/55">
                      · tu tienda
                    </span>
                  ) : null}
                </span>
                <span className={low ? "font-semibold text-err" : "font-semibold text-ok"}>
                  {t("catalog.detail.units", { qty: row.qty })}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-2">
        <Button
          variant="ghost"
          leading={<Icon name="pdf" />}
          className="w-full"
          onClick={() => setShowTech(true)}
        >
          {t("catalog.detail.fact_sheet")}
        </Button>
      </div>

      <FichaTecnicaModal
        open={showTech}
        product={product}
        tech={tech}
        productLookup={productLookup}
        onClose={() => setShowTech(false)}
      />
    </Card>
  );
}
