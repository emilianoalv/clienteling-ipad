import "server-only";
import type { BrandId } from "@/types/brand";
import type { Product } from "@/types/product";
import { productRepository } from "@/server/repositories/product.repository";

export interface ListProductsArgs {
  query?: string;
  brand?: BrandId;
  /** BA / Manager brand scope. Mirrors prototype `useBrandLock`. */
  brands?: readonly BrandId[];
  category?: string;
}

export async function listProducts(args: ListProductsArgs = {}): Promise<Product[]> {
  return productRepository.list(args);
}
