import type { Sku } from "./product";

/**
 * Datasheet/spec data for a product. Lives separate from `Product` because
 * not every catalog entry has it populated yet (verified data only).
 *
 * Designed for BA in-store use: surfaces the angles a BA needs to answer
 * client questions confidently — actives + clinical claims + routine fit +
 * sale tip — without bloating into full INCI lists.
 *
 * Several fields feed the compatibility scorer (`scoreProductCompatibility`):
 *   - `target.ageMin/Max`         → client.age
 *   - `target.routineLevel`        → client.routine
 *   - `target.skinTypes/concerns`  → client.skin.*
 *   - `usage.timing`               → client.routineTiming
 *   - `keyActives[].ingredient`    → client.allergies (allergen match)
 *   - `layerWith`                  → client.purchaseHistory (complement boost)
 */

export type RoutineTimingTag = "AM" | "PM";

export type RoutineSlot =
  | "cleanser"
  | "treatment-serum"
  | "treatment-cream"
  | "eye-cream"
  | "mask"
  | "spf"
  | "foundation"
  | "concealer"
  | "lip"
  | "fragrance";

export type RoutineLevel = "Básica" | "Intermedia" | "Avanzada" | "Profesional";

export interface KeyActive {
  ingredient: string;
  /** Published concentration when disclosed: "10%", "3%", "0.3%". */
  concentration?: string;
  /** One-line role in formula. */
  benefit: string;
}

export interface ClinicalResult {
  /** Quantified claim — "77% percibe piel más luminosa". */
  claim: string;
  /** Duration over which the result holds — "7 días", "4 semanas". */
  period?: string;
  /** Sample size when disclosed — "688 mujeres". */
  sample?: string;
}

export interface UsageProfile {
  /** AM, PM, or both. */
  timing: ReadonlyArray<RoutineTimingTag>;
  /** "Diario", "2 veces por semana", "Según necesidad". */
  frequency: string;
  /** Where it fits in the routine — drives slot conflict detection. */
  slot: RoutineSlot;
  /**
   * Position 1-6 relative to other treatments after cleanse.
   * 1=tóner/essence · 2=serum · 3=eye · 4=crema · 5=oil · 6=spf
   */
  position: number;
}

export interface TargetProfile {
  ageMin?: number;
  ageMax?: number;
  /** Skin types where this product shines. */
  skinTypes?: readonly string[];
  /** Concerns where this product gives strongest results. */
  concerns?: readonly string[];
  /** Minimum routine sophistication recommended. */
  routineLevel?: RoutineLevel;
}

export interface SensorialProfile {
  /** "Gel-serum acuoso", "Crema rica untuosa", "Líquido fluido". */
  texture: string;
  /** Makeup only — "matte natural", "satinado luminoso". */
  finish?: string;
  /** Skincare scent profile — "ligero floral", "sin fragancia". */
  scent?: string;
  /** Post-application feel — "absorbe rápido, sin pegajoso". */
  feel: string;
}

export interface ProductTech {
  /** 3-5 active ingredients. */
  keyActives: readonly KeyActive[];
  /** Brand-published clinical claims. */
  clinicalResults: readonly ClinicalResult[];
  usage: UsageProfile;
  target: TargetProfile;
  sensorial: SensorialProfile;
  /** 1-2 line differentiator the BA can recite. */
  saleTip: string;
  /** Warnings — embarazo, fotosensibilidad, combinaciones a evitar. */
  cautions?: readonly string[];
  /** Other SKUs that pair well in routine (drives layering boost in scoring). */
  layerWith?: readonly Sku[];
  /** URL of the source page used to compile this datasheet. */
  source: string;
}
