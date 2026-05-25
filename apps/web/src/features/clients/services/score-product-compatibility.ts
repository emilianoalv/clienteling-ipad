import type { Client, RoutineStep } from "@/types/client";
import type { Product, Sku } from "@/types/product";
import type { ProductTech, RoutineSlot } from "@/types/product-tech";

/**
 * Why a product matched (or didn't) a client's profile. Renders as chips
 * next to each suggestion in the visit form pickers.
 */
export type CompatibilityReasonKind =
  | "skin-match"
  | "skin-mismatch"
  | "concern-match"
  | "interest-match"
  | "allergy-conflict"
  | "subtone-match"
  | "age-match"
  | "age-mismatch"
  | "routine-level-mismatch"
  | "timing-mismatch"
  | "routine-gap-fill"
  | "preferred-ingredient"
  | "avoided-ingredient"
  | "active-allergy-conflict"
  | "line-affinity"
  | "fragrance-family-match"
  | "gender-match";

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
const WEIGHT_SUBTONE_MATCH = 1;
const WEIGHT_AGE_MATCH = 1;
const WEIGHT_AGE_MISMATCH = -1;
const WEIGHT_ROUTINE_MISMATCH = -1;
const WEIGHT_TIMING_MISMATCH = -1;
const WEIGHT_ROUTINE_GAP_FILL = 1;
const WEIGHT_PREFERRED_INGREDIENT = 1;
const WEIGHT_AVOIDED_INGREDIENT = -3;
const WEIGHT_LINE_AFFINITY = 2;
const WEIGHT_FRAGRANCE_FAMILY = 2;
const WEIGHT_GENDER_MATCH = 1;

/**
 * Familias olfativas reconocidas en los `interests` del cliente. El
 * matcher normaliza acentos y género gramatical para que "amaderado",
 * "Amaderada" y "amaderada" cuenten como el mismo token.
 */
const FRAGRANCE_INTERESTS = [
  "Floral",
  "Oriental",
  "Amaderada",
  "Cítrica",
  "Gourmand",
  "Almizclada",
  "Chypre",
  "Frutal",
] as const;

function normalizeFamilyToken(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/o$/, "a"); // "amaderado" → "amaderada"
}

const ROUTINE_RANK: Record<string, number> = {
  Ninguna: 0,
  Básica: 1,
  Intermedia: 2,
  Avanzada: 3,
  Profesional: 4,
};

/**
 * Maps a product's tech slot to the broader RoutineStep the client may
 * declare. Color cosmetics (foundation/concealer/lip) and fragrances are
 * intentionally absent — they don't live in the skincare routine and
 * shouldn't trigger gap-fill bonuses.
 */
const SLOT_TO_ROUTINE_STEP: Partial<Record<RoutineSlot, RoutineStep>> = {
  cleanser: "cleanser",
  "treatment-serum": "serum",
  "treatment-cream": "moisturizer",
  "eye-cream": "eye-cream",
  mask: "mask",
  spf: "spf",
};

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
 * Signals (in evaluation order):
 *   1. Skin type match / mismatch
 *   2. Concerns intersection
 *   3. Interest category match
 *   4. Allergy haystack (name + howTo)
 *   5. Subtone match (product.attrs.subtone vs client.skin.subtone)
 *   6-11. Tech-derived signals when ficha técnica is provided:
 *      6. Age range fit
 *      7. Routine level required
 *      8. Timing alignment (AM/PM)
 *      9. Routine gap fill (slot empty in client.routineSteps)
 *     10. Preferred / avoided ingredients against keyActives
 *     11. Active-ingredient allergy
 *
 * Pure function — testable in isolation.
 */
export function scoreProductCompatibility(
  client: Client,
  product: Product,
  tech?: ProductTech | null,
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

  // 5. Subtone match — relevant mainly for color cosmetics.
  if (product.attrs.subtone && client.skin.subtone) {
    if (product.attrs.subtone === client.skin.subtone) {
      raw += WEIGHT_SUBTONE_MATCH;
      reasons.push({
        kind: "subtone-match",
        positive: true,
        label: `Subtono ${product.attrs.subtone}`,
      });
    }
  }

  // 6. Line affinity — cliente con afinidad explícita por esta línea
  //    (ya compró antes, o el sistema la rellenó por preferencia).
  //    Match por substring case-insensitive para tolerar variantes
  //    ("Génifique" vs "Advanced Génifique").
  const productLine = product.line.toLowerCase();
  for (const affinity of client.affinities) {
    const needle = affinity.trim().toLowerCase();
    if (!needle) continue;
    if (productLine.includes(needle) || needle.includes(productLine)) {
      raw += WEIGHT_LINE_AFFINITY;
      reasons.push({
        kind: "line-affinity",
        positive: true,
        label: `Ya disfrutas ${affinity}`,
      });
      break; // un solo boost por producto, aunque haya varias afinidades
    }
  }

  // 7. Fragrance family match — para fragancias parsea la familia y
  //    compara contra los intereses olfativos del cliente.
  if (product.attrs.familia) {
    const familyTokens = product.attrs.familia.split(/\s+/).map(normalizeFamilyToken);
    const clientInterests = client.interests.map(normalizeFamilyToken);
    const matched = FRAGRANCE_INTERESTS.find((fam) => {
      const famNorm = normalizeFamilyToken(fam);
      return familyTokens.includes(famNorm) && clientInterests.includes(famNorm);
    });
    if (matched) {
      raw += WEIGHT_FRAGRANCE_FAMILY;
      reasons.push({
        kind: "fragrance-family-match",
        positive: true,
        label: `Familia ${matched.toLowerCase()} que te interesa`,
      });
    }
  }

  // 8. Gender match — soft positive. Un hombre puede usar fragancia
  //    femenina sin penalización, por eso solo suma cuando matchea.
  if (product.attrs.gender && client.gender) {
    if (
      product.attrs.gender === client.gender ||
      product.attrs.gender === "Unisex"
    ) {
      raw += WEIGHT_GENDER_MATCH;
      reasons.push({
        kind: "gender-match",
        positive: true,
        label: `Pensado para audiencia ${product.attrs.gender.toLowerCase()}`,
      });
    }
  }

  // 9+. Tech-derived signals (only when ficha técnica available).
  if (tech) {
    const extras = scoreTechExtras(client, tech);
    raw += extras.delta;
    reasons.push(...extras.reasons);
  }

  const score = Math.max(SCORE_MIN, Math.min(SCORE_MAX, raw));
  return { score, reasons };
}

function scoreTechExtras(
  client: Client,
  tech: ProductTech,
): { delta: number; reasons: CompatibilityReason[] } {
  const reasons: CompatibilityReason[] = [];
  let delta = 0;

  // Age range — only meaningful when both client.age and tech.target.age* exist
  const { ageMin, ageMax } = tech.target;
  if (client.age != null && (ageMin != null || ageMax != null)) {
    const within =
      (ageMin == null || client.age >= ageMin) &&
      (ageMax == null || client.age <= ageMax);
    if (within) {
      delta += WEIGHT_AGE_MATCH;
      reasons.push({
        kind: "age-match",
        positive: true,
        label: formatAgeFitLabel(ageMin, ageMax),
      });
    } else {
      delta += WEIGHT_AGE_MISMATCH;
      reasons.push({
        kind: "age-mismatch",
        positive: false,
        label: formatAgeMismatchLabel(client.age, ageMin, ageMax),
      });
    }
  }

  // Routine level — penalize when client routine is below required
  if (tech.target.routineLevel) {
    const required = ROUTINE_RANK[tech.target.routineLevel] ?? 0;
    const has = ROUTINE_RANK[client.routine] ?? 0;
    if (has < required) {
      delta += WEIGHT_ROUTINE_MISMATCH;
      reasons.push({
        kind: "routine-level-mismatch",
        positive: false,
        label: `Requiere rutina ${tech.target.routineLevel.toLowerCase()}`,
      });
    }
  }

  // Timing — penalize when product timing doesn't overlap with client's
  if (tech.usage.timing.length > 0 && client.routineTiming && client.routineTiming.length > 0) {
    const productAMPM = new Set(tech.usage.timing);
    const clientAMPM = new Set<"AM" | "PM">();
    for (const t of client.routineTiming) {
      if (t === "morning") clientAMPM.add("AM");
      if (t === "evening") clientAMPM.add("PM");
    }
    if (clientAMPM.size > 0) {
      const hasOverlap = [...productAMPM].some((t) => clientAMPM.has(t));
      if (!hasOverlap) {
        delta += WEIGHT_TIMING_MISMATCH;
        const only = productAMPM.has("AM") ? "mañana" : "noche";
        reasons.push({
          kind: "timing-mismatch",
          positive: false,
          label: `Solo se aplica de ${only}`,
        });
      }
    }
  }

  // Routine gap fill — boost when the product fills an empty slot in the
  // client's declared routine. Only applies to skincare slots (color/fragance
  // products are deliberately absent from SLOT_TO_ROUTINE_STEP).
  if (client.routineSteps && client.routineSteps.length > 0) {
    const slot = tech.usage.slot;
    const routineStep = SLOT_TO_ROUTINE_STEP[slot];
    if (routineStep && !client.routineSteps.includes(routineStep)) {
      delta += WEIGHT_ROUTINE_GAP_FILL;
      reasons.push({
        kind: "routine-gap-fill",
        positive: true,
        label: `Llena un hueco: ${routineStepLabel(routineStep)}`,
      });
    }
  }

  // Preferred ingredients — soft positive. Each keyActive matching adds +1.
  const preferred = client.preferredIngredients ?? [];
  for (const wanted of preferred) {
    const needle = wanted.trim().toLowerCase();
    if (!needle) continue;
    for (const active of tech.keyActives) {
      if (active.ingredient.toLowerCase().includes(needle)) {
        delta += WEIGHT_PREFERRED_INGREDIENT;
        reasons.push({
          kind: "preferred-ingredient",
          positive: true,
          label: `Te gusta: ${active.ingredient}`,
        });
        break; // one boost per preferred ingredient match
      }
    }
  }

  // Avoided ingredients — soft negative (-3, lighter than -5 allergy hammer).
  const avoided = client.avoidedIngredients ?? [];
  for (const skip of avoided) {
    const needle = skip.trim().toLowerCase();
    if (!needle) continue;
    for (const active of tech.keyActives) {
      if (active.ingredient.toLowerCase().includes(needle)) {
        delta += WEIGHT_AVOIDED_INGREDIENT;
        reasons.push({
          kind: "avoided-ingredient",
          positive: false,
          label: `Contiene ${active.ingredient} (prefieres evitar)`,
        });
        break;
      }
    }
  }

  // Active-ingredient allergy — more precise than name-based haystack
  for (const allergy of client.allergies) {
    const needle = allergy.trim().toLowerCase();
    if (!needle) continue;
    for (const active of tech.keyActives) {
      if (active.ingredient.toLowerCase().includes(needle)) {
        delta += WEIGHT_ALLERGY_CONFLICT;
        reasons.push({
          kind: "active-allergy-conflict",
          positive: false,
          label: `Contiene ${active.ingredient} (alergia registrada)`,
        });
        break; // one match per allergy is enough
      }
    }
  }

  return { delta, reasons };
}

const ROUTINE_STEP_LABEL: Record<RoutineStep, string> = {
  cleanser: "limpiador",
  toner: "tónico",
  serum: "sérum",
  moisturizer: "hidratante",
  "eye-cream": "contorno",
  spf: "SPF",
  "night-treatment": "tratamiento noche",
  mask: "mascarilla",
};

function routineStepLabel(step: RoutineStep): string {
  return ROUTINE_STEP_LABEL[step];
}

function formatAgeFitLabel(ageMin?: number, ageMax?: number): string {
  if (ageMin != null && ageMax != null) return `Edad ideal ${ageMin}-${ageMax}`;
  if (ageMin != null) return `Edad ideal ${ageMin}+`;
  if (ageMax != null) return `Edad ideal hasta ${ageMax}`;
  return "Edad ideal";
}

function formatAgeMismatchLabel(age: number, ageMin?: number, ageMax?: number): string {
  if (ageMin != null && age < ageMin) return `Pensado para ${ageMin}+ años`;
  if (ageMax != null && age > ageMax) return `Pensado para hasta ${ageMax} años`;
  return "Fuera de rango de edad";
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
 *
 * Pass `techs` to enable the ficha-técnica-derived signals.
 */
export function rankProductsForClient(
  client: Client,
  products: readonly Product[],
  techs?: ReadonlyMap<Sku, ProductTech>,
): readonly RankedProduct[] {
  return products
    .map((p) => ({
      product: p,
      score: scoreProductCompatibility(client, p, techs?.get(p.sku) ?? null),
    }))
    .sort((a, b) => b.score.score - a.score.score);
}
