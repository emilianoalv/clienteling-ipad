/**
 * `admin` feature — public API (F3.9). Governance hub (Admin Central) plus
 * the dedicated detail views (Usuarios / Segmentos / Integraciones / Auditoría).
 */
export { AdminHome, type AdminHomeProps } from "./components/admin-home";
export { UsersScreen, type UsersScreenProps } from "./components/users-screen";
export { SegmentsScreen, type SegmentsScreenProps } from "./components/segments-screen";
export { IntegrationsScreen, type IntegrationsScreenProps } from "./components/integrations-screen";
export { AuditLog, type AuditLogProps } from "./components/audit-log";

export { listUsers } from "./server/list-users";
export { listIntegrations } from "./server/list-integrations";
export { listAuditEvents } from "./server/list-audit-events";
export { groupClientsBySegment, type SegmentBucket } from "./services/group-clients-by-segment";
