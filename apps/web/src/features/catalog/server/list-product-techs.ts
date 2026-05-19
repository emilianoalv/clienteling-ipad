import "server-only";
import type { Sku } from "@/types/product";
import type { ProductTech } from "@/types/product-tech";
import { productTechRepository } from "@/server/repositories/product-tech.repository";

/**
 * Returns the full sku→tech map for the catalog. Cheap: in-memory seed
 * shared across requests. Catalog page loads this once and passes to the
 * client browser; the browser looks up tech lazily when the user opens
 * the ficha técnica modal for a specific product.
 */
export async function listProductTechs(): Promise<ReadonlyMap<Sku, ProductTech>> {
  return productTechRepository.list();
}
