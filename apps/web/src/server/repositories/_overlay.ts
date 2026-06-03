import "server-only";
import { cookies } from "next/headers";
import type { Appointment } from "@/types/appointment";
import type { Client } from "@/types/client";
import type { Communication } from "@/types/communication";
import type { Interaction } from "@/types/interaction";
import type { Purchase } from "@/types/purchase";
import type { Recommendation } from "@/types/recommendation";
import type { Sample } from "@/types/sample";
import type { FollowupTask } from "@/types/followup-task";

/**
 * Demo-only persistence overlay backed by HTTP-only cookies.
 *
 * El backend canónico es in-memory (`globalThis`). En Vercel serverless cada
 * request puede caer en una instancia distinta, por lo que un purchase creado
 * en el lambda A es invisible para el lambda B → la venta "desaparece" al
 * navegar. Para una demo sin DB externa, guardamos las escrituras también
 * en cookies HTTP-only del propio usuario: viajan con cada request → todos
 * los lambdas las ven.
 *
 * Trade-offs aceptables para demo:
 * - Cookie por tipo (~4KB cada una), capped a 10 entradas.
 * - Per-browser: si dos BAs comparten dispositivo, ven el mismo overlay
 *   (consistente con cómo opera el iPad físico).
 * - 7 días de TTL.
 *
 * En producción real esto se reemplaza por Vercel KV / Postgres.
 */

const MAX_PER_TYPE = 10;
// Clients tienen muchos campos (skin profile, preferences, etc.) — el JSON
// pesa ~800 bytes/cliente. 5 entries caben holgadas en 4KB de cookie.
const MAX_CLIENTS = 5;
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

type Bucket = "pu" | "rc" | "sp" | "in" | "ft" | "cl" | "co" | "ap";

const COOKIE_NAMES: Record<Bucket, string> = {
  pu: "__cl_ov_pu",
  rc: "__cl_ov_rc",
  sp: "__cl_ov_sp",
  in: "__cl_ov_in",
  ft: "__cl_ov_ft",
  cl: "__cl_ov_cl",
  co: "__cl_ov_co",
  ap: "__cl_ov_ap",
};

type BucketType = {
  pu: Purchase;
  rc: Recommendation;
  sp: Sample;
  in: Interaction;
  ft: FollowupTask;
  cl: Client;
  co: Communication;
  ap: Appointment;
};

const BUCKET_MAX: Record<Bucket, number> = {
  pu: MAX_PER_TYPE,
  rc: MAX_PER_TYPE,
  sp: MAX_PER_TYPE,
  in: MAX_PER_TYPE,
  ft: MAX_PER_TYPE,
  cl: MAX_CLIENTS,
  co: MAX_PER_TYPE,
  ap: MAX_PER_TYPE,
};

async function readBucket<B extends Bucket>(bucket: B): Promise<BucketType[B][]> {
  try {
    const store = await cookies();
    const raw = store.get(COOKIE_NAMES[bucket])?.value;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BucketType[B][]) : [];
  } catch {
    return [];
  }
}

async function writeBucket<B extends Bucket>(
  bucket: B,
  items: readonly BucketType[B][],
): Promise<void> {
  try {
    const store = await cookies();
    const trimmed = items.slice(0, BUCKET_MAX[bucket]);
    store.set(COOKIE_NAMES[bucket], JSON.stringify(trimmed), {
      maxAge: MAX_AGE_SEC,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  } catch {
    // Cookies no se pueden setear en server components — solo en actions.
    // Si esto ocurre durante un render, lo ignoramos silenciosamente; el
    // caller correcto (server action) ya lo guardó.
  }
}

export async function readOverlayPurchases(): Promise<Purchase[]> {
  return readBucket("pu");
}
export async function readOverlayRecommendations(): Promise<Recommendation[]> {
  return readBucket("rc");
}
export async function readOverlaySamples(): Promise<Sample[]> {
  return readBucket("sp");
}
export async function readOverlayInteractions(): Promise<Interaction[]> {
  return readBucket("in");
}
export async function readOverlayFollowupTasks(): Promise<FollowupTask[]> {
  return readBucket("ft");
}
export async function readOverlayClients(): Promise<Client[]> {
  return readBucket("cl");
}
export async function readOverlayCommunications(): Promise<Communication[]> {
  return readBucket("co");
}
export async function readOverlayAppointments(): Promise<Appointment[]> {
  return readBucket("ap");
}

export async function appendOverlayPurchase(item: Purchase): Promise<void> {
  const current = await readBucket("pu");
  await writeBucket("pu", [item, ...current.filter((p) => p.id !== item.id)]);
}
export async function appendOverlayRecommendation(item: Recommendation): Promise<void> {
  const current = await readBucket("rc");
  await writeBucket("rc", [item, ...current.filter((r) => r.id !== item.id)]);
}
export async function appendOverlaySample(item: Sample): Promise<void> {
  const current = await readBucket("sp");
  await writeBucket("sp", [item, ...current.filter((s) => s.id !== item.id)]);
}
export async function appendOverlayInteraction(item: Interaction): Promise<void> {
  const current = await readBucket("in");
  await writeBucket("in", [item, ...current.filter((i) => i.id !== item.id)]);
}
export async function appendOverlayFollowupTask(item: FollowupTask): Promise<void> {
  const current = await readBucket("ft");
  await writeBucket("ft", [item, ...current.filter((t) => t.id !== item.id)]);
}
export async function upsertOverlayClient(item: Client): Promise<void> {
  const current = await readBucket("cl");
  await writeBucket("cl", [item, ...current.filter((c) => c.id !== item.id)]);
}
export async function appendOverlayCommunication(item: Communication): Promise<void> {
  const current = await readBucket("co");
  await writeBucket("co", [item, ...current.filter((m) => m.id !== item.id)]);
}
export async function upsertOverlayAppointment(item: Appointment): Promise<void> {
  const current = await readBucket("ap");
  await writeBucket("ap", [item, ...current.filter((a) => a.id !== item.id)]);
}

/**
 * Patch in-place: si el item está en el overlay lo reemplaza, si no lo
 * agrega. Útil para markConverted / patch (no queremos duplicar).
 */
export async function upsertOverlayRecommendation(item: Recommendation): Promise<void> {
  const current = await readBucket("rc");
  const next = [item, ...current.filter((r) => r.id !== item.id)];
  await writeBucket("rc", next);
}
export async function upsertOverlaySample(item: Sample): Promise<void> {
  const current = await readBucket("sp");
  const next = [item, ...current.filter((s) => s.id !== item.id)];
  await writeBucket("sp", next);
}
