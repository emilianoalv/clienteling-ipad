"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSession } from "@/server/auth/session";
import { homeFor } from "@/config/routes";
import { auditEventRepository } from "@/server/repositories/audit-event.repository";
import { userRepository } from "@/server/repositories/user.repository";
import type { StaffId } from "@/types/staff";

const inputSchema = z.object({
  email: z.string().trim().email("Correo inválido").max(180),
  password: z.string().min(1, "Ingresa tu contraseña").max(120),
});

export type SignInResult =
  | { ok: true; redirectTo: string }
  | { ok: false; reason: "invalid_credentials" }
  | { ok: false; reason: "invalid_input"; message?: string };

/**
 * Login real simulado (Sprint 1.2). Busca usuario por email + valida
 * password con bcrypt contra el hash del seed.
 *
 * Decisión de diseño: devolvemos `redirectTo` en el resultado en vez
 * de llamar `redirect()` server-side. Razón: Next 15 + Server Actions
 * tiene un bug conocido donde el client a veces no procesa el
 * `NEXT_REDIRECT` correctamente para ciertas rutas (ej. /supervisor,
 * /admin con muchas queries paralelas), terminando en consola roja y
 * el form colgado sin navegar. Hacer `router.push()` desde el cliente
 * es 100% determinista.
 *
 * Mensaje genérico "Correo o contraseña incorrectos" tanto si el email
 * no existe como si la password falla (evita enumeración de cuentas).
 */
export async function signInAction(input: {
  email: string;
  password: string;
}): Promise<SignInResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      reason: "invalid_input",
      message: parsed.error.issues[0]?.message,
    };
  }

  const user = await userRepository.findByEmail(parsed.data.email);
  if (!user) {
    await auditEventRepository.create({
      title: "Login fallido",
      subject: parsed.data.email,
      actor: "sistema",
    });
    return { ok: false, reason: "invalid_credentials" };
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    await auditEventRepository.create({
      title: "Login fallido",
      subject: user.email,
      actor: "sistema",
    });
    return { ok: false, reason: "invalid_credentials" };
  }

  await createSession(user.id as unknown as StaffId, user.role);

  await auditEventRepository.create({
    title: "Inicio de sesión",
    subject: user.name,
    actor: `${user.name} · ${user.role}`,
  });

  return { ok: true, redirectTo: homeFor(user.role) };
}
