import { z } from "zod";
import { BRAND_IDS } from "@/types/brand";

export const GENDER_OPTIONS = ["Femenino", "Masculino", "No binario", "Prefiero no decir"] as const;
export const AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"] as const;
export const SKIN_TYPES = ["Normal", "Seca", "Mixta", "Grasa", "Sensible", "Madura"] as const;
export const ROUTINE_LEVELS = ["Ninguna", "Básica", "Intermedia", "Avanzada", "Profesional"] as const;
export const ROUTINE_TIMINGS = ["morning", "evening", "event"] as const;
export const INTEREST_GROUPS = {
  Skincare: ["Hidratación", "Antiedad", "Luminosidad", "Manchas", "Acné", "Poros"],
  Maquillaje: ["Labial", "Base", "Ojos", "Cejas", "Rubor", "Iluminador"],
  Fragancia: ["Floral", "Oriental", "Amaderada", "Cítrica", "Gourmand", "Almizclada"],
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
  concerns: z.array(z.string()).default([]),
  tone: z.string().default("—"),
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
  consents: z.array(
    z.object({
      channel: z.enum(CHANNELS),
      status: z.enum(["granted", "revoked"]),
    }),
  ),
  acceptPrivacy: z.literal(true, {
    errorMap: () => ({ message: "Debe aceptar el aviso de privacidad" }),
  }),
});

export type NewClientInput = z.infer<typeof newClientSchema>;
