"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { auditEventRepository } from "@/server/repositories/audit-event.repository";
import { userRepository } from "@/server/repositories/user.repository";
import { generateId } from "@/lib/id/generate-id";
import type { BrandId } from "@/types/brand";
import type { StoreId } from "@/types/store";
import type { User, UserId } from "@/types/user";
import { newUserSchema, type NewUserInput } from "../schemas/new-user.schema";

export type CreateUserResult =
  | { ok: true; userId: UserId }
  | { ok: false; fieldErrors?: Record<string, string[]>; message?: string };

/**
 * Server action para alta de usuario desde `/admin/users`.
 *
 * Limitación demo: los usuarios creados aquí viven solo en runtime
 * (memoria del server). Sobreviven HMR en dev pero se pierden al
 * reiniciar el proceso o al cambiar la versión del seed. La UI lo
 * comunica con un badge "Modo demo · se pierde al reiniciar".
 *
 * Cuando Sprint 2 conecte Postgres + Auth.js, esta misma action escribe
 * a la tabla `users` y la persistencia es real — el resto del flujo
 * (validación + bcrypt + UI) no cambia.
 */
export async function createUserAction(raw: NewUserInput): Promise<CreateUserResult> {
  const { staff } = await requireSession();
  if (!can(staff.role, "users:write")) {
    return { ok: false, message: "Sin permiso para crear usuarios" };
  }

  const parsed = newUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const input = parsed.data;

  const existing = await userRepository.findByEmail(input.email);
  if (existing) {
    return { ok: false, fieldErrors: { email: ["Ya existe un usuario con ese correo"] } };
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const id = generateId("us") as UserId;

  const user: User = {
    id,
    name: input.name,
    role: input.role,
    email: input.email,
    passwordHash,
    ...(input.storeId ? { storeId: input.storeId as StoreId } : {}),
    ...(input.brand ? { brand: input.brand as BrandId } : {}),
  };

  await userRepository.create(user);

  await auditEventRepository.create({
    title: "Usuario creado",
    subject: `${user.name} · ${user.role}`,
    actor: `${staff.name} · ${staff.role}`,
  });

  revalidatePath("/admin/users");
  return { ok: true, userId: id };
}
