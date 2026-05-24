"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";
import type { ClientId } from "@/types/client";

const inputSchema = z.object({
  clientId: z.string().min(1),
  type: z.enum(["call", "whatsapp", "email", "sample-feedback", "appointment", "other"]),
  category: z.enum([
    "3-month-check",
    "6-month-check",
    "birthday",
    "replenishment",
    "special-event",
    "sample-feedback",
    "post-purchase",
    "general",
  ]),
  description: z.string().trim().min(1, "Describe la tarea").max(500),
  dueAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
    .refine(
      (s) => new Date(s + "T00:00:00").getTime() >= new Date().setHours(0, 0, 0, 0),
      { message: "La fecha no puede ser pasada" },
    ),
});

export type CreateFollowupTaskInput = z.infer<typeof inputSchema>;

export interface CreateFollowupTaskError {
  ok: false;
  fieldErrors?: Record<string, string[]>;
  message?: string;
}

export async function createFollowupTask(
  raw: CreateFollowupTaskInput,
): Promise<CreateFollowupTaskError | void> {
  const { staff } = await requireSession();
  if (!can(staff.role, "clients:write")) return { ok: false, message: "Sin permiso" };

  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const input = parsed.data;
  const clientId = input.clientId as ClientId;

  await followupTaskRepository.create({
    clientId,
    baId: staff.id,
    type: input.type,
    category: input.category,
    description: input.description,
    dueAt: new Date(`${input.dueAt}T12:00:00`).toISOString(),
  });

  revalidatePath(`/ba/clients/${clientId}`);
}
