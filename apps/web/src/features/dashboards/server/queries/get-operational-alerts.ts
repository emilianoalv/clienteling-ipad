import "server-only";
import type { Staff, StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import { sampleRepository } from "@/server/repositories/sample.repository";
import { storeRepository } from "@/server/repositories/store.repository";
import { userRepository } from "@/server/repositories/user.repository";
import { mergeScope } from "../utils/scope-merge";
import { getAppointmentMetrics } from "./get-appointment-metrics";
import { getAtRiskClients } from "./get-at-risk-clients";
import { getBaRanking } from "./get-ba-ranking";
import { getPendingFollowups } from "./get-pending-followups";
import { getStoreRanking } from "./get-store-ranking";
import type { DashboardFilters } from "../types";

/**
 * Heuristic alerts surfaced on dashboards. Each role sees only the alerts
 * that apply to them (BA → operational; Gerente → operational + retention;
 * etc.). When the underlying model can't support an alert (e.g. Consent
 * lacks `expiresAt`), the alert is silently omitted — see TODOs.
 */
export type AlertSeverity = "info" | "warning" | "critical";
export type AlertCategory =
  | "performance"
  | "retention"
  | "compliance"
  | "inventory"
  | "operational";

export interface OperationalAlert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  count?: number;
  affectedIds?: ReadonlyArray<string>;
  link?: string;
  createdAt: Date;
}

export interface OperationalAlertsOptions {
  baBelowQuotaThresholdPct?: number;
  storeBelowQuotaThresholdPct?: number;
  atRiskClientsAlertMin?: number;
  overdueFollowupsAlertMin?: number;
  canceledAppointmentsAlertMin?: number;
  sampleStockLowPct?: number;
}

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export async function getOperationalAlerts(
  staff: Staff,
  filters: DashboardFilters,
  options: OperationalAlertsOptions = {},
): Promise<OperationalAlert[]> {
  const opts = {
    baBelowQuotaThresholdPct: options.baBelowQuotaThresholdPct ?? 50,
    storeBelowQuotaThresholdPct: options.storeBelowQuotaThresholdPct ?? 60,
    atRiskClientsAlertMin: options.atRiskClientsAlertMin ?? 3,
    overdueFollowupsAlertMin: options.overdueFollowupsAlertMin ?? 5,
    canceledAppointmentsAlertMin: options.canceledAppointmentsAlertMin ?? 5,
    sampleStockLowPct: options.sampleStockLowPct ?? 30,
  };

  const alerts: OperationalAlert[] = [];
  const createdAt = filters.period.to;

  // ── PERFORMANCE ────────────────────────────────────────────────────────────
  // "BAs bajo cuota" — Gerente, Supervisor, Admin
  if (staff.role !== "BA") {
    const ranking = await getBaRanking(staff, filters, { topN: 9999 });
    const users = await userRepository.list();
    const userMap = new Map(users.map((u) => [u.id as unknown as string, u]));
    const below: string[] = [];
    for (const r of ranking) {
      const u = userMap.get(r.baId as unknown as string);
      if (!u?.monthlyTarget) continue;
      const pct = (r.salesAmount / u.monthlyTarget) * 100;
      if (pct < opts.baBelowQuotaThresholdPct) below.push(r.baId as unknown as string);
    }
    if (below.length > 0) {
      alerts.push({
        id: "perf-ba-below-quota",
        severity: "warning",
        category: "performance",
        title: "BAs bajo cuota mensual",
        description: `${below.length} BA(s) por debajo del ${opts.baBelowQuotaThresholdPct}% de su objetivo`,
        count: below.length,
        affectedIds: below,
        createdAt,
      });
    }
  }

  // "Tiendas bajo objetivo" — Supervisor, Admin
  if (staff.role === "Supervisor" || staff.role === "Admin") {
    const ranking = await getStoreRanking(staff, filters, { topN: 9999 });
    const stores = await storeRepository.list();
    const storeMap = new Map(stores.map((s) => [s.id as unknown as string, s]));
    const below: string[] = [];
    for (const r of ranking) {
      const s = storeMap.get(r.storeId as unknown as string);
      if (!s?.monthlyTarget) continue;
      const pct = (r.salesAmount / s.monthlyTarget) * 100;
      if (pct < opts.storeBelowQuotaThresholdPct) {
        below.push(r.storeId as unknown as string);
      }
    }
    if (below.length > 0) {
      alerts.push({
        id: "perf-store-below-quota",
        severity: "warning",
        category: "performance",
        title: "Tiendas bajo objetivo",
        description: `${below.length} tienda(s) por debajo del ${opts.storeBelowQuotaThresholdPct}% del objetivo`,
        count: below.length,
        affectedIds: below,
        createdAt,
      });
    }
  }

  // ── RETENTION ──────────────────────────────────────────────────────────────
  // "Clientas en riesgo" — todos los roles
  const atRiskCount = await getAtRiskClients(staff, filters);
  if (atRiskCount >= opts.atRiskClientsAlertMin) {
    alerts.push({
      id: "ret-at-risk-clients",
      severity: "warning",
      category: "retention",
      title: "Clientas en riesgo de abandono",
      description: `${atRiskCount} clientas sin contacto reciente`,
      count: atRiskCount,
      createdAt,
    });
  }

  // ── OPERATIONAL ────────────────────────────────────────────────────────────
  // "Follow-ups vencidos" — BA, Gerente, Supervisor (no Admin operacional)
  if (staff.role !== "Admin") {
    const pending = await getPendingFollowups(staff, filters);
    const overdue = pending.filter((p) => p.isOverdue);
    if (overdue.length >= opts.overdueFollowupsAlertMin) {
      const severity: AlertSeverity =
        overdue.length >= opts.overdueFollowupsAlertMin * 2 ? "critical" : "warning";
      alerts.push({
        id: "op-overdue-followups",
        severity,
        category: "operational",
        title: "Follow-ups vencidos sin acción",
        description: `${overdue.length} follow-up(s) vencidos`,
        count: overdue.length,
        affectedIds: overdue.map((p) => p.taskId as unknown as string),
        createdAt,
      });
    }
  }

  // "Citas canceladas excesivas" — Gerente, Supervisor, Admin
  if (staff.role !== "BA") {
    const m = await getAppointmentMetrics(staff, filters);
    if ((m.canceled ?? 0) >= opts.canceledAppointmentsAlertMin) {
      alerts.push({
        id: "op-canceled-appointments",
        severity: "warning",
        category: "operational",
        title: "Citas canceladas excesivas",
        description: `${m.canceled} cita(s) canceladas en el período`,
        count: m.canceled ?? 0,
        createdAt,
      });
    }
  }

  // ── INVENTORY ──────────────────────────────────────────────────────────────
  // "Stock bajo muestras" — Gerente, Admin
  if (staff.role === "Gerente" || staff.role === "Admin") {
    const { brands, isEmpty } = mergeScope(staff, filters);
    if (!isEmpty) {
      const inventory = await sampleRepository.listInventory({ brands });
      const low = inventory.filter(
        (i) => i.capacity > 0 && i.have / i.capacity < opts.sampleStockLowPct / 100,
      );
      if (low.length > 0) {
        alerts.push({
          id: "inv-sample-stock-low",
          severity: "info",
          category: "inventory",
          title: "Stock bajo de muestras",
          description: `${low.length} SKU(s) con stock <${opts.sampleStockLowPct}% del capacity`,
          count: low.length,
          affectedIds: low.map((i) => i.sku),
          createdAt,
        });
      }
    }
  }

  // ── COMPLIANCE ─────────────────────────────────────────────────────────────
  // TODO(F4): "Consentimientos vencidos" — Consent type currently lacks
  //   `expiresAt`. Heurística "at > 1 año" sería frágil; mejor esperar al
  //   modelo formal de retención (regulatorio).
  // TODO(F4): "Solicitudes derecho al olvido pendientes" — modelo RtBF
  //   no existe aún. Bloqueado por F4.

  alerts.sort((a, b) => {
    if (SEVERITY_RANK[a.severity] !== SEVERITY_RANK[b.severity]) {
      return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    }
    return a.title.localeCompare(b.title);
  });

  return alerts;
}

export type { StaffId, StoreId };
