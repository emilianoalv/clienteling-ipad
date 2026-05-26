import { BaDashboard } from "@/features/dashboards/components/ba-dashboard";
import { eventsLookAhead, parseFilters } from "@/features/dashboards/lib/parse-filters";
import {
  getActiveClients,
  getAtRiskClients,
  getAverageTicket,
  getBaRankingInCounter,
  getCounterAverages,
  getEstimatedReplenishments,
  getFollowUpsCount,
  getFollowUpToRevisitRate,
  getNewClientsCount,
  getOperationalAlerts,
  getPendingFollowups,
  getPeriodDelta,
  getRecoToPurchaseRate,
  getRepurchaseRate,
  getSalesAmount,
  getSalesByCategory,
  getSampleToPurchaseRate,
  getSparklineData,
  getTopClients,
  getTopProducts,
  getTransactionsCount,
  getUpcomingAnniversaries,
  getUpcomingBirthdays,
} from "@/features/dashboards/server/queries";
import { requireSession } from "@/server/auth/session";
import { storeRepository } from "@/server/repositories/store.repository";
import { userRepository } from "@/server/repositories/user.repository";
import type { UserId } from "@/types/user";

export default async function BaPerformancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const { staff } = await requireSession();
  if (staff.role !== "BA") {
    // Defensive: middleware already gates this, but the queries below assume BA.
    throw new Error("BA performance dashboard is only available to BA users.");
  }

  // CRÍTICO: setear filters.baId = staff.id para que TODAS las queries
  // del dashboard filtren por el BA logueado. Sin esto, parseFilters deja
  // baId undefined y las queries (que solo aplican el guard
  // `if (filters.baId && p.baId !== filters.baId)`) suman las ventas,
  // transacciones, recomendaciones y top clients de TODO el counter —
  // el BA ve los números de sus colegas como si fueran suyos.
  // Las queries de comparativa (getBaRankingInCounter, getCounterAverages)
  // son agnósticas a este filter — usan su propia lista de peers, así que
  // no se rompen.
  const filters = { ...parseFilters(params, { defaultPeriod: "mtd" }), baId: staff.id };
  // Pre-fetch user record for `monthlyTarget` (lives on User, not Staff).
  const [user, store] = await Promise.all([
    userRepository.findById(staff.id as unknown as UserId),
    storeRepository.findById(staff.storeId),
  ]);

  const upcomingFilters = { ...filters, period: eventsLookAhead() };

  const [
    salesAmount,
    salesDelta,
    sparklineData,
    averageTicket,
    ticketDelta,
    baRankingInCounter,
    recoToPurchaseRate,
    counterAverages,
    transactionsCount,
    newClientsCount,
    followUpsCount,
    repurchaseRate,
    sampleToPurchaseRate,
    followupToRevisitRate,
    salesByCategory,
    topProducts,
    activeClients,
    atRiskClients,
    topClients,
    pendingFollowups,
    upcomingBirthdays,
    upcomingAnniversaries,
    estimatedReplenishments,
    operationalAlerts,
  ] = await Promise.all([
    getSalesAmount(staff, filters),
    getPeriodDelta(staff, filters, getSalesAmount),
    getSparklineData(staff, filters),
    getAverageTicket(staff, filters),
    getPeriodDelta(staff, filters, getAverageTicket),
    getBaRankingInCounter(staff, filters),
    getRecoToPurchaseRate(staff, filters),
    getCounterAverages(staff, filters),
    getTransactionsCount(staff, filters),
    getNewClientsCount(staff, filters),
    getFollowUpsCount(staff, filters),
    getRepurchaseRate(staff, filters),
    getSampleToPurchaseRate(staff, filters),
    getFollowUpToRevisitRate(staff, filters),
    getSalesByCategory(staff, filters),
    getTopProducts(staff, filters, { topN: 5 }),
    getActiveClients(staff, filters),
    getAtRiskClients(staff, filters),
    getTopClients(staff, filters, { topN: 5 }),
    getPendingFollowups(staff, filters),
    getUpcomingBirthdays(staff, upcomingFilters, { windowDays: 30 }),
    getUpcomingAnniversaries(staff, upcomingFilters, { windowDays: 30 }),
    getEstimatedReplenishments(staff, upcomingFilters, { windowDays: 30 }),
    getOperationalAlerts(staff, filters),
  ]);

  return (
    <BaDashboard
      staff={staff}
      filters={filters}
      storeName={store?.name ?? "—"}
      monthlyTarget={user?.monthlyTarget ?? 0}
      data={{
        salesAmount,
        salesDelta,
        sparklineData,
        averageTicket,
        ticketDelta,
        baRankingInCounter,
        recoToPurchaseRate,
        counterAverages,
        transactionsCount,
        newClientsCount,
        followUpsCount,
        repurchaseRate,
        sampleToPurchaseRate,
        followupToRevisitRate,
        salesByCategory,
        topProducts,
        activeClients,
        atRiskClients,
        topClients,
        pendingFollowups,
        upcomingBirthdays,
        upcomingAnniversaries,
        estimatedReplenishments,
        operationalAlerts,
      }}
    />
  );
}
