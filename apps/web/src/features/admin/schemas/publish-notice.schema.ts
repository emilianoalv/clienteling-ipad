import { z } from "zod";

export const publishNoticeSchema = z.object({
  version: z
    .string()
    .trim()
    .min(3, "Formato esperado tipo v2026.04")
    .max(20)
    .regex(/^v\d{4}\.\d{2}(\.\d+)?$/, "Usa el formato vYYYY.MM o vYYYY.MM.N"),
  changeSummary: z.string().trim().max(500).optional(),
});

export type PublishNoticeInput = z.infer<typeof publishNoticeSchema>;
