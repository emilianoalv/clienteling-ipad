import { z } from "zod";
import { BRAND_IDS } from "@/types/brand";

export const APPOINTMENT_KINDS = [
  "ritual",
  "makeup",
  "diagnosis",
  "consultation",
  "vip-cabin",
  "facial",
  "anniversary-event",
  "product-followup",
  "fragrance-consult",
  "other",
] as const;

export const newAppointmentSchema = z.object({
  clientId: z.string().min(1, "Selecciona un cliente"),
  baId: z.string().min(1, "Selecciona un Beauty Advisor"),
  brand: z.enum(BRAND_IDS),
  /** Local date YYYY-MM-DD (from <input type="date">). */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  /** Local time HH:MM (from <input type="time">). */
  time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
  durationMin: z.number().int().positive().max(240).default(45),
  kind: z.enum(APPOINTMENT_KINDS),
  notes: z.string().max(500).optional(),
});

export type NewAppointmentInput = z.infer<typeof newAppointmentSchema>;
