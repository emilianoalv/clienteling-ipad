import type { Client } from "@/types/client";
import type { LifeEvent, LifeEventKind } from "@/types/life-event";

interface ListOptions {
  /** Days into the future to consider. Default 60. */
  windowDays?: number;
  now?: Date;
}

const DAY_MS = 86_400_000;

/**
 * Returns life-relevant events for a client over the next `windowDays`:
 * birthday, anniversary, possible replenishment (if `lastPurchase` is known).
 *
 * Pure function — testable in isolation.
 */
export function listUpcomingEvents(client: Client, opts: ListOptions = {}): LifeEvent[] {
  const now = opts.now ?? new Date();
  const windowDays = opts.windowDays ?? 60;

  const events: LifeEvent[] = [];

  const birthday = nextAnniversary(client.birthday, now);
  if (birthday) {
    const days = daysBetween(now, birthday);
    if (days <= windowDays) events.push(makeEvent("birthday", birthday, days, "Cumpleaños"));
  }

  if (client.since) {
    const anniv = nextAnniversary(client.since, now);
    if (anniv) {
      const days = daysBetween(now, anniv);
      if (days <= windowDays && days !== 0) {
        events.push(makeEvent("anniversary", anniv, days, "Aniversario como clienta"));
      }
    }
  }

  if (client.stats.lastPurchase) {
    const replen = new Date(client.stats.lastPurchase);
    replen.setDate(replen.getDate() + 60);
    const days = daysBetween(now, replen);
    if (Math.abs(days) <= windowDays) {
      events.push(makeEvent("replenishment", replen, days, "Posible reposición"));
    }
  }

  return events.sort((a, b) => a.daysUntil - b.daysUntil);
}

function nextAnniversary(iso: string, now: Date): Date | null {
  const original = new Date(iso);
  if (Number.isNaN(original.getTime())) return null;
  const candidate = new Date(now.getFullYear(), original.getMonth(), original.getDate());
  if (candidate < startOfDay(now)) candidate.setFullYear(candidate.getFullYear() + 1);
  return candidate;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
}

function makeEvent(kind: LifeEventKind, date: Date, daysUntil: number, label: string): LifeEvent {
  return { kind, date: date.toISOString(), daysUntil, label };
}
