import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Role, Staff, StaffId } from "@/types/staff";
import type { User, UserId } from "@/types/user";
import { routes } from "@/config/routes";
import { userRepository } from "@/server/repositories/user.repository";

const SESSION_COOKIE = "session";
const SESSION_TTL_HOURS = 12;

const sessionSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["BA", "Manager", "Supervisor", "HQ", "Admin"]),
  issuedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export type SessionPayload = z.infer<typeof sessionSchema>;

/**
 * Mints a new session and writes it as an httpOnly cookie.
 *
 * NOTE: this is the boundary that replaces the prototype's `LxAuth.login`.
 * In production swap the JSON encoding for a signed JWT/Iron session.
 */
export async function createSession(userId: StaffId, role: Role): Promise<SessionPayload> {
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_TTL_HOURS * 3_600_000);

  const payload: SessionPayload = {
    userId,
    role,
    issuedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires,
    path: "/",
  });

  return payload;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const parsed = sessionSchema.safeParse(safeJson(raw));
  if (!parsed.success) return null;
  if (new Date(parsed.data.expiresAt) < new Date()) return null;
  return parsed.data;
}

/** Use inside Server Components. Redirects to /login if missing or expired. */
export async function requireSession(): Promise<{ session: SessionPayload; staff: Staff }> {
  const session = await getSession();
  if (!session) redirect(routes.login);

  const staff = await loadStaff(session.userId, session.role);
  if (!staff) redirect(routes.login);

  return { session, staff };
}

/**
 * Loads a Staff from the user repository and maps it to the discriminated
 * Staff union. Returns null if the user doesn't exist or if the role doesn't
 * match what's in the session (defensive — should never happen unless a user
 * was deleted mid-session).
 */
async function loadStaff(id: string, role: Role): Promise<Staff | null> {
  const user = await userRepository.findById(id as UserId);
  if (!user || user.role !== role) return null;
  return userToStaff(user);
}

/**
 * Converts a User record into the discriminated Staff union.
 * Returns null if required role-specific fields are missing in the user record.
 */
export function userToStaff(user: User): Staff | null {
  const base = {
    id: user.id as unknown as StaffId,
    name: user.name,
    initials: initialsOf(user.name),
    brands: user.brands,
  };
  switch (user.role) {
    case "BA":
      if (!user.storeId) return null;
      return { ...base, role: "BA", storeId: user.storeId };
    case "Manager":
      if (!user.storeId) return null;
      return { ...base, role: "Manager", storeId: user.storeId };
    case "Supervisor":
      if (!user.storeIds) return null;
      return { ...base, role: "Supervisor", storeIds: user.storeIds };
    case "HQ":
      return { ...base, role: "HQ" };
    case "Admin":
      return { ...base, role: "Admin" };
  }
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "??";
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
