import { z } from "zod";

const itemSchema = z.object({
  sku: z.string().min(1),
  qty: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});

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

export const registerSaleSchema = z
  .object({
    clientId: z.string().min(1),
    /** Why the client came in. Captured at the top of the sale form. */
    motive: motiveEnum,
    /** ISO date (YYYY-MM-DD) when the purchase happened. Cannot be in the future. */
    purchaseDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
      .refine(
        (s) => new Date(s + "T00:00:00").getTime() <= new Date().setHours(23, 59, 59, 999),
        { message: "La fecha no puede ser futura" },
      ),
    /** Time of day (HH:mm). Defaults to the current time. */
    purchaseTime: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
    /** Free text for payment detail (e.g. "Visa · 4321"). */
    paymentDetail: z.string().max(80).optional(),
    items: z.array(itemSchema).min(1, "Agrega al menos un producto"),
    payment: z.enum(["card", "cash", "transfer", "store-credit"]),
    ticketRef: z.string().optional(),
    notes: z.string().max(500).optional(),
    /** Optional follow-up task to schedule for after the sale (e.g. post-purchase check-in). */
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
  })
  .superRefine((data, ctx) => {
    const total = data.items.reduce((acc, i) => acc + i.qty * i.unitPrice, 0);
    if (total <= 0) {
      ctx.addIssue({
        path: ["items"],
        code: z.ZodIssueCode.custom,
        message: "El total debe ser mayor a cero",
      });
    }
  });

export type RegisterSaleInput = z.infer<typeof registerSaleSchema>;
