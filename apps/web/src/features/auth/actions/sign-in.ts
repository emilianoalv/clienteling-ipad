"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession } from "@/server/auth/session";
import { homeFor } from "@/config/routes";
import type { Role, StaffId } from "@/types/staff";

const inputSchema = z.object({
  role: z.enum(["BA", "Manager", "Supervisor", "HQ", "Admin"]),
  pin: z.string().regex(/^\d{6}$/),
});

export type SignInResult =
  | { ok: true }
  | { ok: false; reason: "wrong_pin"; attemptsLeft: number }
  | { ok: false; reason: "locked"; minutesLeft: number }
  | { ok: false; reason: "invalid_input" };

/**
 * Demo sign-in that accepts any 6-digit PIN.
 * Real lockout + PIN verification lives in F4 of the migration plan.
 */
export async function signInAction(input: { role: Role; pin: string }): Promise<SignInResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid_input" };

  // F4: replace this with a real lookup + lockout policy.
  const userId = `demo-${parsed.data.role.toLowerCase()}` as StaffId;
  await createSession(userId, parsed.data.role);

  redirect(homeFor(parsed.data.role));
}
