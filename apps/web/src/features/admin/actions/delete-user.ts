"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { auditEventRepository } from "@/server/repositories/audit-event.repository";
import { userRepository } from "@/server/repositories/user.repository";
import type { UserId } from "@/types/user";

export type DeleteUserResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Elimina un usuario. No permite borrarse a uno mismo — el Admin que
 * intenta hacerlo se quedaría sin acceso a su propio panel hasta que
 * otro Admin lo restaure, y eso degrada la demo. El BRD no exige el
 * comportamiento, pero es el mismo guardarail que ponen los productos
 * SaaS serios.
 *
 * Si el usuario era el único Admin, también bloqueamos — no podemos
 * dejar al sistema sin Admin viva.
 */
export async function deleteUserAction(id: UserId): Promise<DeleteUserResult> {
  const { staff } = await requireSession();
  if (!can(staff.role, "users:write")) {
    return { ok: false, message: "Sin permiso para eliminar usuarios" };
  }

  if ((staff.id as unknown as string) === (id as unknown as string)) {
    return { ok: false, message: "No puedes eliminarte a ti mismo." };
  }

  const target = await userRepository.findById(id);
  if (!target) return { ok: false, message: "Usuario no encontrado" };

  if (target.role === "Admin") {
    const all = await userRepository.list();
    const remainingAdmins = all.filter(
      (u) => u.role === "Admin" && (u.id as unknown as string) !== (id as unknown as string),
    ).length;
    if (remainingAdmins === 0) {
      return {
        ok: false,
        message: "No se puede eliminar: es el último Admin activo.",
      };
    }
  }

  await userRepository.delete(id);

  await auditEventRepository.create({
    title: "Usuario eliminado",
    subject: target.name,
    actor: `${staff.name} · ${staff.role}`,
  });

  revalidatePath("/admin/users");
  return { ok: true };
}
