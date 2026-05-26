import { z } from "zod";

export const STORE_CHAINS = ["Liverpool", "Palacio"] as const;

export const storeSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre de la tienda").max(120),
  chain: z.enum(STORE_CHAINS),
  city: z.string().trim().min(2, "Ingresa la ciudad").max(80),
  address: z.string().trim().min(4, "Ingresa la dirección").max(200),
  monthlyTarget: z
    .number()
    .nonnegative("El objetivo debe ser positivo")
    .max(99_999_999)
    .optional(),
});

export type StoreInput = z.infer<typeof storeSchema>;
