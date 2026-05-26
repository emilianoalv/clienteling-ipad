"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { auditEventRepository } from "@/server/repositories/audit-event.repository";
import { storeRepository } from "@/server/repositories/store.repository";
import { userRepository } from "@/server/repositories/user.repository";
import type { StoreId } from "@/types/store";

export type DeleteStoreResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Borrar una tienda es delicado porque puede dejar a sus BAs / Gerentes
 * huérfanos (la session.staff los pone fuera de scope al recargar). Para
 * la demo es aceptable: bloqueamos el delete si todavía hay usuarios
 * activos asignados — el Admin debe reasignarlos primero.
 */
export async function deleteStoreAction(id: StoreId): Promise<DeleteStoreResult> {
  const { staff } = await requireSession();
  if (!can(staff.role, "stores:write")) {
    return { ok: false, message: "Sin permiso para eliminar tiendas" };
  }

  const store = await storeRepository.findById(id);
  if (!store) return { ok: false, message: "Tienda no encontrada" };

  const users = await userRepository.list();
  const tied = users.filter(
    (u) =>
      u.storeId === id ||
      (u.storeIds && u.storeIds.includes(id)),
  );
  if (tied.length > 0) {
    return {
      ok: false,
      message: `No se puede eliminar: ${tied.length} usuario(s) tienen esta tienda asignada. Reasígnalos primero.`,
    };
  }

  await storeRepository.delete(id);

  await auditEventRepository.create({
    title: "Tienda eliminada",
    subject: store.name,
    actor: `${staff.name} · ${staff.role}`,
  });

  revalidatePath("/admin/stores");
  revalidatePath("/admin");
  return { ok: true };
}
