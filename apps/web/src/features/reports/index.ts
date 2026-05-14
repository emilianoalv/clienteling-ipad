/**
 * `reports` feature — public API (F3.8). Shared library + ad-hoc builder
 * consumed by Manager/Supervisor/HQ/Admin reports pages.
 */
export { ReportsScreen, type ReportsScreenProps } from "./components/reports-screen";
export { listReports } from "./server/list-reports";
