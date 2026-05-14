import "server-only";
import type { DeviceId } from "@/types/device";
import type { Ticket, TicketId, TicketStatus } from "@/types/ticket";

const SEED: Ticket[] = [
  {
    id: "tc-01" as TicketId,
    category: "Hardware",
    title: "Pantalla con artefactos en iPad 04",
    deviceId: "dv-04" as DeviceId,
    status: "En curso",
    openedAt: "2026-04-20",
    resolvedAt: null,
    priority: "alta",
  },
  {
    id: "tc-02" as TicketId,
    category: "App",
    title: "Sincronización lenta tras venta",
    deviceId: "dv-02" as DeviceId,
    status: "Resuelto",
    openedAt: "2026-04-18",
    resolvedAt: "2026-04-19",
    priority: "media",
  },
  {
    id: "tc-03" as TicketId,
    category: "Acceso",
    title: "BA nueva requiere alta",
    deviceId: null,
    status: "Abierto",
    openedAt: "2026-04-22",
    resolvedAt: null,
    priority: "baja",
  },
  {
    id: "tc-04" as TicketId,
    category: "Red",
    title: "Wi-Fi del counter intermitente",
    deviceId: "dv-03" as DeviceId,
    status: "En curso",
    openedAt: "2026-04-21",
    resolvedAt: null,
    priority: "alta",
  },
  {
    id: "tc-05" as TicketId,
    category: "App",
    title: "Plantilla de WhatsApp sin tokens",
    deviceId: null,
    status: "Resuelto",
    openedAt: "2026-04-15",
    resolvedAt: "2026-04-16",
    priority: "baja",
  },
];

import { persistent } from "./_persist";
const TICKETS = persistent("__clienteling.tickets", () => new Map<TicketId, Ticket>(SEED.map((t) => [t.id, t])));

export interface TicketListFilter {
  status?: TicketStatus;
}

export interface TicketRepository {
  list(filter?: TicketListFilter): Promise<Ticket[]>;
  findById(id: TicketId): Promise<Ticket | null>;
}

export const ticketRepository: TicketRepository = {
  async list(filter = {}) {
    const all = Array.from(TICKETS.values()).sort((a, b) =>
      b.openedAt.localeCompare(a.openedAt),
    );
    if (!filter.status) return all;
    return all.filter((t) => t.status === filter.status);
  },
  async findById(id) {
    return TICKETS.get(id) ?? null;
  },
};
