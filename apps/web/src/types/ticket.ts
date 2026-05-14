import type { Branded } from "./branded";
import type { DeviceId } from "./device";

export type TicketId = Branded<string, "Ticket">;

export type TicketCategory = "Hardware" | "App" | "Acceso" | "Red";
export type TicketStatus = "Abierto" | "En curso" | "Resuelto";
export type TicketPriority = "alta" | "media" | "baja";

export interface Ticket {
  id: TicketId;
  category: TicketCategory;
  title: string;
  deviceId: DeviceId | null;
  status: TicketStatus;
  /** ISO date (yyyy-mm-dd) when the ticket was opened. */
  openedAt: string;
  /** ISO date (yyyy-mm-dd) when the ticket was resolved, or null. */
  resolvedAt: string | null;
  priority: TicketPriority;
}
