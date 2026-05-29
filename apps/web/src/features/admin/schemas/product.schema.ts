import { z } from "zod";
import { BRAND_IDS } from "@/types/brand";

/**
 * Schema para alta y edición de productos del catálogo. Solo expone
 * los campos "core" que el equipo de Marketing CRM mantiene desde la
 * UI: identidad, comercial básica, lifecycle. Atributos finos
 * (concerns, ingredientes, ficha técnica) y el stock por tienda
 * quedan fuera — stock viene del POS (RF-22), no se edita aquí; los
 * atributos son trabajo de catálogo profundo de Sprint 2.
 */
export const productSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(2, "SKU requerido")
    .max(40)
    .regex(/^[A-Z0-9\-]+$/i, "Solo letras, números y guiones"),
  brand: z.enum(BRAND_IDS),
  line: z.string().trim().min(2, "Ingresa la línea").max(80),
  name: z.string().trim().min(2, "Ingresa el nombre comercial").max(120),
  size: z.string().trim().min(1, "Ingresa la presentación").max(40),
  price: z.number().positive("El precio debe ser mayor a 0").max(99_999_999),
  category: z.string().trim().min(2, "Ingresa la categoría").max(40),
  lifecycleDays: z
    .number()
    .int()
    .positive("Días de vida útil debe ser positivo")
    .max(3_650),
});

export type ProductInput = z.infer<typeof productSchema>;
