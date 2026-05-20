import type { BrandId } from "./brand";
import type { Branded } from "./branded";
import type { Locale } from "./locale";
import type { StoreId } from "./store";

export type ClientId = Branded<string, "Client">;

export type ClientTier = "Signature" | "Icon" | "Atelier";
export type SkinType = "Mixta" | "Seca" | "Grasa" | "Madura" | "Normal" | "Sensible";
export type Routine = "Ninguna" | "Básica" | "Intermedia" | "Avanzada" | "Profesional";
export type RoutineTiming = "morning" | "evening" | "event";
export type Segment = "VIP" | "Recurrent" | "New" | "AtRisk";
export type Gender = "Femenino" | "Masculino" | "No binario" | "Prefiero no decir";
export type AgeRange = "18-24" | "25-34" | "35-44" | "45-54" | "55-64" | "65+";

/**
 * Skin undertone — captured during the beauty profile.
 * BAs identify it with the vein test (azul=frío, verde=cálido, mixto=neutro).
 * Critical for matching foundations and color cosmetics.
 */
export type Subtone = "frío" | "cálido" | "neutro";

/**
 * Steps the client currently performs in her routine. Captures what she
 * already uses (no clinical prescription) so the scorer can detect empty
 * slots and recommend products that fill gaps.
 */
export type RoutineStep =
  | "cleanser"
  | "toner"
  | "serum"
  | "moisturizer"
  | "eye-cream"
  | "spf"
  | "night-treatment"
  | "mask";

export interface ClientStats {
  ltv: number;
  visits: number;
  avgTicket: number;
  lastPurchase: string | null;
}

export interface LoyaltyState {
  name: string;
  tier: ClientTier;
  points: number;
  toNext: number;
}

export interface SkinProfile {
  type: SkinType;
  concerns: readonly string[];
  tone: string;
  /** Optional — captured later via Perfil de Belleza if BA doesn't know it at intake. */
  subtone?: Subtone;
}

export interface Client {
  id: ClientId;
  name: string;
  phone: string;
  email: string;
  birthday: string;
  city: string;
  age: number | null;
  preferredLang: Locale;
  since: string;
  tier: ClientTier;
  brands: readonly BrandId[];
  /** Home store — the BA / Manager who "owns" this client lives here. One client = one home store. */
  storeId: StoreId;
  skin: SkinProfile;
  allergies: readonly string[];
  loyalty: LoyaltyState;
  stats: ClientStats;
  affinities: readonly string[];
  interests: readonly string[];
  routine: Routine;
  routineTiming?: readonly RoutineTiming[];
  /**
   * Steps the client currently does (no prescription). Drives the
   * gap-filler boost in the compatibility scorer — products mapped to
   * an empty slot rank higher.
   */
  routineSteps?: readonly RoutineStep[];
  /**
   * Ingredients the client actively prefers ("vitamina c", "hialurónico",
   * "retinol", "niacinamida"). Soft positive signal in scoring.
   */
  preferredIngredients?: readonly string[];
  /**
   * Ingredients the client wants to avoid but that aren't full allergens
   * (e.g. "fragancia", "alcohol", "parabenos"). Penalizes products whose
   * keyActives match — softer than the allergy hammer.
   */
  avoidedIngredients?: readonly string[];
  gender?: Gender;
  ageRange?: AgeRange;
}
