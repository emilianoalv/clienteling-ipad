import type { Ticket, TicketCategory } from "@/types/ticket";

export interface TicketStats {
  open: number;
  inProgress: number;
  resolved: number;
  /** Mean time-to-resolve in days, computed over resolved tickets. */
  mttrDays: number;
  /** Share of resolved tickets within SLA (≤ 1 day for high, ≤ 3 for med/low). */
  slaPct: number;
  /** Count per category (only categories that have at least one ticket). */
  byCategory: ReadonlyArray<{ category: TicketCategory; count: number }>;
}

const SLA_DAYS_BY_PRIORITY = { alta: 1, media: 3, baja: 5 } as const;

const DAY_MS = 86_400_000;

function diffDays(openIso: string, resolvedIso: string): number {
  const opened = new Date(openIso).getTime();
  const resolved = new Date(resolvedIso).getTime();
  return Math.max(0, Math.round((resolved - opened) / DAY_MS));
}

/**
 * Aggregates a ticket list into the support-panel KPIs (prototype
 * `ScreenTickets` right rail). Pure.
 */
export function aggregateTicketStats(tickets: readonly Ticket[]): TicketStats {
  const open = tickets.filter((t) => t.status === "Abierto").length;
  const inProgress = tickets.filter((t) => t.status === "En curso").length;
  const resolvedTickets = tickets.filter((t) => t.status === "Resuelto" && t.resolvedAt);
  const resolved = resolvedTickets.length;

  let mttrSum = 0;
  let slaMet = 0;
  for (const t of resolvedTickets) {
    const days = diffDays(t.openedAt, t.resolvedAt!);
    mttrSum += days;
    if (days <= SLA_DAYS_BY_PRIORITY[t.priority]) slaMet++;
  }
  const mttrDays = resolved > 0 ? mttrSum / resolved : 0;
  const slaPct = resolved > 0 ? slaMet / resolved : 0;

  const byCat = new Map<TicketCategory, number>();
  for (const t of tickets) byCat.set(t.category, (byCat.get(t.category) ?? 0) + 1);

  return {
    open,
    inProgress,
    resolved,
    mttrDays,
    slaPct,
    byCategory: [...byCat.entries()].map(([category, count]) => ({ category, count })),
  };
}
