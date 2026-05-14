import type { BrandId } from "./brand";
import type { Branded } from "./branded";
import type { Locale } from "./locale";

export type ClientId = Branded<string, "Client">;

export type ClientTier = "Signature" | "Icon" | "Atelier";
export type SkinType = "Mixta" | "Seca" | "Grasa" | "Madura" | "Normal" | "Sensible";
export type Routine = "Ninguna" | "Básica" | "Intermedia" | "Avanzada" | "Profesional";
export type RoutineTiming = "morning" | "evening" | "event";
export type Segment = "VIP" | "Recurrent" | "New" | "AtRisk";
export type Gender = "Femenino" | "Masculino" | "No binario" | "Prefiero no decir";
export type AgeRange = "18-24" | "25-34" | "35-44" | "45-54" | "55-64" | "65+";

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
  skin: SkinProfile;
  allergies: readonly string[];
  loyalty: LoyaltyState;
  stats: ClientStats;
  affinities: readonly string[];
  interests: readonly string[];
  routine: Routine;
  routineTiming?: readonly RoutineTiming[];
  gender?: Gender;
  ageRange?: AgeRange;
}
