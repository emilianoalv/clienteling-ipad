import { z } from "zod";
import { BRAND_IDS } from "@/types/brand";
import { NEW_USER_ROLES } from "./new-user.schema";

/**
 * Schema para editar un usuario. A diferencia de `newUserSchema` no
 * pide password — eso es un flujo aparte (resetPasswordAction). El
 * resto sigue las mismas reglas de scope: BA requiere store + brand,
 * Gerente requiere store, Supervisor / Admin pueden no tener tienda.
 */
export const editUserSchema = z
  .object({
    name: z.string().trim().min(2, "Ingresa el nombre completo").max(120),
    email: z.string().trim().toLowerCase().email("Correo inválido").max(180),
    role: z.enum(NEW_USER_ROLES),
    storeId: z.string().trim().optional(),
    brand: z.enum(BRAND_IDS).optional(),
    monthlyTarget: z
      .number()
      .nonnegative("El objetivo debe ser positivo")
      .max(99_999_999)
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (val.role === "BA") {
      if (!val.storeId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["storeId"],
          message: "BA requiere tienda asignada",
        });
      }
      if (!val.brand) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["brand"],
          message: "BA requiere marca asignada",
        });
      }
    }
    if (val.role === "Gerente" && !val.storeId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["storeId"],
        message: "Gerente requiere tienda asignada",
      });
    }
  });

export type EditUserInput = z.infer<typeof editUserSchema>;
