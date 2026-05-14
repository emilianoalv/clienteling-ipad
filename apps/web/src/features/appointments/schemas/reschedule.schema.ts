import { z } from "zod";

export const rescheduleSchema = z.object({
  appointmentId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
});

export type RescheduleInput = z.infer<typeof rescheduleSchema>;

export const cancelSchema = z.object({
  appointmentId: z.string().min(1),
  reason: z.string().max(500).optional(),
});

export type CancelInput = z.infer<typeof cancelSchema>;
