/**
 * `home` feature — BA "Hoy" landing screen (F3.10).
 *
 * Single composition of greeting + agenda + pendientes + eventos. Manager /
 * Supervisor / HQ may grow their own variants here later; their dashboards
 * currently live in `features/dashboards/`.
 */
export { BaTodayScreen, type BaTodayScreenProps } from "./components/ba-today-screen";
export { getBaDaySnapshot } from "./services/get-ba-day-snapshot";
export type {
  AgendaItem,
  BaDaySnapshot,
  UpcomingEventEntry,
} from "./services/get-ba-day-snapshot";
