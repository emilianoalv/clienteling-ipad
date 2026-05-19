import type { BrandId } from "./brand";
import type { Branded } from "./branded";
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
}
