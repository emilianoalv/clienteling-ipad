import "server-only";
import type { Appointment } from "@/types/appointment";
import type { Client } from "@/types/client";
import type { FollowupTask } from "@/types/followup-task";
import type { LifeEvent } from "@/types/life-event";
import type { Staff } from "@/types/staff";
import { appointmentRepository } from "@/server/repositories/appointment.repository";
import { clientRepository } from "@/server/repositories/client.repository";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { productRepository } from "@/server/repositories/product.repository";
import { listUpcomingEvents } from "@/features/clients/services/list-upcoming-events";
import { assignedBaScopeFor, brandScopeFor, storeScopeFor } from "@/server/auth/scope";
import { ensureBirthdayTasks } from "./ensure-birthday-tasks";

export interface AgendaItem {
  appointment: Appointment;
  clientName: string;
}

export interface UpcomingEventEntry {
  client: Client;
  event: LifeEvent;
}

/**
 * Briefing pre-cita: el contexto que la BA necesita ANTES de que la cliente
 * llegue. Se genera para la próxima cita dentro de la ventana de 2 horas —
 * el horizonte natural de preparación en piso. Si no hay nada en esa
 * ventana, el campo en BaDaySnapshot queda undefined.
 */
export interface NextAppointmentBriefing {
  appointment: Appointment;
  clientId: string;
  clientName: string;
  /** Línea + fecha ISO de la última compra. Para tener algo de qué hablar. */
  lastPurchase?: {
    line: string;
    atIso: string;
  };
  /** Tareas de seguimiento pendientes con esta cliente. */
  pendingTasksWithClient: number;
}

export interface BaDaySnapshot {
  today: AgendaItem[];
  tomorrow: AgendaItem[];
  upcomingEvents: UpcomingEventEntry[];
  /** Pending follow-up tasks for the BA. Used to drive the "Pendientes" card. */
  pendingTasks: readonly FollowupTask[];
  /** Map clientId → name, for displaying task subtitles. */
  clientLookup: Readonly<Record<string, string>>;
  /** Próxima cita dentro de las próximas 2h con briefing — solo si existe. */
  nextAppointmentBriefing?: NextAppointmentBriefing;
}

/**
 * Aggregates everything the BA "Hoy" screen needs in a single round-trip:
 * today's + tomorrow's agenda, plus the top life events across the BA's
 * portfolio (brand-scoped). Replaces prototype `ScreenHome` data fetching.
 */
export async function getBaDaySnapshot(staff: Staff, now = new Date()): Promise<BaDaySnapshot> {
  const startToday = startOfDay(now);
  const startTomorrow = addDays(startToday, 1);
  const startDayAfter = addDays(startToday, 2);
  const storeIds = storeScopeFor(staff);
  const brands = brandScopeFor(staff);

  const [todayAppts, tomorrowAppts, clients] = await Promise.all([
    appointmentRepository.list({
      baId: staff.id,
      brands,
      storeIds,
      from: startToday,
      to: startTomorrow,
    }),
    appointmentRepository.list({
      baId: staff.id,
      brands,
      storeIds,
      from: startTomorrow,
      to: startDayAfter,
    }),
    clientRepository.list({
      brands,
      storeIds,
      assignedBaId: assignedBaScopeFor(staff),
    }),
  ]);

  // Lazy ensure: cada vez que la BA abre Hoy, materializamos tareas de
  // cumpleaños para clientes cuyo cumple cae en los próximos 30 días.
  // Idempotente — no duplica si ya existe una task para este año.
  await ensureBirthdayTasks(staff, clients, now);

  // Listar tasks DESPUÉS de ensure para que las recién creadas aparezcan
  // en este mismo snapshot.
  const pendingTasks = await followupTaskRepository.listByBA(staff.id, {
    status: "pending",
  });

  const clientById = new Map(clients.map((c) => [c.id, c]));
  const resolveName = (a: Appointment) => clientById.get(a.clientId)?.name ?? "—";
  const clientLookup = Object.fromEntries(clients.map((c) => [c.id, c.name])) as Record<
    string,
    string
  >;

  const upcomingEvents = collectUpcomingEvents(clients, now).slice(0, 5);

  // Briefing pre-cita: tomamos la próxima cita en la ventana de 2 h
  // (incluye las que ya empezaron pero llevan <30 min de retraso — la BA
  // aún necesita el briefing si la cliente está llegando) y cargamos
  // contexto: última compra registrada de la cliente y conteo de
  // seguimientos pendientes con ella. Solo una query a purchases.
  const nextAppointmentBriefing = await buildNextAppointmentBriefing(
    todayAppts,
    resolveName,
    pendingTasks,
    now,
  );

  return {
    today: todayAppts.map((a) => ({ appointment: a, clientName: resolveName(a) })),
    tomorrow: tomorrowAppts.map((a) => ({ appointment: a, clientName: resolveName(a) })),
    upcomingEvents,
    pendingTasks,
    clientLookup,
    ...(nextAppointmentBriefing ? { nextAppointmentBriefing } : {}),
  };
}

const BRIEFING_WINDOW_MIN = 120; // 2 h hacia adelante
const GRACE_LATE_MIN = 30; // tolerancia hacia atrás para citas en curso

async function buildNextAppointmentBriefing(
  todayAppts: readonly Appointment[],
  resolveName: (a: Appointment) => string,
  pendingTasks: readonly FollowupTask[],
  now: Date,
): Promise<NextAppointmentBriefing | undefined> {
  const nowMs = now.getTime();
  const minMs = nowMs - GRACE_LATE_MIN * 60_000;
  const maxMs = nowMs + BRIEFING_WINDOW_MIN * 60_000;

  // Solo citas que estén "activas" en la ventana — descartamos las que ya
  // terminaron (completed/cancelled/no-show) o quedan muy lejos.
  const candidate = todayAppts
    .filter((a) => {
      if (a.status === "completed" || a.status === "cancelled" || a.status === "no-show") {
        return false;
      }
      const t = Date.parse(a.at);
      return !Number.isNaN(t) && t >= minMs && t <= maxMs;
    })
    .sort((a, b) => a.at.localeCompare(b.at))[0];

  if (!candidate) return undefined;

  const clientId = candidate.clientId as unknown as string;
  const clientName = resolveName(candidate);

  const purchases = await purchaseRepository.listByClient(candidate.clientId);
  const lastPurchase = purchases[0];
  let lastPurchaseLine: string | undefined;
  if (lastPurchase && lastPurchase.items.length > 0) {
    const firstSku = lastPurchase.items[0]!.sku;
    const product = await productRepository.findBySku(firstSku);
    lastPurchaseLine = product?.line ?? (firstSku as unknown as string);
  }

  const pendingTasksWithClient = pendingTasks.filter(
    (t) => (t.clientId as unknown as string) === clientId,
  ).length;

  return {
    appointment: candidate,
    clientId,
    clientName,
    ...(lastPurchase && lastPurchaseLine
      ? { lastPurchase: { line: lastPurchaseLine, atIso: lastPurchase.at } }
      : {}),
    pendingTasksWithClient,
  };
}

function collectUpcomingEvents(clients: readonly Client[], now: Date): UpcomingEventEntry[] {
  const out: UpcomingEventEntry[] = [];
  for (const client of clients) {
    for (const event of listUpcomingEvents(client, { windowDays: 45, now })) {
      if (event.daysUntil >= 0) out.push({ client, event });
    }
  }
  return out.sort((a, b) => a.event.daysUntil - b.event.daysUntil);
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
