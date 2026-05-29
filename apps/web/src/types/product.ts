import type { BrandId } from "./brand";
import type { Branded } from "./branded";
import type { Subtone } from "./client";
import type { StoreId } from "./store";

export type Sku = Branded<string, "Sku">;

export interface Product {
  sku: Sku;
  brand: BrandId;
  line: string;
  name: string;
  size: string;
  price: number;
  stock: Partial<Record<StoreId, number>>;
  attrs: {
    tipo?: string;
    piel?: readonly string[];
    concerns?: readonly string[];
    vegano?: boolean;
    /** Olfactive family — fragrances only. */
    familia?: string;
    /**
     * Undertone target for color cosmetics (foundations, concealers, lipsticks).
     * Drives the subtone-match signal in the compatibility scorer. Leave
     * undefined for skincare and fragrances (subtone doesn't apply).
     */
    subtone?: Subtone;
    /**
     * Audience del producto. Soft signal — un hombre puede usar fragancia
     * femenina sin problema, por eso solo da boost cuando matchea y no
     * penaliza cuando no.
     */
    gender?: "Femenino" | "Masculino" | "Unisex";
  };
  /** Application / usage instructions. */
  howTo: string;
  /** Selling points / arguments (3 short bullets). */
  selling: readonly string[];
  lifecycleDays: number;
  /**
   * SKU of the corresponding sample / mini in the sample inventory. Only
   * populated for products that have a real deluxe-mini available — bases,
   * correctores y labiales típicamente no tienen sample formal.
   */
  sampleSku?: Sku;
  /**
   * Path relativo a `/public` con la foto del producto. Ej. `/products/lc-gen-50.jpg`.
   * Servida estáticamente por Next desde `apps/web/public/products/`.
   * Si está vacío o el archivo no existe, la UI cae a un placeholder.
   */
  image?: string;
}
