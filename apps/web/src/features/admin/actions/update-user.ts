"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { auditEventRepository } from "@/server/repositories/audit-event.repository";
import { userRepository } from "@/server/repositories/user.repository";
import type { BrandId } from "@/types/brand";
import type { StoreId } from "@/types/store";
import type { User, UserId } from "@/types/user";
import { editUserSchema, type EditUserInput } from "../schemas/edit-user.schema";

export type UpdateUserResult =
  | { ok: true }
  | { ok: false; fieldErrors?: Record<string, string[]>; message?: string };

/**
 * Edita un usuario existente. Permite cambiar nombre, email, rol,
 * tienda, marca y objetivo mensual. La contraseña se maneja en una
 * acción aparte (`resetPasswordAction`) — separarlas evita exponer
 * accidentalmente el campo password en el form de edición.
 *
 * Limpia los campos de scope cuando el rol cambia: Supervisor/Admin
 * no tienen storeId, BA no aplica si pasa a Gerente, etc.
 */
export async function updateUserAction(
  id: UserId,
  raw: EditUserInput,
): Promise<UpdateUserResult> {
  const { staff } = await requireSession();
  if (!can(staff.role, "users:write")) {
    return { ok: false, message: "Sin permiso para editar usuarios" };
  }

  const parsed = editUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const input = parsed.data;

  const current = await userRepository.findById(id);
  if (!current) return { ok: false, message: "Usuario no encontrado" };

  // Detecta colisión de email si cambió.
  if (input.email.toLowerCase() !== current.email.toLowerCase()) {
    const collision = await userRepository.findByEmail(input.email);
    if (collision && collision.id !== id) {
      return {
        ok: false,
        fieldErrors: { email: ["Ya existe un usuario con ese correo"] },
      };
    }
  }

  // Construye el patch limpiando campos que no aplican al nuevo rol.
  const patch: Partial<Omit<User, "id">> = {
    name: input.name,
    email: input.email,
    role: input.role,
    storeId:
      input.role === "BA" || input.role === "Gerente"
        ? (input.storeId as StoreId | undefined)
        : undefined,
    brand: input.role === "BA" ? (input.brand as BrandId | undefined) : undefined,
    monthlyTarget:
      input.role === "BA" && input.monthlyTarget !== undefined
        ? input.monthlyTarget
        : undefined,
  };

  const updated = await userRepository.update(id, patch);
  if (!updated) return { ok: false, message: "Usuario no encontrado" };

  await auditEventRepository.create({
    title: "Usuario editado",
    subject: updated.name,
    actor: `${staff.name} · ${staff.role}`,
  });

  revalidatePath("/admin/users");
  return { ok: true };
}
