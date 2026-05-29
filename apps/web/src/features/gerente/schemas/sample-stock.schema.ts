import { z } from "zod";

/**
 * Ajuste de inventario de muestras. `have` es el stock actual físico
 * (lo que hay en cajón) y `capacity` es la meta a la que se quiere
 * llegar — sirve para que el progress bar tenga punto de referencia.
 * Ambos son enteros no-negativos y se acotan a un techo generoso pero
 * realista (5,000 por SKU) para evitar inputs disparatados.
 */
export const sampleStockSchema = z.object({
  have: z.number().int().min(0, "El stock no puede ser negativo").max(5_000),
  capacity: z.number().int().min(0, "La capacidad no puede ser negativa").max(5_000),
});

export type SampleStockInput = z.infer<typeof sampleStockSchema>;
