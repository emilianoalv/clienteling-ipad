/**
 * `dashboards` feature — public API (F3.7).
 *
 * One component per role mounted on /ba/performance, /gerente,
 * /supervisor and /admin. All four are connected to Etapa 1 queries —
 * see the per-page Server Components for the parallel fetch graph and
 * `lib/parse-filters.ts` for how `searchParams` map onto `DashboardFilters`.
 */
export { BaDashboard, type BaDashboardProps } from "./components/ba-dashboard";
export { ManagerDashboard, type ManagerDashboardProps } from "./components/manager-dashboard";
export { SupervisorDashboard, type SupervisorDashboardProps } from "./components/supervisor-dashboard";
export { AdminDashboard, type AdminDashboardProps } from "./components/admin-dashboard";
