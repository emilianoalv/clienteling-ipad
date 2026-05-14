import { z } from "zod";
import { BRAND_IDS } from "@/types/brand";

export const VISIT_KINDS = [
  "consultation",
  "purchase",
  "sample",
  "courtesy",
  "return",
  "followup",
] as const;

export const VISIT_REASONS = [
  "skincare-consult",
  "new-launch",
  "gift",
  "diagnosis",
  "loyalty-redemption",
  "other",
] as const;

export const registerVisitSchema = z
  .object({
    clientId: z.string().min(1),
    kind: z.enum(VISIT_KINDS),
    reason: z.enum(VISIT_REASONS),
    brand: z.enum(BRAND_IDS),
    notes: z.string().max(500).optional(),
    amount: z.number().positive().optional(),
    durationMin: z.number().int().positive().max(480).optional(),
    skus: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if ((data.kind === "purchase" || data.kind === "return") && data.amount === undefined) {
      ctx.addIssue({
        path: ["amount"],
        code: z.ZodIssueCode.custom,
        message: "Monto requerido para venta o devolución",
      });
    }
    if (data.kind === "sample" && (!data.skus || data.skus.length === 0)) {
      ctx.addIssue({
        path: ["skus"],
        code: z.ZodIssueCode.custom,
        message: "Selecciona al menos un SKU de muestra",
      });
    }
  });

export type RegisterVisitInput = z.infer<typeof registerVisitSchema>;
