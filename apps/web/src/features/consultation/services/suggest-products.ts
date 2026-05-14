import type { Product } from "@/types/product";
import type { BrandId } from "@/types/brand";

export interface SuggestionContext {
  skinType: string;
  concerns: readonly string[];
  /** Active brand scope (intersection with product brand). Empty/undefined = no filter. */
  brands?: readonly BrandId[];
}

const CONCERN_TO_PRODUCT_TAGS: Record<string, readonly string[]> = {
  Luminosidad: ["Luminosidad"],
  "Líneas finas": ["Arrugas", "Firmeza"],
  "Arrugas profundas": ["Arrugas"],
  Firmeza: ["Firmeza"],
  Manchas: ["Manchas", "Luminosidad"],
  Poros: ["Cobertura"],
  Textura: ["Cobertura"],
  Hidratación: ["Hidratación"],
  Ojeras: ["Luminosidad"],
  Rojeces: ["Sensibilidad"],
  Sensibilidad: ["Sensibilidad"],
  "Acné adulto": ["Cobertura"],
};

/**
 * Suggests up to `limit` products that match at least one concern.
 *
 * Pure function — testable in isolation. Mirrors the prototype's hardcoded
 * "LC-GEN, LC-ABS, YS-OR" intent but resolves dynamically against the catalog.
 */
export function suggestProducts(
  products: readonly Product[],
  ctx: SuggestionContext,
  limit = 6,
): Product[] {
  const targetTags = new Set<string>();
  for (const c of ctx.concerns) {
    for (const t of CONCERN_TO_PRODUCT_TAGS[c] ?? []) targetTags.add(t);
  }

  const scored = products
    .map((p) => ({ product: p, score: scoreProduct(p, ctx, targetTags) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((row) => row.product);
}

function scoreProduct(
  product: Product,
  ctx: SuggestionContext,
  targetTags: ReadonlySet<string>,
): number {
  if (ctx.brands?.length && !ctx.brands.includes(product.brand)) return 0;

  let score = 0;
  for (const tag of product.attrs.concerns ?? []) {
    if (targetTags.has(tag)) score += 2;
  }
  for (const skin of product.attrs.piel ?? []) {
    if (skin === "Todas" || skin === ctx.skinType) score += 1;
  }
  return score;
}
