import "server-only";
import type { Ticket } from "@/types/ticket";
import { ticketRepository } from "@/server/repositories/ticket.repository";

export async function listTickets(): Promise<Ticket[]> {
  return ticketRepository.list();
}
