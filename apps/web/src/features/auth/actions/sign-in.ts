"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession } from "@/server/auth/session";
import { homeFor } from "@/config/routes";
import { userRepository } from "@/server/repositories/user.repository";
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
 * Demo sign-in that accepts any 6-digit PIN and logs in as the first seeded
 * user with the chosen role. Real lockout + PIN verification lives in F4.
 *
 * Looking up by role (instead of using a hardcoded `demo-{role}` id) means the
 * staff returned by `requireSession()` has real `storeId` / `storeIds` from
 * the user seed, which is what powers multi-store scope.
 */
export async function signInAction(input: { role: Role; pin: string }): Promise<SignInResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid_input" };

  const user = await userRepository.findFirstByRole(parsed.data.role);
  if (!user) return { ok: false, reason: "invalid_input" };

  await createSession(user.id as unknown as StaffId, parsed.data.role);

  redirect(homeFor(parsed.data.role));
}
