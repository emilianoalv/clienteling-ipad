import { AdminDashboard } from "@/features/dashboards/components/admin-dashboard";
import { listAuditEvents, listUsers } from "@/features/admin";
import { listProducts } from "@/features/catalog";
import { toMultiSeriesLineData } from "@/features/dashboards/lib/adapters";
import { computeAdoptionData } from "@/features/dashboards/lib/adoption-tracker";
import { computeComplianceData } from "@/features/dashboards/lib/compliance-score";
import { parseFilters } from "@/features/dashboards/lib/parse-filters";
import { computeStrategicInsights } from "@/features/dashboards/lib/strategic-insights";
import {
  getActiveClients,
  getAppointmentMetrics,
  getAtRiskClients,
  getAverageTicket,
  getBaRanking,
  getOperationalAlerts,
  getPeriodDelta,
  getRecoToPurchaseRate,
  getRepurchaseRate,
  getSalesAmount,
  getSalesByBrand,
  getSalesByCategory,
  getSparklineData,
  getStoreRanking,
  getTopClients,
  getTopProducts,
  type BaRankingEntry,
  type OperationalAlert,
  type SparklineBucket,
  type StoreRankingEntry,
} from "@/features/dashboards/server/queries";
import { mergeScope } from "@/features/dashboards/server/utils/scope-merge";
import { requireSession } from "@/server/auth/session";
import { clientRepository } from "@/server/repositories/client.repository";
import { consentRepository } from "@/server/repositories/consent.repository";
import { interactionRepository } from "@/server/repositories/interaction.repository";
import { recommendationRepository } from "@/server/repositories/recommendation.repository";
import { storeRepository } from "@/server/repositories/store.repository";
import { templateRepository } from "@/server/repositories/template.repository";
import { addDays, startOfDay } from "@/lib/date/week";
import type { Admin, StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";

const PRIVACY_NOTICE_VERSION = "v2026.03";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const { staff } = await requireSession();
  if (staff.role !== "Admin") {
    throw new Error("Admin dashboard is only available to Admin users.");
  }
  const admin = staff;

  const filters = parseFilters(params, { defaultPeriod: "mtd" });

  const [
    salesAmount,
    salesDelta,
    sparklineData,
    averageTicket,
    recoToPurchaseRate,
    salesByBrand,
    baRanking,
    storeRanking,
    salesByCategory,
    topProducts,
    activeClients,
    atRiskClients,
    repurchaseRate,
    topClients,
    operationalAlerts,
    appointments,
    funnelInteractions,
    funnelRecommendations,
    lcmDelta,
    yslDelta,
    users,
    products,
    templates,
    auditEvents,
    storesList,
    clientsList,
    recentInteractions,
    lcmSparkline,
    yslSparkline,
  ] = await Promise.all([
    getSalesAmount(admin, filters),
    getPeriodDelta(admin, filters, getSalesAmount),
    getSparklineData(admin, filters),
    getAverageTicket(admin, filters),
    getRecoToPurchaseRate(admin, filters),
    getSalesByBrand(admin, filters),
    getBaRanking(admin, filters, { topN: 50 }),
    getStoreRanking(admin, filters, { topN: 20 }),
    getSalesByCategory(admin, filters),
    getTopProducts(admin, filters, { topN: 10 }),
    getActiveClients(admin, filters),
    getAtRiskClients(admin, filters),
    getRepurchaseRate(admin, filters),
    getTopClients(admin, filters, { topN: 10 }),
    getOperationalAlerts(admin, filters),
    getAppointmentMetrics(admin, filters),
    countInteractions(admin, filters),
    countRecommendations(admin, filters),
    getPeriodDelta(
      admin,
      { ...filters, brands: ["Lancôme"] },
      getSalesAmount,
    ),
    getPeriodDelta(admin, { ...filters, brands: ["YSL"] }, getSalesAmount),
    listUsers(),
    listProducts({}),
    templateRepository.list(),
    listAuditEvents(),
    storeRepository.list(),
    clientRepository.list(),
    listRecentInteractions(),
    getSparklineData(admin, { ...filters, brands: ["Lancôme"] }),
    getSparklineData(admin, { ...filters, brands: ["YSL"] }),
  ]);

  // Per-BA delta + sparkline for drill-down.
  const baAux = await Promise.all(
    baRanking.map(async (entry) => {
      const baFilters = { ...filters, baId: entry.baId };
      const [delta, sparkline] = await Promise.all([
        getPeriodDelta(admin, baFilters, getSalesAmount),
        getSparklineData(admin, baFilters),
      ]);
      return { baId: entry.baId, delta, sparkline };
    }),
  );
  const baDeltasByBaId = new Map<StaffId, number>();
  const baSparklineByBaId = new Map<StaffId, readonly SparklineBucket[]>();
  for (const row of baAux) {
    baDeltasByBaId.set(row.baId, row.delta.deltaPct);
    baSparklineByBaId.set(row.baId, row.sparkline);
  }

  const baTargetsByBaId = new Map<StaffId, number>();
  for (const u of users) {
    if (u.role !== "BA" || !u.monthlyTarget) continue;
    baTargetsByBaId.set(u.id as unknown as StaffId, u.monthlyTarget);
  }
  const baAlertsByBaId = bucketAlertsByBa(operationalAlerts, baRanking);

  // Per-store sparkline + bucketing for the store drill-down.
  const storeSparklineByStoreId = new Map<StoreId, readonly SparklineBucket[]>();
  await Promise.all(
    storeRanking.map(async (entry) => {
      const data = await getSparklineData(admin, {
        ...filters,
        storeIds: [entry.storeId],
      });
      storeSparklineByStoreId.set(entry.storeId, data);
    }),
  );
  const storeBasByStoreId = new Map<StoreId, BaRankingEntry[]>();
  for (const ba of baRanking) {
    const arr = storeBasByStoreId.get(ba.storeId) ?? [];
    arr.push(ba);
    storeBasByStoreId.set(ba.storeId, arr);
  }
  const storeAlertsByStoreId = bucketAlertsByStore(
    operationalAlerts,
    storeRanking,
  );
  const storeTargetsByStoreId = new Map<StoreId, number>();
  for (const s of storesList) {
    if (s.monthlyTarget) storeTargetsByStoreId.set(s.id, s.monthlyTarget);
  }

  const nationalTarget = storesList.reduce(
    (sum, s) => sum + (s.monthlyTarget ?? 0),
    0,
  );

  // Funnel derived counts.
  const funnelPurchases = Math.round(
    (recoToPurchaseRate / 100) * funnelRecommendations,
  );
  const funnelRepurchases = Math.round(
    (repurchaseRate / 100) * funnelPurchases,
  );

  // Strategic insights inputs.
  const storesForInsights = storeRanking.map((s) => ({
    storeId: s.storeId,
    storeName: s.storeName,
    sales: s.salesAmount,
    convReco: estimateStoreConvReco(s, baRanking),
  }));
  const strategicInsights = computeStrategicInsights({
    nationalSales: salesAmount,
    nationalAvgConvReco: recoToPurchaseRate,
    nationalAvgTicket: averageTicket,
    totalRecommendations: funnelRecommendations,
    stores: storesForInsights,
    brandGrowth: {
      lancome: lcmDelta.deltaPct,
      ysl: yslDelta.deltaPct,
    },
  });

  // Compliance.
  const consentsByClient = await Promise.all(
    clientsList.map(async (c) => {
      const consents = await consentRepository.listByClient(c.id);
      return consents.some((x) => x.status === "granted");
    }),
  );
  const clientsWithGrantedConsent = consentsByClient.filter(Boolean).length;
  const complianceData = computeComplianceData({
    clientsTotal: clientsList.length,
    clientsWithGrantedConsent,
    auditEvents,
    privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
  });

  // Adoption.
  const storeNamesById = new Map<StoreId, string>();
  for (const s of storesList) storeNamesById.set(s.id, s.name);
  const adoptionData = computeAdoptionData(users, recentInteractions, storeNamesById);

  // Brand trend.
  const brandTrendRaw = toMultiSeriesLineData([
    { label: "Lancôme", data: lcmSparkline },
    { label: "YSL", data: yslSparkline },
  ]);
  const brandTrend = {
    labels: brandTrendRaw.labels,
    series: brandTrendRaw.series.map((s) => ({
      label: s.label,
      values: s.values,
    })),
  };

  const storeLookup = Object.fromEntries(
    storesList.map((s) => [s.id as unknown as string, s.name]),
  );

  return (
    <AdminDashboard
      staff={admin}
      countryName="México"
      nationalTarget={nationalTarget}
      filters={filters}
      data={{
        salesAmount,
        salesDelta,
        sparklineData,
        averageTicket,
        recoToPurchaseRate,
        salesByBrand,
        salesByCategory,
        topProducts,
        activeClients,
        atRiskClients,
        topClients,
        operationalAlerts,
        appointmentsTotal: appointments.total,
        appointmentsCanceled:
          (appointments.canceled ?? 0) + (appointments.rescheduled ?? 0),
        funnelInteractions,
        funnelRecommendations,
        funnelPurchases,
        funnelRepurchases,
        storeRanking,
        baRanking,
        baDeltasByBaId,
        baTargetsByBaId,
        baSparklineByBaId,
        baAlertsByBaId,
        storeSparklineByStoreId,
        storeBasByStoreId,
        storeAlertsByStoreId,
        storeTargetsByStoreId,
        strategicInsights,
        complianceData,
        adoptionData,
        brandTrend,
        users,
        products,
        templates,
        auditEvents,
        privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
        storeLookup,
      }}
    />
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function countInteractions(
  staff: Admin,
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
  return items.length;
}

async function countRecommendations(
  staff: Admin,
  filters: ReturnType<typeof parseFilters>,
): Promise<number> {
  const { storeIds, brands, isEmpty } = mergeScope(staff, filters);
  if (isEmpty) return 0;
  const items = await recommendationRepository.list({ storeIds, brands });
  return items.filter((r) => {
    const at = new Date(r.at);
    return at >= filters.period.from && at < filters.period.to;
  }).length;
}

async function listRecentInteractions() {
  const since = addDays(startOfDay(new Date()), -7);
  return interactionRepository.list({ from: since, to: new Date() });
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

function bucketAlertsByStore(
  alerts: readonly OperationalAlert[],
  ranking: readonly StoreRankingEntry[],
): Map<StoreId, OperationalAlert[]> {
  const out = new Map<StoreId, OperationalAlert[]>();
  for (const s of ranking) out.set(s.storeId, []);
  for (const a of alerts) {
    if (!a.affectedIds) continue;
    for (const id of a.affectedIds) {
      const storeId = id as StoreId;
      if (!out.has(storeId)) continue;
      out.get(storeId)!.push(a);
    }
  }
  return out;
}

/**
 * Approximate per-store reco→purchase rate using the BA-level ranking.
 * The Etapa 1 query returns this metric per BA; aggregating to store-level
 * exactly would require an extra query — averaging the BAs of the store is
 * a reasonable proxy for the Admin's Strategic insight 2.
 */
function estimateStoreConvReco(
  store: StoreRankingEntry,
  ranking: readonly BaRankingEntry[],
): number {
  const bas = ranking.filter((b) => b.storeId === store.storeId);
  if (bas.length === 0) return 0;
  return bas.reduce((s, b) => s + b.conversionRate, 0) / bas.length;
}
