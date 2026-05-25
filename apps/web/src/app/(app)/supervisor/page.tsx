import {
  SupervisorDashboard,
  type StoreSnapshot,
} from "@/features/dashboards/components/supervisor-dashboard";
import { toMultiSeriesLineData } from "@/features/dashboards/lib/adapters";
import {
  computeBestPractices,
  type StoreMetricsSnapshot,
} from "@/features/dashboards/lib/best-practices";
import { computeCounterAveragesByBrand } from "@/features/dashboards/lib/counter-averages";
import { parseFilters } from "@/features/dashboards/lib/parse-filters";
import {
  computeStoreHealth,
  type StoreHealth,
} from "@/features/dashboards/lib/store-health";
import {
  getActiveClients,
  getAppointmentMetrics,
  getAtRiskClients,
  getAverageTicket,
  getBaRanking,
  getNewClientsCount,
  getOperationalAlerts,
  getPeriodDelta,
  getRecoToPurchaseRate,
  getRepurchaseRate,
  getSalesAmount,
  getSalesByBrand,
  getSalesByCategory,
  getSampleToPurchaseRate,
  getSparklineData,
  getTopClients,
  getTopProducts,
  type BaRankingEntry,
  type OperationalAlert,
  type SparklineBucket,
} from "@/features/dashboards/server/queries";
import { mergeScope } from "@/features/dashboards/server/utils/scope-merge";
import { requireSession } from "@/server/auth/session";
import { interactionRepository } from "@/server/repositories/interaction.repository";
import { recommendationRepository } from "@/server/repositories/recommendation.repository";
import { storeRepository } from "@/server/repositories/store.repository";
import { userRepository } from "@/server/repositories/user.repository";
import type { StaffId, Supervisor } from "@/types/staff";
import type { StoreId } from "@/types/store";

export default async function SupervisorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const { staff } = await requireSession();
  if (staff.role !== "Supervisor") {
    throw new Error("Supervisor dashboard is only available to Supervisor users.");
  }
  const supervisor = staff;

  const filters = parseFilters(params, { defaultPeriod: "mtd" });

  // ── 1. Zone-wide queries ───────────────────────────────────────────────────
  const [
    salesAmount,
    salesDelta,
    sparklineData,
    averageTicket,
    recoToPurchaseRate,
    salesByBrand,
    baRanking,
    salesByCategory,
    topProductsLcm,
    topProductsYsl,
    activeClients,
    atRiskClients,
    repurchaseRate,
    topClients,
    operationalAlerts,
    appointments,
    funnelInteractions,
    funnelRecommendations,
    storesList,
    usersList,
  ] = await Promise.all([
    getSalesAmount(supervisor, filters),
    getPeriodDelta(supervisor, filters, getSalesAmount),
    getSparklineData(supervisor, filters),
    getAverageTicket(supervisor, filters),
    getRecoToPurchaseRate(supervisor, filters),
    getSalesByBrand(supervisor, filters),
    getBaRanking(supervisor, filters, { topN: 30 }),
    getSalesByCategory(supervisor, filters),
    getTopProducts(
      supervisor,
      { ...filters, brands: ["Lancôme"] },
      { topN: 5 },
    ),
    getTopProducts(
      supervisor,
      { ...filters, brands: ["YSL"] },
      { topN: 5 },
    ),
    getActiveClients(supervisor, filters),
    getAtRiskClients(supervisor, filters),
    getRepurchaseRate(supervisor, filters),
    getTopClients(supervisor, filters, { topN: 10 }),
    getOperationalAlerts(supervisor, filters),
    getAppointmentMetrics(supervisor, filters),
    countInteractions(supervisor, filters),
    countRecommendations(supervisor, filters),
    storeRepository.list(),
    userRepository.list(),
  ]);

  // ── 2. Per-store snapshots ─────────────────────────────────────────────────
  const supervisorStoreIds = supervisor.storeIds;
  const storesInScope = storesList.filter((s) =>
    supervisorStoreIds.includes(s.id),
  );

  const storeSnapshots = await Promise.all(
    storesInScope.map((store) =>
      buildStoreSnapshot(
        supervisor,
        store,
        filters,
        usersList,
        baRanking,
        operationalAlerts,
      ),
    ),
  );

  // ── 3. Per-BA deltas + sparklines (cross-store) ────────────────────────────
  const baDeltasAndSparks = await Promise.all(
    baRanking.map(async (entry) => {
      const baFilters = { ...filters, baId: entry.baId };
      const [delta, sparkline] = await Promise.all([
        getPeriodDelta(supervisor, baFilters, getSalesAmount),
        getSparklineData(supervisor, baFilters),
      ]);
      return { baId: entry.baId, delta, sparkline };
    }),
  );

  const baDeltasByBaId = new Map<StaffId, number>();
  const baSparklineByBaId = new Map<StaffId, readonly SparklineBucket[]>();
  for (const row of baDeltasAndSparks) {
    baDeltasByBaId.set(row.baId, row.delta.deltaPct);
    baSparklineByBaId.set(row.baId, row.sparkline);
  }

  const baTargetsByBaId = loadBaTargets(usersList);
  const baAlertsByBaId = bucketAlertsByBa(operationalAlerts, baRanking);
  const counterAveragesByBrand = computeCounterAveragesByBrand(baRanking);

  // ── 4. Store health ────────────────────────────────────────────────────────
  const storeHealthById = new Map<StoreId, StoreHealth>();
  for (const snapshot of storeSnapshots) {
    storeHealthById.set(
      snapshot.storeId,
      computeStoreHealth({
        salesAmount: snapshot.salesAmount,
        monthlyTarget: snapshot.monthlyTarget,
        activeBasCount: snapshot.baActive,
        totalBasCount: snapshot.baTotal,
        criticalAlertsCount: snapshot.criticalAlertsCount,
        // Proxy for iPad usage: total interactions in the period (caller-side
        // we don't have device sessions). Expected: 5 interactions/BA/day for
        // a 7-day rolling window.
        recentInteractionsCount: snapshot.activeClients,
        expectedInteractionsCount: Math.max(snapshot.baTotal * 5 * 7, 1),
      }),
    );
  }

  // ── 5. Best Practices ──────────────────────────────────────────────────────
  const storeMetrics = new Map<StoreId, StoreMetricsSnapshot>();
  const storeNamesById = new Map<StoreId, string>();
  for (const snap of storeSnapshots) {
    storeNamesById.set(snap.storeId, snap.storeName);
    storeMetrics.set(snap.storeId, {
      convReco: snap.recoRate,
      convSample: snap.sampleRate,
      avgTicket: snap.avgTicket,
      newClientsPerDay: snap.newClientsCount /
        Math.max(1, daysIn(filters.period)),
      adoption:
        snap.baTotal > 0 ? (snap.baActive / snap.baTotal) * 100 : 0,
    });
  }
  const bestPractices = computeBestPractices(storeMetrics, storeNamesById);

  // ── 6. Multi-series trend (zone + per store) ───────────────────────────────
  const storeSparkPromises = storesInScope.slice(0, 2).map(async (store) => {
    const data = await getSparklineData(supervisor, {
      ...filters,
      storeIds: [store.id],
    });
    return { label: store.name, data };
  });
  const storeSparks = await Promise.all(storeSparkPromises);
  const multiSeriesRaw = toMultiSeriesLineData([
    { label: "Zona", data: sparklineData },
    ...storeSparks,
  ]);
  const multiSeriesTrend = {
    labels: multiSeriesRaw.labels,
    series: multiSeriesRaw.series.map((s) => ({
      label: s.label,
      values: s.values,
    })),
  };

  // ── 7. Funnel derived values ───────────────────────────────────────────────
  const funnelPurchases = Math.round(
    (recoToPurchaseRate / 100) * funnelRecommendations,
  );
  const funnelRepurchases = Math.round(
    (repurchaseRate / 100) * funnelPurchases,
  );

  const zoneTarget = storeSnapshots.reduce(
    (sum, s) => sum + s.monthlyTarget,
    0,
  );

  return (
    <SupervisorDashboard
      staff={supervisor}
      zoneName={zoneNameFor(supervisor, usersList)}
      zoneTarget={zoneTarget}
      filters={filters}
      data={{
        salesAmount,
        salesDelta,
        sparklineData,
        averageTicket,
        recoToPurchaseRate,
        salesByBrand,
        salesByCategory,
        topProductsLcm,
        topProductsYsl,
        activeClients,
        atRiskClients,
        repurchaseRate,
        topClients,
        operationalAlerts,
        appointmentsTotal: appointments.total,
        appointmentsCanceled:
          (appointments.canceled ?? 0) + (appointments.rescheduled ?? 0),
        funnelInteractions,
        funnelRecommendations,
        funnelPurchases,
        funnelRepurchases,
        baRanking,
        // Maps no son serializables por RSC al cruzar Server→Client.
        // Object.fromEntries convierte Map<K, V> → Record<string, V>.
        baDeltasByBaId: Object.fromEntries(baDeltasByBaId),
        baTargetsByBaId: Object.fromEntries(baTargetsByBaId),
        baSparklineByBaId: Object.fromEntries(baSparklineByBaId),
        baAlertsByBaId: Object.fromEntries(baAlertsByBaId),
        counterAveragesByBrand: Object.fromEntries(counterAveragesByBrand),
        storeSnapshots,
        storeHealthById: Object.fromEntries(storeHealthById),
        bestPractices,
        multiSeriesTrend,
      }}
    />
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function buildStoreSnapshot(
  supervisor: Supervisor,
  store: { id: StoreId; name: string; monthlyTarget?: number },
  filters: ReturnType<typeof parseFilters>,
  usersList: Awaited<ReturnType<typeof userRepository.list>>,
  baRanking: readonly BaRankingEntry[],
  operationalAlerts: readonly OperationalAlert[],
): Promise<StoreSnapshot> {
  const storeFilters = { ...filters, storeIds: [store.id] };
  const [
    salesAmount,
    salesByBrand,
    recoRate,
    sampleRate,
    avgTicket,
    newClientsCount,
    activeClients,
    atRiskClients,
    sparkline,
  ] = await Promise.all([
    getSalesAmount(supervisor, storeFilters),
    getSalesByBrand(supervisor, storeFilters),
    getRecoToPurchaseRate(supervisor, storeFilters),
    getSampleToPurchaseRate(supervisor, storeFilters),
    getAverageTicket(supervisor, storeFilters),
    getNewClientsCount(supervisor, storeFilters),
    getActiveClients(supervisor, storeFilters),
    getAtRiskClients(supervisor, storeFilters),
    getSparklineData(supervisor, storeFilters),
  ]);

  const baInStore = usersList.filter(
    (u) => u.role === "BA" && u.storeId === store.id,
  );
  const baTotal = baInStore.length;
  // Active BA = BA in this store who has sales > 0 in baRanking.
  const baActive = baRanking.filter(
    (b) => b.storeId === store.id && b.salesAmount > 0,
  ).length;

  const storeAlerts = operationalAlerts.filter((a) =>
    (a.affectedIds ?? []).some((id) => id === store.id),
  );
  const criticalAlertsCount = storeAlerts.filter(
    (a) => a.severity === "critical",
  ).length;

  return {
    storeId: store.id,
    storeName: store.name,
    salesAmount,
    monthlyTarget: store.monthlyTarget ?? 0,
    salesByBrand,
    recoRate,
    sampleRate,
    avgTicket,
    newClientsCount,
    activeClients,
    atRiskClients,
    baActive,
    baTotal,
    sparklineValues: sparkline.map((b) => b.value),
    criticalAlertsCount,
  };
}

async function countInteractions(
  staff: Supervisor,
  filters: ReturnType<typeof parseFilters>,
): Promise<number> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return 0;
  const items = await interactionRepository.list({
    storeIds,
    brands,
    from: filters.period.from,
    to: filters.period.to,
  });
  if (!filters.baId) return items.length;
  return items.filter((i) => i.baId === filters.baId).length;
}

async function countRecommendations(
  staff: Supervisor,
  filters: ReturnType<typeof parseFilters>,
): Promise<number> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return 0;
  const items = await recommendationRepository.list({ storeIds, brands });
  return items.filter((r) => {
    const at = new Date(r.at);
    if (at < filters.period.from || at >= filters.period.to) return false;
    if (filters.baId && r.baId !== filters.baId) return false;
    return true;
  }).length;
}

function loadBaTargets(
  users: Awaited<ReturnType<typeof userRepository.list>>,
): Map<StaffId, number> {
  const out = new Map<StaffId, number>();
  for (const u of users) {
    if (u.role !== "BA" || !u.monthlyTarget) continue;
    out.set(u.id as unknown as StaffId, u.monthlyTarget);
  }
  return out;
}

function bucketAlertsByBa(
  alerts: readonly OperationalAlert[],
  ranking: readonly BaRankingEntry[],
): Map<StaffId, OperationalAlert[]> {
  const out = new Map<StaffId, OperationalAlert[]>();
  for (const ba of ranking) out.set(ba.baId, []);
  for (const a of alerts) {
    if (!a.affectedIds) continue;
    for (const id of a.affectedIds) {
      const baId = id as StaffId;
      if (!out.has(baId)) continue;
      out.get(baId)!.push(a);
    }
  }
  return out;
}

function daysIn(period: { from: Date; to: Date }): number {
  return Math.max(
    1,
    Math.round((period.to.getTime() - period.from.getTime()) / 86_400_000),
  );
}

function zoneNameFor(
  supervisor: Supervisor,
  users: Awaited<ReturnType<typeof userRepository.list>>,
): string {
  // `zone` lives on the User record (not Staff). Look it up; fall back to
  // the generic label when missing.
  const user = users.find(
    (u) => (u.id as unknown as string) === (supervisor.id as unknown as string),
  );
  return user?.zone ?? "Zona";
}
