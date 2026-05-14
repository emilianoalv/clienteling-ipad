import { z } from "zod";

const itemSchema = z.object({
  sku: z.string().min(1),
  qty: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});

export const registerSaleSchema = z
  .object({
    clientId: z.string().min(1),
    at: z.string().datetime().optional(),
    items: z.array(itemSchema).min(1, "Agrega al menos un producto"),
    payment: z.enum(["card", "cash", "transfer", "store-credit"]),
    ticketRef: z.string().optional(),
    notes: z.string().max(500).optional(),
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
