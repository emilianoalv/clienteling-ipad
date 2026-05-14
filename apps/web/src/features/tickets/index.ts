/**
 * `tickets` feature — public API (F3.8). Support inbox consumed by the
 * Supervisor page; will be reusable by Admin once F3.9 lands.
 */
export { TicketsScreen, type TicketsScreenProps } from "./components/tickets-screen";
export { listTickets } from "./server/list-tickets";
export { aggregateTicketStats, type TicketStats } from "./services/aggregate-ticket-stats";
