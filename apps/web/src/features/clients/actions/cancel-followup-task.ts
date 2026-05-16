"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";
import type { FollowupTaskId } from "@/types/followup-task";

export interface CancelFollowupTaskError {
  ok: false;
  message?: string;
}

export async function cancelFollowupTask(
  taskId: string,
): Promise<CancelFollowupTaskError | void> {
  const { staff } = await requireSession();
  if (!can(staff.role, "clients:write")) return { ok: false, message: "Sin permiso" };

  const task = await followupTaskRepository.findById(taskId as FollowupTaskId);
  if (!task) return { ok: false, message: "Tarea no encontrada" };

  await followupTaskRepository.cancel(task.id);

  revalidatePath(`/ba/clients/${task.clientId}`);
}
