import type { Client } from "@/types/client";
import type { Product } from "@/types/product";

/**
 * Why a product matched (or didn't) a client's profile. Renders as chips
 * next to each suggestion in the visit form pickers.
 */
export type CompatibilityReasonKind =
  | "skin-match"
  | "skin-mismatch"
  | "concern-match"
  | "interest-match"
  | "allergy-conflict";

export interface CompatibilityReason {
  kind: CompatibilityReasonKind;
  positive: boolean;
  label: string;
}

export interface CompatibilityScore {
  /** Clamped to [0, 10]. Higher = better match. */
  score: number;
  reasons: readonly CompatibilityReason[];
}

const SCORE_MIN = 0;
const SCORE_MAX = 10;

const WEIGHT_SKIN_MATCH = 3;
const WEIGHT_SKIN_MISMATCH = -2;
const WEIGHT_CONCERN_MATCH = 2;
const WEIGHT_INTEREST_MATCH = 1;
const WEIGHT_ALLERGY_CONFLICT = -5;

/**
 * Heuristic mapping from a product's `attrs.tipo` (or `attrs.familia`) to
 * the high-level interest categories the client picked at registration.
 */
function productInterestCategories(product: Product): readonly string[] {
  const tipo = product.attrs.tipo?.toLowerCase() ?? "";
  if (product.attrs.familia || tipo === "fragancia") return ["Fragancia"];
  if (
    [
      "base",
      "labial",
      "corrector",
      "sombra",
      "rubor",
      "iluminador",
      "delineador",
      "cejas",
      "máscara",
      "mascara",
    ].includes(tipo)
  ) {
    return ["Maquillaje"];
  }
  if (
    [
      "sérum",
      "serum",
      "crema",
      "limpiador",
      "tónico",
      "tonico",
      "mascarilla",
      "tratamiento",
      "contorno",
    ].includes(tipo)
  ) {
    return ["Skincare"];
  }
  return [];
}

/**
 * Score a single product against a client's profile. Returns the clamped
 * score plus the reasons that contributed to it (positive and negative).
 *
 * Pure function — testable in isolation. Used by visit form sample &
 * recommendation pickers.
 */
export function scoreProductCompatibility(
  client: Client,
  product: Product,
): CompatibilityScore {
  const reasons: CompatibilityReason[] = [];
  let raw = 0;

  // 1. Skin match
  const productSkin = product.attrs.piel ?? [];
  const skinAllMatch = productSkin.includes("Todas");
  const skinDirectMatch = productSkin.includes(client.skin.type);
  if (skinAllMatch || skinDirectMatch) {
    raw += WEIGHT_SKIN_MATCH;
    reasons.push({
      kind: "skin-match",
      positive: true,
      label: skinDirectMatch
        ? `Coincide con piel ${client.skin.type.toLowerCase()}`
        : "Apto para todos los tipos de piel",
    });
  } else if (productSkin.length > 0) {
    // Product is explicit about which skin types it serves and the
    // client's is not among them.
    raw += WEIGHT_SKIN_MISMATCH;
    reasons.push({
      kind: "skin-mismatch",
      positive: false,
      label: `No recomendado para piel ${client.skin.type.toLowerCase()}`,
    });
  }

  // 2. Concerns intersection
  const productConcerns = new Set(product.attrs.concerns ?? []);
  for (const c of client.skin.concerns) {
    if (productConcerns.has(c)) {
      raw += WEIGHT_CONCERN_MATCH;
      reasons.push({
        kind: "concern-match",
        positive: true,
        label: `Tu preocupación: ${c.toLowerCase()}`,
      });
    }
  }

  // 3. Interest match (Skincare / Maquillaje / Fragancia)
  const productCats = productInterestCategories(product);
  for (const cat of productCats) {
    if (client.interests.includes(cat)) {
      raw += WEIGHT_INTEREST_MATCH;
      reasons.push({
        kind: "interest-match",
        positive: true,
        label: `Tu interés: ${cat.toLowerCase()}`,
      });
    }
  }

  // 4. Allergy conflicts — search each allergy word inside howTo + name
  const haystack = `${product.name} ${product.howTo}`.toLowerCase();
  for (const allergy of client.allergies) {
    const needle = allergy.trim().toLowerCase();
    if (needle.length === 0) continue;
    if (haystack.includes(needle)) {
      raw += WEIGHT_ALLERGY_CONFLICT;
      reasons.push({
        kind: "allergy-conflict",
        positive: false,
        label: `Contiene ${allergy} (alergia registrada)`,
      });
    }
  }

  const score = Math.max(SCORE_MIN, Math.min(SCORE_MAX, raw));
  return { score, reasons };
}

export interface RankedProduct {
  product: Product;
  score: CompatibilityScore;
}

/**
 * Convenience: score every product and sort by score desc. Products with
 * score 0 are still included so the picker can show them with their (likely
 * negative) reasons — the BA can still override if she has context the
 * profile doesn't capture.
 */
export function rankProductsForClient(
  client: Client,
  products: readonly Product[],
): readonly RankedProduct[] {
  return products
    .map((p) => ({ product: p, score: scoreProductCompatibility(client, p) }))
    .sort((a, b) => b.score.score - a.score.score);
}
