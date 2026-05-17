import "server-only";
import type { Appointment } from "@/types/appointment";
import type { Client } from "@/types/client";
import type { FollowupTask } from "@/types/followup-task";
import type { LifeEvent } from "@/types/life-event";
import type { Staff } from "@/types/staff";
import { appointmentRepository } from "@/server/repositories/appointment.repository";
import { clientRepository } from "@/server/repositories/client.repository";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";
import { listUpcomingEvents } from "@/features/clients/services/list-upcoming-events";
import { brandScopeFor, storeScopeFor } from "@/server/auth/scope";

export interface AgendaItem {
  appointment: Appointment;
  clientName: string;
}

export interface UpcomingEventEntry {
  client: Client;
  event: LifeEvent;
}

export interface BaDaySnapshot {
  today: AgendaItem[];
  tomorrow: AgendaItem[];
  upcomingEvents: UpcomingEventEntry[];
  /** Pending follow-up tasks for the BA. Used to drive the "Pendientes" card. */
  pendingTasks: readonly FollowupTask[];
  /** Map clientId → name, for displaying task subtitles. */
  clientLookup: Readonly<Record<string, string>>;
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

  const [todayAppts, tomorrowAppts, clients, pendingTasks] = await Promise.all([
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
    clientRepository.list({ brands, storeIds }),
    followupTaskRepository.listByBA(staff.id, { status: "pending" }),
  ]);

  const clientById = new Map(clients.map((c) => [c.id, c]));
  const resolveName = (a: Appointment) => clientById.get(a.clientId)?.name ?? "—";
  const clientLookup = Object.fromEntries(clients.map((c) => [c.id, c.name])) as Record<
    string,
    string
  >;

  const upcomingEvents = collectUpcomingEvents(clients, now).slice(0, 5);

  return {
    today: todayAppts.map((a) => ({ appointment: a, clientName: resolveName(a) })),
    tomorrow: tomorrowAppts.map((a) => ({ appointment: a, clientName: resolveName(a) })),
    upcomingEvents,
    pendingTasks,
    clientLookup,
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
