"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { auditEventRepository } from "@/server/repositories/audit-event.repository";
import { userRepository } from "@/server/repositories/user.repository";
import type { UserId } from "@/types/user";

const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(120);

export type ResetPasswordResult =
  | { ok: true }
  | { ok: false; message?: string; fieldError?: string };

/**
 * Reset de contraseña por el Admin (no es self-service todavía). El
 * usuario destino podrá entrar con la nueva contraseña en su próximo
 * login. La acción no invalida sesiones activas — para la demo es
 * aceptable; en producción habría que rotar el secret de la cookie o
 * versionar la sesión.
 */
export async function resetPasswordAction(
  id: UserId,
  newPassword: string,
): Promise<ResetPasswordResult> {
  const { staff } = await requireSession();
  if (!can(staff.role, "users:write")) {
    return { ok: false, message: "Sin permiso para resetear contraseñas" };
  }

  const parsed = passwordSchema.safeParse(newPassword);
  if (!parsed.success) {
    return { ok: false, fieldError: parsed.error.issues[0]?.message };
  }

  const target = await userRepository.findById(id);
  if (!target) return { ok: false, message: "Usuario no encontrado" };

  const passwordHash = await bcrypt.hash(parsed.data, 10);
  await userRepository.update(id, { passwordHash });

  await auditEventRepository.create({
    title: "Contraseña reseteada",
    subject: target.name,
    actor: `${staff.name} · ${staff.role}`,
  });

  revalidatePath("/admin/users");
  return { ok: true };
}
