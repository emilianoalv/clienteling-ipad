/**
 * `dashboards` feature — public API (F3.7).
 *
 * One component per role; pages mount them on /ba/performance, /gerente,
 * /supervisor. Numbers are prototype-frozen until F4 wires a real KPI service.
 */
export { BaDashboard, type BaDashboardProps } from "./components/ba-dashboard";
export { ManagerDashboard, type ManagerDashboardProps } from "./components/manager-dashboard";
export { SupervisorDashboard, type SupervisorDashboardProps } from "./components/supervisor-dashboard";
