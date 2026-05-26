import "server-only";
import type { BrandId } from "@/types/brand";
import type { Sample } from "@/types/sample";
import type { StaffId } from "@/types/staff";
import { sampleRepository } from "@/server/repositories/sample.repository";
import { productRepository } from "@/server/repositories/product.repository";

export interface ListSamplesArgs {
  brands?: readonly BrandId[];
  /**
   * BA ownership — solo el BA pasa su id. Cuando viene, devuelve únicamente
   * las muestras que el BA dio (sample.baId === id). Gerente / Supervisor /
   * Admin lo omiten para ver el counter / zona completo.
   */
  baId?: StaffId;
}

/**
 * Returns samples filtered by the requesting staff's brand scope. Samples don't
 * carry a brand directly — we derive it from the SKU via the product catalog.
 * Samples whose SKU is unknown (e.g. inventory-only items) pass through.
 */
export async function listSamples(args: ListSamplesArgs = {}): Promise<Sample[]> {
  const samples = await sampleRepository.list(args.baId ? { baId: args.baId } : {});
  if (!args.brands || args.brands.length === 0) return samples;

  const products = await productRepository.list({});
  const brandBySku = new Map(products.map((p) => [p.sku, p.brand]));
  return samples.filter((s) => {
    const brand = brandBySku.get(s.sku);
    return !brand || args.brands?.includes(brand);
  });
}
