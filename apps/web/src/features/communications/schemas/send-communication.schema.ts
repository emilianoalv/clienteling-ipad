import { z } from "zod";
import { BRAND_IDS } from "@/types/brand";

export const sendCommunicationSchema = z
  .object({
    clientId: z.string().min(1),
    channel: z.enum(["WhatsApp", "Email", "SMS"]),
    body: z.string().min(1, "El mensaje no puede estar vacío").max(2000),
    brand: z.enum(BRAND_IDS),
    templateId: z.string().optional(),
  })
  .strict();

export type SendCommunicationInput = z.infer<typeof sendCommunicationSchema>;
