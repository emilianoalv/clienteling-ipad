import { z } from "zod";

const motiveEnum = z.enum([
  "new-purchase",
  "repurchase",
  "gift",
  "concern",
  "promo",
  "browse",
]);

const followupTypeEnum = z.enum([
  "call",
  "whatsapp",
  "email",
  "sample-feedback",
  "appointment",
  "other",
]);

/**
 * Visit form input. Distinct from the sale form: no products with prices, no
 * payment. Optional outcomes are captured inline (samples given, recommendations
 * made) plus an optional follow-up task.
 *
 * `kind` is derived server-side from the outcomes:
 *  - any `samples`        → "sample"
 *  - any `recommendations`→ "consultation"
 *  - neither              → "courtesy"
 */
export const registerVisitSchema = z.object({
  clientId: z.string().min(1),
  motive: motiveEnum,
  notes: z.string().max(500).optional(),
  durationMin: z.number().int().positive().max(480).optional(),
  /** SKUs of samples given during the visit. */
  samples: z.array(z.string().min(1)).default([]),
  /** SKUs of products recommended (without sale) during the visit. */
  recommendations: z.array(z.string().min(1)).default([]),
  /** Optional follow-up task to schedule after the visit. */
  followup: z
    .object({
      type: followupTypeEnum,
      description: z.string().trim().min(1, "Describe la tarea"),
      dueAt: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
        .refine(
          (s) => new Date(s + "T00:00:00").getTime() >= new Date().setHours(0, 0, 0, 0),
          { message: "La fecha no puede ser pasada" },
        ),
    })
    .optional(),
});

export type RegisterVisitInput = z.infer<typeof registerVisitSchema>;
