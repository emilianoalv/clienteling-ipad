import { z } from "zod";
import { BRAND_IDS } from "@/types/brand";

export const GENDER_OPTIONS = ["Femenino", "Masculino", "No binario", "Prefiero no decir"] as const;
export const AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"] as const;
export const SKIN_TYPES = ["Normal", "Seca", "Mixta", "Grasa", "Sensible", "Madura"] as const;
export const ROUTINE_LEVELS = ["Ninguna", "Básica", "Intermedia", "Avanzada", "Profesional"] as const;
export const ROUTINE_TIMINGS = ["morning", "evening", "event"] as const;
export const SUBTONES = ["frío", "cálido", "neutro"] as const;
export const TONE_SWATCHES = [
  "Muy claro",
  "Claro",
  "Medio",
  "Medio cálido",
  "Oscuro",
  "Muy oscuro",
] as const;
/**
 * Steps a client may already do in her current routine. The BA captures
 * what the client uses today (any brand) — gap-filler analysis surfaces
 * which slots are empty so the scorer can boost products that fill them.
 */
export const ROUTINE_STEPS = [
  "cleanser",
  "toner",
  "serum",
  "moisturizer",
  "eye-cream",
  "spf",
  "night-treatment",
  "mask",
] as const;
/**
 * Common skincare concerns. Captured at registration (optional, up to 3)
 * to drive the concerns-intersection signal in the scorer.
 */
export const COMMON_CONCERNS = [
  "Luminosidad",
  "Líneas finas",
  "Arrugas profundas",
  "Firmeza",
  "Manchas",
  "Poros",
  "Textura",
  "Hidratación",
  "Ojeras",
  "Rojeces",
  "Sensibilidad",
  "Acné adulto",
] as const;
/**
 * Common ingredient tags clients recognize. Used for the preferred / avoided
 * lists in the Beauty Profile (soft signals in the scorer).
 */
export const INGREDIENT_TAGS = [
  "Ácido hialurónico",
  "Vitamina C",
  "Niacinamida",
  "Retinol",
  "Bífidus",
  "Pro-Xylane",
  "Rosa de Grasse",
  "Pachulí",
  "Vainilla",
  "Fragancia",
  "Alcohol",
  "Parabenos",
  "Sulfatos",
  "Aceites esenciales",
] as const;
export const INTEREST_GROUPS = {
  Skincare: ["Hidratación", "Antiedad", "Luminosidad", "Manchas", "Acné", "Poros"],
  Maquillaje: ["Labial", "Base", "Ojos / Pestañas", "Rubor", "Iluminador"],
  Fragancia: [
    "Floral",
    "Oriental",
    "Amaderada",
    "Cítrica",
    "Gourmand",
    "Almizclada",
    "Aromática",
  ],
} as const;
export const DIAL_CODES = [
  { code: "+52", flag: "🇲🇽", label: "MX" },
  { code: "+1", flag: "🇺🇸", label: "US" },
  { code: "+34", flag: "🇪🇸", label: "ES" },
  { code: "+57", flag: "🇨🇴", label: "CO" },
  { code: "+54", flag: "🇦🇷", label: "AR" },
  { code: "+56", flag: "🇨🇱", label: "CL" },
  { code: "+51", flag: "🇵🇪", label: "PE" },
  { code: "+58", flag: "🇻🇪", label: "VE" },
  { code: "+593", flag: "🇪🇨", label: "EC" },
  { code: "+55", flag: "🇧🇷", label: "BR" },
  { code: "+33", flag: "🇫🇷", label: "FR" },
  { code: "+44", flag: "🇬🇧", label: "GB" },
] as const;
export const CHANNELS = ["WhatsApp", "Email", "SMS"] as const;

const skinSchema = z.object({
  type: z.enum(SKIN_TYPES),
  concerns: z.array(z.string()).max(3, "Selecciona como máximo 3 preocupaciones").default([]),
  tone: z.string().min(1, "Selecciona el tono de piel"),
  /** Subtone is optional at intake — BA can complete it later in Perfil de Belleza. */
  subtone: z.enum(SUBTONES).optional(),
});

export const newClientSchema = z.object({
  firstName: z.string().trim().min(1, "Ingresa el nombre"),
  lastName: z.string().trim().min(1, "Ingresa el apellido"),
  dialCode: z.string().regex(/^\+\d{1,4}$/, "Código de país inválido").default("+52"),
  phone: z.string().regex(/^\d{10}$/, "Teléfono debe tener exactamente 10 dígitos"),
  email: z.string().email("Correo inválido"),
  birthday: z.string().min(1, "Fecha de nacimiento requerida"),
  city: z.string().trim().default("CDMX"),
  gender: z.enum(GENDER_OPTIONS),
  ageRange: z.enum(AGE_RANGES, { errorMap: () => ({ message: "Selecciona un rango de edad" }) }),
  preferredLang: z.enum(["es-MX", "en-US"]).default("es-MX"),
  brands: z.array(z.enum(BRAND_IDS)).min(1, "Asigna al menos una marca"),
  skin: skinSchema,
  routine: z.enum(ROUTINE_LEVELS),
  routineTiming: z.array(z.enum(ROUTINE_TIMINGS)).min(1, "Selecciona al menos un momento"),
  interests: z.array(z.string()).min(1, "Selecciona al menos un interés"),
  allergies: z.array(z.string()).default([]),
  /** Optional at intake — completed in Perfil de Belleza. */
  routineSteps: z.array(z.enum(ROUTINE_STEPS)).optional(),
  /** Soft-positive ingredient tags the client likes. */
  preferredIngredients: z.array(z.string()).optional(),
  /** Soft-negative ingredient tags (not full allergens). */
  avoidedIngredients: z.array(z.string()).optional(),
  consents: z.array(
    z.object({
      channel: z.enum(CHANNELS),
      status: z.enum(["granted", "revoked"]),
    }),
  ),
  acceptPrivacy: z.literal(true, {
    errorMap: () => ({ message: "Debe aceptar el aviso de privacidad" }),
  }),
  /**
   * Firma del cliente capturada en iPad — dataURL PNG base64. Requerida
   * cuando acceptPrivacy === true. La validación práctica vive en la UI
   * (el SignaturePad no permite continuar sin trazo); aquí es defensiva.
   */
  signature: z.string().min(1, "Firma del cliente requerida"),
});

export type NewClientInput = z.infer<typeof newClientSchema>;
