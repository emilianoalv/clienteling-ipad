import { z } from "zod";
import {
  COMMON_CONCERNS,
  ROUTINE_LEVELS,
  ROUTINE_STEPS,
  ROUTINE_TIMINGS,
  SKIN_TYPES,
  SUBTONES,
  TONE_SWATCHES,
} from "./new-client.schema";

/**
 * Schema for the BeautyProfile tab editor. All fields are present so the
 * editor sends the full snapshot in one go, but every field is constrained
 * to its valid set. `skin.subtone`, `routineSteps`, `preferredIngredients`
 * and `avoidedIngredients` remain optional — clientas viejas pueden quedar
 * sin ellos.
 *
 * Tone is validated against the canonical 6-swatch palette. We don't accept
 * arbitrary strings here (unlike new-client.schema which is more lax) to
 * keep the data clean once a BA has the dedicated profile editor.
 */
export const updateBeautyProfileSchema = z.object({
  clientId: z.string().min(1),
  skin: z.object({
    type: z.enum(SKIN_TYPES),
    tone: z.enum(TONE_SWATCHES, {
      errorMap: () => ({ message: "Selecciona un tono válido" }),
    }),
    subtone: z.enum(SUBTONES).optional(),
    concerns: z
      .array(z.enum(COMMON_CONCERNS))
      .max(3, "Máximo 3 preocupaciones prioritarias")
      .default([]),
  }),
  allergies: z.array(z.string()).default([]),
  routine: z.enum(ROUTINE_LEVELS),
  routineTiming: z.array(z.enum(ROUTINE_TIMINGS)).min(1, "Selecciona al menos un momento"),
  routineSteps: z.array(z.enum(ROUTINE_STEPS)).optional(),
  interests: z.array(z.string()).min(1, "Selecciona al menos un interés"),
  preferredIngredients: z.array(z.string()).optional(),
  avoidedIngredients: z.array(z.string()).optional(),
});

export type UpdateBeautyProfileInput = z.infer<typeof updateBeautyProfileSchema>;
