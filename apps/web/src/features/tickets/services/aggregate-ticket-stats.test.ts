import { describe, expect, it } from "vitest";
import type { Ticket, TicketId, TicketStatus, TicketPriority, TicketCategory } from "@/types/ticket";
import { aggregateTicketStats } from "./aggregate-ticket-stats";

function ticket(args: {
  id: string;
  status: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
  openedAt?: string;
  resolvedAt?: string | null;
}): Ticket {
  return {
    id: `tc-${args.id}` as TicketId,
    category: args.category ?? "App",
    title: "",
    deviceId: null,
    status: args.status,
    openedAt: args.openedAt ?? "2026-04-01",
    resolvedAt: args.resolvedAt ?? null,
    priority: args.priority ?? "media",
  };
}

describe("aggregateTicketStats", () => {
  it("returns zeros for empty list", () => {
    const s = aggregateTicketStats([]);
    expect(s.open).toBe(0);
    expect(s.resolved).toBe(0);
    expect(s.mttrDays).toBe(0);
    expect(s.slaPct).toBe(0);
    expect(s.byCategory).toHaveLength(0);
  });

  it("computes MTTR over resolved only", () => {
    const s = aggregateTicketStats([
      ticket({ id: "1", status: "Resuelto", openedAt: "2026-04-01", resolvedAt: "2026-04-03" }),
      ticket({ id: "2", status: "Resuelto", openedAt: "2026-04-01", resolvedAt: "2026-04-05" }),
      ticket({ id: "3", status: "Abierto" }),
    ]);
    expect(s.resolved).toBe(2);
    expect(s.mttrDays).toBe(3);
  });

  it("computes SLA based on priority window", () => {
    const s = aggregateTicketStats([
      ticket({ id: "1", status: "Resuelto", priority: "alta", openedAt: "2026-04-01", resolvedAt: "2026-04-01" }),
      ticket({ id: "2", status: "Resuelto", priority: "alta", openedAt: "2026-04-01", resolvedAt: "2026-04-05" }),
      ticket({ id: "3", status: "Resuelto", priority: "baja", openedAt: "2026-04-01", resolvedAt: "2026-04-04" }),
    ]);
    expect(s.slaPct).toBeCloseTo(2 / 3, 5);
  });

  it("counts categories independently", () => {
    const s = aggregateTicketStats([
      ticket({ id: "1", status: "Abierto", category: "App" }),
      ticket({ id: "2", status: "En curso", category: "App" }),
      ticket({ id: "3", status: "Abierto", category: "Red" }),
    ]);
    const map = Object.fromEntries(s.byCategory.map((b) => [b.category, b.count]));
    expect(map).toEqual({ App: 2, Red: 1 });
  });
});
