import { z } from "zod";
import { BRAND_IDS } from "@/types/brand";

export const NEW_USER_ROLES = ["BA", "Gerente", "Supervisor", "Admin"] as const;

export const newUserSchema = z
  .object({
    name: z.string().trim().min(2, "Ingresa el nombre completo").max(120),
    email: z.string().trim().toLowerCase().email("Correo inválido").max(180),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(120),
    role: z.enum(NEW_USER_ROLES),
    storeId: z.string().trim().optional(),
    brand: z.enum(BRAND_IDS).optional(),
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

export type NewUserInput = z.infer<typeof newUserSchema>;
