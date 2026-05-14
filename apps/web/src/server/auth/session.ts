import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Role, Staff, StaffId } from "@/types/staff";
import { routes } from "@/config/routes";

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

// Placeholder. F4 swaps this for a real repository call.
async function loadStaff(id: string, role: Role): Promise<Staff | null> {
  return {
    id: id as StaffId,
    name: "Demo User",
    initials: "DU",
    brands: ["Lancôme"],
    role,
    storeId: "st-demo" as never,
  } as Staff;
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}
