"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession } from "@/server/auth/session";
import { homeFor } from "@/config/routes";
import { userRepository } from "@/server/repositories/user.repository";
import type { StaffId } from "@/types/staff";

const inputSchema = z.object({
  email: z.string().trim().email("Correo inválido").max(180),
  password: z.string().min(1, "Ingresa tu contraseña").max(120),
});

export type SignInResult =
  | { ok: true }
  | { ok: false; reason: "invalid_credentials" }
  | { ok: false; reason: "invalid_input"; message?: string };

/**
 * Login real simulado (Sprint 1.2). Busca usuario por email + valida
 * password con bcrypt contra el hash del seed. Cada usuario tiene su
 * propia credencial — ya no hay selector de roles ni PIN compartido.
 *
 * Las credenciales viven en código (seed `user.repository.ts`) por
 * ahora; cuando Sprint 2 conecte Postgres, lo único que cambia aquí
 * es el lookup — el resto del flujo se mantiene idéntico.
 *
 * Por seguridad básica: mensaje genérico "Correo o contraseña
 * incorrectos" tanto si el email no existe como si la password falla
 * (evita enumeración de cuentas válidas).
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
  if (!user) return { ok: false, reason: "invalid_credentials" };

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return { ok: false, reason: "invalid_credentials" };

  await createSession(user.id as unknown as StaffId, user.role);

  redirect(homeFor(user.role));
}
