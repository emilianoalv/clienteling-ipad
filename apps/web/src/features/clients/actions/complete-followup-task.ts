"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";
import type { FollowupTaskId } from "@/types/followup-task";

const inputSchema = z.object({
  taskId: z.string().min(1),
  result: z.string().trim().min(1, "Describe el resultado").max(500),
});

export type CompleteFollowupTaskInput = z.infer<typeof inputSchema>;

export interface CompleteFollowupTaskError {
  ok: false;
  fieldErrors?: Record<string, string[]>;
  message?: string;
}

export async function completeFollowupTask(
  raw: CompleteFollowupTaskInput,
): Promise<CompleteFollowupTaskError | void> {
  const { staff } = await requireSession();
  if (!can(staff.role, "clients:write")) return { ok: false, message: "Sin permiso" };

  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const task = await followupTaskRepository.findById(parsed.data.taskId as FollowupTaskId);
  if (!task) return { ok: false, message: "Tarea no encontrada" };

  await followupTaskRepository.complete(task.id, parsed.data.result);

  revalidatePath(`/ba/clients/${task.clientId}`);
}
