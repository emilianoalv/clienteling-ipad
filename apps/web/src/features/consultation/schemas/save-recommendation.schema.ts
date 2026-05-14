import { z } from "zod";

export const SKIN_TYPES = ["Seca", "Normal", "Mixta", "Grasa"] as const;
export const TONES = [
  "Muy claro",
  "Claro",
  "Medio",
  "Medio cálido",
  "Oscuro",
  "Muy oscuro",
] as const;

export const saveRecommendationSchema = z
  .object({
    clientId: z.string().min(1),
    skinType: z.enum(SKIN_TYPES),
    concerns: z.array(z.string().min(1)).min(1, "Selecciona al menos un concern").max(3),
    tone: z.enum(TONES),
    items: z.array(z.string().min(1)).min(1, "Agrega al menos un producto"),
  })
  .strict();

export type SaveRecommendationInput = z.infer<typeof saveRecommendationSchema>;
export type SkinType = (typeof SKIN_TYPES)[number];
export type Tone = (typeof TONES)[number];
