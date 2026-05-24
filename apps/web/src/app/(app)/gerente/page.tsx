import { ManagerDashboard } from "@/features/dashboards/components/manager-dashboard";
import { computeCounterAveragesByBrand } from "@/features/dashboards/lib/counter-averages";
import { eventsLookAhead, parseFilters } from "@/features/dashboards/lib/parse-filters";
import {
  getActiveClients,
  getAppointmentMetrics,
  getAtRiskClients,
  getAverageTicket,
  getBaRanking,
  getEstimatedReplenishments,
  getOperationalAlerts,
  getPendingFollowups,
  getPeriodDelta,
  getRecoToPurchaseRate,
  getRepurchaseRate,
  getSalesAmount,
  getSalesByBrand,
  getSalesByCategory,
  getSparklineData,
  getTopClients,
  getTopProducts,
  type BaRankingEntry,
  type OperationalAlert,
  type SparklineBucket,
} from "@/features/dashboards/server/queries";
import { mergeScope } from "@/features/dashboards/server/utils/scope-merge";
import { homeStoreFor } from "@/server/auth/scope";
import { requireSession } from "@/server/auth/session";
import { interactionRepository } from "@/server/repositories/interaction.repository";
import { recommendationRepository } from "@/server/repositories/recommendation.repository";
import { storeRepository } from "@/server/repositories/store.repository";
import { userRepository } from "@/server/repositories/user.repository";
import type { Gerente, StaffId } from "@/types/staff";

export default async function GerentePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const { staff } = await requireSession();
  if (staff.role !== "Gerente") {
    throw new Error("Gerente dashboard is only available to Gerente users.");
  }
  const gerente = staff;

  const filters = parseFilters(params, { defaultPeriod: "mtd" });
  const storeId = homeStoreFor(gerente);
  const store = storeId ? await storeRepository.findById(storeId) : null;

  const upcomingFilters = { ...filters, period: eventsLookAhead() };

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
    pendingFollowups,
    estimatedReplenishments,
    operationalAlerts,
    appointments,
    funnelInteractions,
    funnelRecommendations,
  ] = await Promise.all([
    getSalesAmount(gerente, filters),
    getPeriodDelta(gerente, filters, getSalesAmount),
    getSparklineData(gerente, filters),
    getAverageTicket(gerente, filters),
    getRecoToPurchaseRate(gerente, filters),
    getSalesByBrand(gerente, filters),
    getBaRanking(gerente, filters, { topN: 20 }),
    getSalesByCategory(gerente, filters),
    getTopProducts(
      gerente,
      { ...filters, brands: ["Lancôme"] },
      { topN: 5 },
    ),
    getTopProducts(
      gerente,
      { ...filters, brands: ["YSL"] },
      { topN: 5 },
    ),
    getActiveClients(gerente, filters),
    getAtRiskClients(gerente, filters),
    getRepurchaseRate(gerente, filters),
    getTopClients(gerente, filters, { topN: 10 }),
    getPendingFollowups(gerente, filters),
    getEstimatedReplenishments(gerente, upcomingFilters, { windowDays: 30 }),
    getOperationalAlerts(gerente, filters),
    getAppointmentMetrics(gerente, filters),
    countInteractions(gerente, filters),
    countRecommendations(gerente, filters),
  ]);

  // Per-BA delta + sparkline. Runs in parallel; ~4 BAs in scope so the
  // total wall-clock is bounded.
  const baDeltasAndSparks = await Promise.all(
    baRanking.map(async (entry) => {
      const baFilters = { ...filters, baId: entry.baId };
      const [delta, sparkline] = await Promise.all([
        getPeriodDelta(gerente, baFilters, getSalesAmount),
        getSparklineData(gerente, baFilters),
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

  const baTargetsByBaId = await loadBaTargets();
  const baAlertsByBaId = bucketAlertsByBa(operationalAlerts, baRanking);
  const counterAveragesByBrand = computeCounterAveragesByBrand(baRanking);

  const funnelPurchases = Math.round(
    (recoToPurchaseRate / 100) * funnelRecommendations,
  );
  const funnelRepurchases = Math.round(
    (repurchaseRate / 100) * funnelPurchases,
  );

  return (
    <ManagerDashboard
      staff={gerente}
      storeName={store?.name ?? "—"}
      storeTarget={store?.monthlyTarget ?? 0}
      filters={filters}
      data={{
        salesAmount,
        salesDelta,
        sparklineData,
        averageTicket,
        recoToPurchaseRate,
        salesByBrand,
        baRanking,
        baDeltasByBaId,
        baTargetsByBaId,
        baSparklineByBaId,
        baAlertsByBaId,
        counterAveragesByBrand,
        salesByCategory,
        topProductsLcm,
        topProductsYsl,
        activeClients,
        atRiskClients,
        repurchaseRate,
        topClients,
        pendingFollowups,
        estimatedReplenishments,
        operationalAlerts,
        funnelInteractions,
        funnelRecommendations,
        funnelPurchases,
        funnelRepurchases,
        appointmentsTotal: appointments.total,
        appointmentsCanceled:
          (appointments.canceled ?? 0) + (appointments.rescheduled ?? 0),
      }}
    />
  );
}

async function countInteractions(
  staff: Gerente,
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
  staff: Gerente,
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

async function loadBaTargets(): Promise<Map<StaffId, number>> {
  const users = await userRepository.list();
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

