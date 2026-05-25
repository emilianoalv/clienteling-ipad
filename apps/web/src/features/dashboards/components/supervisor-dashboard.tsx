"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Donut,
  Funnel,
  LineChart,
  Sparkline,
  SplitBar,
  type DonutSegment,
  type FunnelStage,
} from "@/components/charts";
import { Chip, Icon, ProgressBar } from "@/components/primitives";
import { cn } from "@/lib/cn";
import { formatDateRelative } from "@/lib/format/date";
import {
  formatCount,
  formatCurrencyCompact,
  formatPercent,
  formatPercentChange,
  formatPercentDelta,
} from "@/lib/format/number";
import type { Supervisor } from "@/types/staff";
import type { StoreId } from "@/types/store";
import type {
  BaRankingEntry,
  OperationalAlert,
  PeriodDeltaResult,
  SalesByBrandResult,
  SalesByCategory,
  SparklineBucket,
  TopClient,
  TopProduct,
} from "../server/queries";
import type { DashboardFilters } from "../server/types";
import {
  toSparklinePoints,
  toSplitBarData,
} from "../lib/adapters";
import {
  computeCoachingInsights,
  type CoachingInsight,
} from "../lib/coaching-insights";
import type { BrandCounterAverages } from "../lib/counter-averages";
import type { BestPracticeInsight } from "../lib/best-practices";
import { computeForecastWithSimulation } from "../lib/pacing";
import type { StoreHealth } from "../lib/store-health";
import {
  exportAgendaReport,
  exportBaRanking,
  exportBrandComparison,
  exportClientsReport,
} from "../server/actions";
import {
  AlertBanner,
  AlertCard,
  BADrillDownModal,
  DashBlock,
  DashHeader,
  ExportButton,
  FilterBar,
  HeroBlock,
  StoreDrillDownModal,
  StoreHealthCard,
  type BaDrillDownData,
  type Severity,
  type StoreDrillDownData,
} from "./_shared";

const CATEGORY_COLORS: Record<keyof SalesByCategory, string> = {
  Skincare: "hsl(212, 50%, 45%)",
  Makeup: "hsl(345, 65%, 50%)",
  Fragancia: "hsl(38, 60%, 50%)",
  Unmapped: "hsl(215, 16%, 47%)",
};

export interface StoreSnapshot {
  storeId: StoreId;
  storeName: string;
  salesAmount: number;
  monthlyTarget: number;
  salesByBrand: SalesByBrandResult;
  recoRate: number;
  sampleRate: number;
  avgTicket: number;
  newClientsCount: number;
  activeClients: number;
  atRiskClients: number;
  baActive: number;
  baTotal: number;
  sparklineValues: readonly number[];
  criticalAlertsCount: number;
  yoy?: number;
}

export interface SupervisorDashboardData {
  // Zone aggregates
  salesAmount: number;
  salesDelta: PeriodDeltaResult;
  sparklineData: readonly SparklineBucket[];
  averageTicket: number;
  recoToPurchaseRate: number;
  salesByBrand: SalesByBrandResult;
  salesByCategory: SalesByCategory;
  topProductsLcm: readonly TopProduct[];
  topProductsYsl: readonly TopProduct[];
  activeClients: number;
  atRiskClients: number;
  repurchaseRate: number;
  topClients: readonly TopClient[];
  operationalAlerts: readonly OperationalAlert[];
  appointmentsTotal: number;
  appointmentsCanceled: number;
  funnelInteractions: number;
  funnelRecommendations: number;
  funnelPurchases: number;
  funnelRepurchases: number;
  // Cross-store + BA
  baRanking: readonly BaRankingEntry[];
  // Plain Records (no Map) — Map no es serializable por RSC al pasar
  // desde Server Component a Client Component. Causaba "TypeError:
  // Error in input stream" en runtime para Supervisor.
  baDeltasByBaId: Readonly<Record<string, number>>;
  baTargetsByBaId: Readonly<Record<string, number>>;
  baSparklineByBaId: Readonly<Record<string, readonly SparklineBucket[]>>;
  baAlertsByBaId: Readonly<Record<string, readonly OperationalAlert[]>>;
  counterAveragesByBrand: Readonly<Record<string, BrandCounterAverages>>;
  storeSnapshots: readonly StoreSnapshot[];
  storeHealthById: Readonly<Record<string, StoreHealth>>;
  bestPractices: readonly BestPracticeInsight[];
  multiSeriesTrend: {
    labels: readonly string[];
    series: ReadonlyArray<{ label: string; values: readonly number[] }>;
  };
}

export interface SupervisorDashboardProps {
  staff: Supervisor;
  zoneName: string;
  zoneTarget: number;
  filters: DashboardFilters;
  data: SupervisorDashboardData;
}

export function SupervisorDashboard({
  staff,
  zoneName,
  zoneTarget,
  filters,
  data,
}: SupervisorDashboardProps) {
  const [baDrillDown, setBaDrillDown] = useState<BaDrillDownData | null>(null);
  const [storeDrillDown, setStoreDrillDown] = useState<StoreDrillDownData | null>(
    null,
  );

  const split = toSplitBarData(data.salesByBrand);
  const sparklineValues = toSparklinePoints([...data.sparklineData]);
  const ratioPct =
    zoneTarget > 0 ? Math.round((data.salesAmount / zoneTarget) * 100) : 0;

  const worstStore = pickWorstStore(data.storeSnapshots);
  const forecast = computeForecastWithSimulation({
    salesAmount: data.salesAmount,
    monthlyTarget: zoneTarget,
    period: filters.period,
    worstPerformer:
      worstStore && worstStore.deficit > 0
        ? { name: worstStore.name, deficit: worstStore.deficit }
        : undefined,
  });

  // computeCoachingInsights consume Maps internamente. Las props llegan
  // como Records (no Map para evitar RSC payload error); reconstruimos
  // los Maps aquí para preservar la API de la lib sin tocarla.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const insights = computeCoachingInsights({
    ranking: data.baRanking,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deltas: new Map(Object.entries(data.baDeltasByBaId)) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    counterAveragesByBrand: new Map(Object.entries(data.counterAveragesByBrand)) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    targetsByBa: new Map(Object.entries(data.baTargetsByBaId)) as any,
  });

  const criticalAlerts = data.operationalAlerts
    .filter((a) => a.severity === "critical")
    .map(toBannerItem);

  const greenStores = data.storeSnapshots.filter(
    (s) => data.storeHealthById[s.storeId]?.grade === "verde",
  ).length;
  const activeBaZone = data.storeSnapshots.reduce(
    (sum, s) => sum + s.baActive,
    0,
  );
  const totalBaZone = data.storeSnapshots.reduce(
    (sum, s) => sum + s.baTotal,
    0,
  );

  const handleBaClick = (entry: BaRankingEntry) => {
    setBaDrillDown({
      entry,
      monthlyTarget: data.baTargetsByBaId[entry.baId] ?? 0,
      growthPct: data.baDeltasByBaId[entry.baId] ?? 0,
      sparklineValues: (data.baSparklineByBaId[entry.baId] ?? []).map(
        (b) => b.value,
      ),
      alerts: data.baAlertsByBaId[entry.baId] ?? [],
    });
  };

  const handleStoreClick = (snapshot: StoreSnapshot) => {
    const health = data.storeHealthById[snapshot.storeId];
    if (!health) return;
    const storeBas = data.baRanking.filter(
      (b) => b.storeId === snapshot.storeId,
    );
    const storeAlerts = data.operationalAlerts.filter(
      (a) =>
        (a.affectedIds ?? []).some(
          (id) => (id as unknown as StoreId) === snapshot.storeId,
        ) ||
        storeBas.some((b) =>
          (a.affectedIds ?? []).some((id) => id === b.baId),
        ),
    );
    setStoreDrillDown({
      storeName: snapshot.storeName,
      health,
      sales: { current: snapshot.salesAmount, target: snapshot.monthlyTarget },
      yoy: snapshot.yoy,
      baRanking: storeBas,
      sparklineValues: snapshot.sparklineValues,
      alerts: storeAlerts,
    });
  };

  return (
    <div className="bg-bone min-h-full">
      <DashHeader
        subtitle={`Supervisor de zona · ${staff.name} · ${zoneName}`}
        title="Mis tiendas"
        actions={
          <>
            <FilterBar
              roleConfig={{
                period: true,
                store: true,
                brand: true,
                baId: true,
              }}
              scopeOptions={{
                stores: data.storeSnapshots.map((s) => ({
                  id: s.storeId,
                  label: s.storeName,
                })),
                bas: data.baRanking.map((b) => ({
                  id: b.baId,
                  label: b.name,
                })),
              }}
            />
            <ExportButton filters={filters} onExport={exportBaRanking} />
          </>
        }
      />

      <AlertBanner alerts={criticalAlerts} />

      <div className="px-7 py-6 flex flex-col gap-6">
        <HeroBlock
          main={
            <HeroMain
              salesAmount={data.salesAmount}
              zoneTarget={zoneTarget}
              ratioPct={ratioPct}
              salesDelta={data.salesDelta}
              sparklineValues={sparklineValues}
              forecastText={forecast.text}
              ahead={
                ratioPct >= 100 ||
                (forecast.simulatedProjection ?? 0) > zoneTarget
              }
            />
          }
          side={[
            <HeroBrandMix key="mix" split={split} />,
            <HeroStoresHealth
              key="stores"
              green={greenStores}
              total={data.storeSnapshots.length}
            />,
            <HeroBaCount key="bas" active={activeBaZone} total={totalBaZone} />,
          ]}
        />

        {/* Sec 1 — Semáforo + Store Health */}
        <DashBlock title="Semáforo + Store Health Score">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.storeSnapshots.map((s) => {
              const health = data.storeHealthById[s.storeId];
              if (!health) return null;
              return (
                <StoreHealthCard
                  key={s.storeId}
                  storeName={s.storeName}
                  health={health}
                  sales={{ current: s.salesAmount, target: s.monthlyTarget }}
                  yoy={s.yoy}
                  baAdoption={
                    s.baTotal > 0 ? (s.baActive / s.baTotal) * 100 : 0
                  }
                  alertsCount={s.criticalAlertsCount}
                  onClick={() => handleStoreClick(s)}
                />
              );
            })}
          </div>
        </DashBlock>

        {/* Sec 2 — Coaching + Ranking BAs cross-store */}
        <DashBlock title="Coaching + Ranking BAs cross-store">
          {insights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {insights.map((ins, i) => (
                <CoachingInsightCard key={i} insight={ins} />
              ))}
            </div>
          ) : null}
          <CrossStoreRankingTable
            ranking={data.baRanking}
            targets={data.baTargetsByBaId}
            counterAvgByBrand={data.counterAveragesByBrand}
            onSelect={handleBaClick}
          />
        </DashBlock>

        {/* Sec 3 — Best Practices */}
        <DashBlock title="Mejores prácticas de la zona">
          {data.bestPractices.length === 0 ? (
            <EmptyState message="Las tiendas de la zona están parejas — no hay brechas > 15% para destacar." />
          ) : (
            <ul className="list-none m-0 p-0 grid gap-3">
              {data.bestPractices.map((bp, i) => (
                <li key={i}>
                  <BestPracticeCard insight={bp} />
                </li>
              ))}
            </ul>
          )}
        </DashBlock>

        {/* Sec 4 — Tendencias zona vs tiendas */}
        <DashBlock title="Tendencias zona vs tiendas">
          <div className="bg-white border border-line rounded-lg p-4">
            {data.multiSeriesTrend.series.length === 0 ||
            data.multiSeriesTrend.labels.length < 2 ? (
              <EmptyState message="Aún no hay datos suficientes para mostrar tendencias. Vuelve en unos días." />
            ) : (
              <LineChart
                series={data.multiSeriesTrend.series.map(
                  (s) => s.values,
                )}
                labels={
                  trimLabels(data.multiSeriesTrend.labels) as readonly string[]
                }
                legend={data.multiSeriesTrend.series.map((s) => s.label)}
              />
            )}
          </div>
        </DashBlock>

        {/* Sec 5 — Conversion Funnel zona */}
        <DashBlock title="Conversion Funnel zona">
          <div className="bg-white border border-line rounded-lg p-4">
            <Funnel stages={buildFunnel(data)} />
          </div>
        </DashBlock>

        {/* Sec 6 — Comparativa marcas zona */}
        <DashBlock
          title="Comparativa marcas zona"
          right={
            <ExportButton filters={filters} onExport={exportBrandComparison} label="Exportar marcas" />
          }
        >
          <BrandComparisonByStore
            salesByBrand={data.salesByBrand}
            storeSnapshots={data.storeSnapshots}
          />
        </DashBlock>

        {/* Sec 7 — Side-by-side */}
        <DashBlock title="Side-by-side · tienda fuerte vs débil">
          <SideBySide snapshots={data.storeSnapshots} />
        </DashBlock>

        {/* Sec 8 — Alertas + Operación */}
        <DashBlock
          title="Alertas + Operación"
          right={
            <div className="flex items-center gap-2">
              <ExportButton filters={filters} onExport={exportAgendaReport} label="Exportar agenda" />
              <ExportButton filters={filters} onExport={exportClientsReport} label="Exportar clientes" />
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <OperationStats
              appointments={data.appointmentsTotal}
              canceled={data.appointmentsCanceled}
              pendingFollowups={0 /* aggregated downstream */}
              upcomingReplenishments={0 /* not aggregated for zone scope */}
            />
            <OperationalAlertsList alerts={data.operationalAlerts} />
          </div>
        </DashBlock>

        {/* Mix de productos zona — bonus (no es sección numerada, pero útil) */}
        <DashBlock title="Mix de productos zona">
          <div className="bg-white border border-line rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-center">
              <CategoryDonut salesByCategory={data.salesByCategory} />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <TopProductsList label="Lancôme" products={data.topProductsLcm} />
              <TopProductsList label="YSL" products={data.topProductsYsl} />
            </div>
          </div>
        </DashBlock>

        {/* Top clientes zona */}
        <DashBlock title="Top clientes de la zona">
          <div className="bg-white border border-line rounded-lg p-4">
            <TopClientsList clients={data.topClients} />
          </div>
        </DashBlock>
      </div>

      <BADrillDownModal
        open={baDrillDown !== null}
        onClose={() => setBaDrillDown(null)}
        data={baDrillDown}
      />
      <StoreDrillDownModal
        open={storeDrillDown !== null}
        onClose={() => setStoreDrillDown(null)}
        data={storeDrillDown}
      />
    </div>
  );
}

// ── Hero pieces ──────────────────────────────────────────────────────────────

function HeroMain({
  salesAmount,
  zoneTarget,
  ratioPct,
  salesDelta,
  sparklineValues,
  forecastText,
  ahead,
}: {
  salesAmount: number;
  zoneTarget: number;
  ratioPct: number;
  salesDelta: PeriodDeltaResult;
  sparklineValues: number[];
  forecastText: string;
  ahead: boolean;
}) {
  const tone =
    salesDelta.deltaPct > 0
      ? "text-ok"
      : salesDelta.deltaPct < 0
      ? "text-err"
      : "text-ink/60";
  return (
    <article className="bg-white border border-line rounded-lg p-5 flex flex-col gap-3 h-full">
      <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        Ventas de la zona
      </span>
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="font-display text-[40px] leading-none tabular">
          {formatCurrencyCompact(salesAmount)}
        </span>
        <span className="text-[18px] text-ink/60">
          / {zoneTarget > 0 ? formatCurrencyCompact(zoneTarget) : "sin meta"}
        </span>
        {zoneTarget > 0 ? (
          <span className="text-[20px] font-semibold tabular">{ratioPct}%</span>
        ) : null}
        <span className={cn("text-[16px] font-semibold tabular", tone)}>
          {formatPercentChange(salesDelta.deltaPct)}
        </span>
      </div>
      {zoneTarget > 0 ? (
        <ProgressBar
          value={Math.min(1, salesAmount / zoneTarget)}
          tone={ratioPct >= 100 ? "ok" : ratioPct >= 70 ? "warn" : "danger"}
        />
      ) : null}
      <Sparkline values={sparklineValues} />
      {forecastText ? (
        <p
          className={cn(
            "m-0 text-[15px] leading-snug",
            ahead ? "text-ok" : "text-err",
          )}
        >
          {forecastText}
        </p>
      ) : null}
    </article>
  );
}

function HeroBrandMix({
  split,
}: {
  split: { lancome: number; ysl: number; total: number };
}) {
  const lcmPct = split.total > 0 ? Math.round((split.lancome / split.total) * 100) : 0;
  return (
    <article className="bg-white border border-line rounded-lg p-4 flex flex-col gap-2 h-full">
      <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        Mix marcas zona
      </span>
      <SplitBar
        a={split.lancome}
        b={split.ysl}
        aLabel="Lancôme"
        bLabel="YSL"
        aClassName="bg-lancome-rose-deep"
        bClassName="bg-ink"
      />
      <span className="text-[14px] text-ink/60">
        {lcmPct}% Lancôme · {100 - lcmPct}% YSL
      </span>
    </article>
  );
}

function HeroStoresHealth({
  green,
  total,
}: {
  green: number;
  total: number;
}) {
  return (
    <article className="bg-white border border-line rounded-lg p-4 flex flex-col gap-2 h-full">
      <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        Tiendas en verde
      </span>
      <span className="font-display text-[32px] leading-none tabular">
        {green} <span className="text-[18px] text-ink/60">de {total}</span>
      </span>
      <span className="text-[14px] text-ink/60">Health Score ≥ 80</span>
    </article>
  );
}

function HeroBaCount({ active, total }: { active: number; total: number }) {
  return (
    <article className="bg-white border border-line rounded-lg p-4 flex flex-col gap-2 h-full">
      <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        BAs activos zona
      </span>
      <span className="font-display text-[32px] leading-none tabular">
        {active} <span className="text-[18px] text-ink/60">de {total}</span>
      </span>
      <span className="text-[14px] text-ink/60">
        {total > 0 ? Math.round((active / total) * 100) : 0}% del equipo
      </span>
    </article>
  );
}

// ── Sec 2 — Coaching + Ranking ───────────────────────────────────────────────

function CoachingInsightCard({ insight }: { insight: CoachingInsight }) {
  return (
    <AlertCard
      severity={insight.severity as Severity}
      title={insight.title}
      description={insight.description}
    />
  );
}

function CrossStoreRankingTable({
  ranking,
  targets,
  counterAvgByBrand,
  onSelect,
}: {
  ranking: readonly BaRankingEntry[];
  targets: Readonly<Record<string, number>>;
  counterAvgByBrand: Readonly<Record<string, BrandCounterAverages>>;
  onSelect: (entry: BaRankingEntry) => void;
}) {
  if (ranking.length === 0) {
    return <EmptyState message="No hay BAs en el scope actual." />;
  }
  const topQuartile = Math.max(1, Math.ceil(ranking.length / 4));

  return (
    <div className="bg-white border border-line rounded-lg p-4 overflow-x-auto">
      <div className="grid grid-cols-[1.2fr_1fr_0.6fr_1fr_0.7fr_0.8fr_0.9fr] gap-3 px-1 pb-2 border-b border-line text-[14px] font-semibold tracking-[0.12em] uppercase text-ink/60 min-w-[720px]">
        <span>BA</span>
        <span>Tienda</span>
        <span>Marca</span>
        <span>Ventas</span>
        <span>% obj</span>
        <span>Conv</span>
        <span>Estado</span>
      </div>
      <ul className="list-none m-0 p-0">
        {ranking.map((entry, i) => {
          const target = targets[entry.baId] ?? 0;
          const ratio = target > 0 ? entry.salesAmount / target : 0;
          const ratioPct = target > 0 ? Math.round(ratio * 100) : null;
          const brandAvg = counterAvgByBrand[entry.brand];
          const convGap =
            brandAvg !== undefined
              ? entry.conversionRate - brandAvg.avgConversionRate
              : 0;
          const status = computeStatus({
            rank: i,
            topQuartile,
            ratio,
            convGap,
          });
          return (
            <li key={entry.baId}>
              <button
                type="button"
                onClick={() => onSelect(entry)}
                className="w-full text-left grid grid-cols-[1.2fr_1fr_0.6fr_1fr_0.7fr_0.8fr_0.9fr] gap-3 items-center px-1 py-2.5 border-b border-dashed border-line last:border-b-0 cursor-pointer hover:bg-bone rounded min-w-[720px]"
              >
                <span className="text-[16px] font-medium">{entry.name}</span>
                <span className="text-[15px] text-ink/60">{entry.storeName}</span>
                <span>
                  <Chip variant={entry.brand === "YSL" ? "ysl" : "lancome"}>
                    {entry.brand}
                  </Chip>
                </span>
                <span className="text-[16px] font-semibold tabular">
                  {formatCurrencyCompact(entry.salesAmount)}
                </span>
                <span
                  className={cn(
                    "text-[16px] font-semibold tabular",
                    ratioPct === null
                      ? "text-ink/60"
                      : ratioPct >= 100
                      ? "text-ok"
                      : ratioPct >= 70
                      ? "text-warn"
                      : "text-err",
                  )}
                >
                  {ratioPct === null ? "—" : `${ratioPct}%`}
                </span>
                <span className="text-[16px] tabular">
                  {formatPercent(entry.conversionRate)}
                </span>
                <StatusChip status={status} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type BaStatus = "top" | "warning" | "urgent" | "neutral";

function computeStatus(input: {
  rank: number;
  topQuartile: number;
  ratio: number;
  convGap: number;
}): BaStatus {
  if (input.ratio > 0 && input.ratio < 0.7) return "urgent";
  if (input.rank < input.topQuartile) return "top";
  if (input.convGap < -5) return "warning";
  return "neutral";
}

function StatusChip({ status }: { status: BaStatus }) {
  switch (status) {
    case "top":
      return (
        <span className="text-[14px] font-semibold uppercase tracking-[0.04em] text-ok px-2 rounded-pill border border-ok/20 bg-ok/10 w-fit">
          ✓ Top
        </span>
      );
    case "warning":
      return (
        <span className="text-[14px] font-semibold uppercase tracking-[0.04em] text-warn px-2 rounded-pill border border-warn/20 bg-warn/10 w-fit">
          Conv baja
        </span>
      );
    case "urgent":
      return (
        <span className="text-[14px] font-semibold uppercase tracking-[0.04em] text-err px-2 rounded-pill border border-err/20 bg-err/10 w-fit">
          Urgente
        </span>
      );
    case "neutral":
      return <span className="text-[14px] text-ink/40">—</span>;
  }
}

// ── Sec 3 — Best Practices ───────────────────────────────────────────────────

function BestPracticeCard({ insight }: { insight: BestPracticeInsight }) {
  const title = `${insight.winnerStore} supera a ${insight.loserStore} en ${insight.metricLabel} (+${insight.differencePercent}%)`;
  return (
    <AlertCard
      severity="info"
      title={title}
      description={insight.suggestion}
    />
  );
}

// ── Sec 5 — Funnel ───────────────────────────────────────────────────────────

function buildFunnel(data: SupervisorDashboardData): FunnelStage[] {
  return [
    { label: "Interacciones registradas", count: data.funnelInteractions },
    { label: "Recomendaciones hechas", count: data.funnelRecommendations },
    { label: "Compras tras recomendación", count: data.funnelPurchases },
    { label: "Recompra en 90 días", count: data.funnelRepurchases },
  ];
}

// ── Sec 6 — Comparativa marcas zona (per-store breakdown) ────────────────────

function BrandComparisonByStore({
  salesByBrand,
  storeSnapshots,
}: {
  salesByBrand: SalesByBrandResult;
  storeSnapshots: readonly StoreSnapshot[];
}) {
  const total = salesByBrand.Lancome.salesAmount + salesByBrand.YSL.salesAmount;
  return (
    <div className="bg-white border border-line rounded-lg p-4 flex flex-col gap-4">
      <div>
        <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          Mix de la zona
        </span>
        <SplitBar
          a={salesByBrand.Lancome.salesAmount}
          b={salesByBrand.YSL.salesAmount}
          aLabel="Lancôme"
          bLabel="YSL"
          aClassName="bg-lancome-rose-deep"
          bClassName="bg-ink"
        />
        <div className="grid grid-cols-2 gap-3 text-[15px] mt-2">
          <div>
            <div className="text-ink/60">Lancôme</div>
            <div className="font-semibold tabular text-[18px]">
              {formatCurrencyCompact(salesByBrand.Lancome.salesAmount)}
            </div>
            <div className="text-[14px] text-ink/60">
              {total > 0
                ? `${Math.round((salesByBrand.Lancome.salesAmount / total) * 100)}%`
                : "0%"}
            </div>
          </div>
          <div>
            <div className="text-ink/60">YSL</div>
            <div className="font-semibold tabular text-[18px]">
              {formatCurrencyCompact(salesByBrand.YSL.salesAmount)}
            </div>
            <div className="text-[14px] text-ink/60">
              {total > 0
                ? `${Math.round((salesByBrand.YSL.salesAmount / total) * 100)}%`
                : "0%"}
            </div>
          </div>
        </div>
      </div>

      <div>
        <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          Por tienda
        </span>
        <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-3 px-1 pb-2 mt-2 border-b border-line text-[14px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          <span>Tienda</span>
          <span>Lancôme</span>
          <span>YSL</span>
        </div>
        <ul className="list-none m-0 p-0">
          {storeSnapshots.map((s) => (
            <li
              key={s.storeId}
              className="grid grid-cols-[1.4fr_1fr_1fr] gap-3 items-baseline px-1 py-2 border-b border-dashed border-line last:border-b-0"
            >
              <span className="text-[16px] font-medium">{s.storeName}</span>
              <span className="text-[16px] font-semibold tabular">
                {formatCurrencyCompact(s.salesByBrand.Lancome.salesAmount)}
              </span>
              <span className="text-[16px] font-semibold tabular">
                {formatCurrencyCompact(s.salesByBrand.YSL.salesAmount)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Sec 7 — Side-by-side ─────────────────────────────────────────────────────

function SideBySide({
  snapshots,
}: {
  snapshots: readonly StoreSnapshot[];
}) {
  if (snapshots.length < 2) {
    return (
      <EmptyState message="Necesitas al menos 2 tiendas en el scope para comparar." />
    );
  }
  const sorted = [...snapshots].sort((a, b) => {
    const ar = a.monthlyTarget > 0 ? a.salesAmount / a.monthlyTarget : 0;
    const br = b.monthlyTarget > 0 ? b.salesAmount / b.monthlyTarget : 0;
    return br - ar;
  });
  const strong = sorted[0]!;
  const weak = sorted[sorted.length - 1]!;
  if (strong.storeId === weak.storeId) {
    return (
      <EmptyState message="Las tiendas comparten desempeño — sin contraste para destacar." />
    );
  }

  const rows: ReadonlyArray<{
    label: string;
    strong: string;
    weak: string;
    delta: string;
    tone: "ok" | "err" | "neutral";
  }> = [
    {
      label: "Ventas mes",
      strong: formatCurrencyCompact(strong.salesAmount),
      weak: formatCurrencyCompact(weak.salesAmount),
      delta: pctChange(weak.salesAmount, strong.salesAmount),
      tone: signTone(weak.salesAmount - strong.salesAmount),
    },
    {
      label: "% objetivo",
      strong: pctOf(strong.salesAmount, strong.monthlyTarget),
      weak: pctOf(weak.salesAmount, weak.monthlyTarget),
      delta: ppChange(
        pctOfNumber(weak.salesAmount, weak.monthlyTarget),
        pctOfNumber(strong.salesAmount, strong.monthlyTarget),
      ),
      tone: signTone(
        pctOfNumber(weak.salesAmount, weak.monthlyTarget) -
          pctOfNumber(strong.salesAmount, strong.monthlyTarget),
      ),
    },
    {
      label: "Ticket promedio",
      strong: formatCurrencyCompact(strong.avgTicket),
      weak: formatCurrencyCompact(weak.avgTicket),
      delta: pctChange(weak.avgTicket, strong.avgTicket),
      tone: signTone(weak.avgTicket - strong.avgTicket),
    },
    {
      label: "Conv reco→compra",
      strong: formatPercent(strong.recoRate),
      weak: formatPercent(weak.recoRate),
      delta: ppChange(weak.recoRate, strong.recoRate),
      tone: signTone(weak.recoRate - strong.recoRate),
    },
    {
      label: "Adopción BAs",
      strong: formatPercent(
        strong.baTotal > 0 ? (strong.baActive / strong.baTotal) * 100 : 0,
      ),
      weak: formatPercent(
        weak.baTotal > 0 ? (weak.baActive / weak.baTotal) * 100 : 0,
      ),
      delta: ppChange(
        weak.baTotal > 0 ? (weak.baActive / weak.baTotal) * 100 : 0,
        strong.baTotal > 0 ? (strong.baActive / strong.baTotal) * 100 : 0,
      ),
      tone: signTone(
        (weak.baActive / Math.max(1, weak.baTotal)) -
          (strong.baActive / Math.max(1, strong.baTotal)),
      ),
    },
    {
      label: "Clientes activos",
      strong: formatCount(strong.activeClients),
      weak: formatCount(weak.activeClients),
      delta: pctChange(weak.activeClients, strong.activeClients),
      tone: signTone(weak.activeClients - strong.activeClients),
    },
  ];

  return (
    <div className="bg-white border border-line rounded-lg p-4 overflow-x-auto">
      <div className="grid grid-cols-[1.4fr_1fr_1fr_0.7fr] gap-3 px-1 pb-2 border-b border-line text-[14px] font-semibold tracking-[0.12em] uppercase text-ink/60 min-w-[560px]">
        <span>Métrica</span>
        <span>{strong.storeName}</span>
        <span>{weak.storeName}</span>
        <span>Δ</span>
      </div>
      <ul className="list-none m-0 p-0 min-w-[560px]">
        {rows.map((r) => (
          <li
            key={r.label}
            className="grid grid-cols-[1.4fr_1fr_1fr_0.7fr] gap-3 items-baseline px-1 py-2.5 border-b border-dashed border-line last:border-b-0"
          >
            <span className="text-[16px]">{r.label}</span>
            <span className="text-[16px] font-semibold tabular">{r.strong}</span>
            <span className="text-[16px] tabular">{r.weak}</span>
            <span
              className={cn(
                "text-[16px] font-semibold tabular",
                r.tone === "ok"
                  ? "text-ok"
                  : r.tone === "err"
                  ? "text-err"
                  : "text-ink/60",
              )}
            >
              {r.delta}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Sec 8 — Operación + Acción ───────────────────────────────────────────────

function OperationStats({
  appointments,
  canceled,
  pendingFollowups,
  upcomingReplenishments,
}: {
  appointments: number;
  canceled: number;
  pendingFollowups: number;
  upcomingReplenishments: number;
}) {
  return (
    <div className="bg-white border border-line rounded-lg p-4 grid grid-cols-2 gap-3">
      <Stat label="Citas del período" value={formatCount(appointments)} />
      <Stat
        label="Canceladas / no-show"
        value={formatCount(canceled)}
        dotTone={canceled > 0 ? "warn" : null}
      />
      <Stat
        label="Follow-ups pendientes"
        value={formatCount(pendingFollowups)}
      />
      <Stat
        label="Eventos 30d (repos.)"
        value={formatCount(upcomingReplenishments)}
      />
    </div>
  );
}

function OperationalAlertsList({
  alerts,
}: {
  alerts: readonly OperationalAlert[];
}) {
  const nonCritical = alerts.filter((a) => a.severity !== "critical");
  if (nonCritical.length === 0) {
    return (
      <div className="bg-white border border-line rounded-lg p-4 flex items-center justify-center min-h-[120px]">
        <p className="m-0 text-[15px] text-ink/60">
          Sin alertas warning o info en este período.
        </p>
      </div>
    );
  }
  return (
    <ul className="list-none m-0 p-0 grid gap-2">
      {nonCritical.slice(0, 6).map((a) => (
        <li key={a.id}>
          <AlertCard
            severity={a.severity as Severity}
            title={a.title}
            description={a.description}
            action={a.link ? { label: "Ver", href: a.link } : undefined}
          />
        </li>
      ))}
    </ul>
  );
}

// ── Mix productos zona ──────────────────────────────────────────────────────

function CategoryDonut({ salesByCategory }: { salesByCategory: SalesByCategory }) {
  const segments: DonutSegment[] = (
    Object.entries(salesByCategory) as Array<[keyof SalesByCategory, number]>
  )
    .filter(([key, value]) => value > 0 && key !== "Unmapped")
    .map(([key, value]) => ({
      label: key,
      value,
      color: CATEGORY_COLORS[key],
    }));
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (segments.length === 0) {
    return (
      <EmptyState message="Sin ventas registradas en este período. Prueba ampliando el rango." />
    );
  }
  return (
    <Donut
      segments={segments}
      centerLabel={formatCurrencyCompact(total)}
      centerSub="período"
    />
  );
}

function TopProductsList({
  label,
  products,
}: {
  label: string;
  products: readonly TopProduct[];
}) {
  return (
    <div>
      <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
        Top {label}
      </div>
      {products.length === 0 ? (
        <p className="m-0 text-[15px] text-ink/60">Sin ventas en este período.</p>
      ) : (
        <ul className="list-none m-0 p-0 divide-y divide-line">
          {products.slice(0, 5).map((p) => (
            <li
              key={p.sku}
              className="grid grid-cols-[1fr_auto] gap-2 py-1.5 text-[15px]"
            >
              <span>{p.productName}</span>
              <span className="font-semibold tabular">
                {formatCurrencyCompact(p.revenue)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TopClientsList({ clients }: { clients: readonly TopClient[] }) {
  if (clients.length === 0) {
    return <EmptyState message="Aún no hay clientes registrados en la zona." />;
  }
  return (
    <ul className="list-none m-0 p-0 divide-y divide-line">
      {clients.slice(0, 10).map((c) => (
        <li key={c.clientId} className="py-2">
          <Link
            href={`/ba/clients/${c.clientId}`}
            className="grid grid-cols-[1fr_auto] gap-2 no-underline text-ink hover:bg-bone -mx-2 px-2 rounded"
          >
            <span className="flex flex-col">
              <span className="text-[16px] leading-snug font-medium">
                {c.name}
              </span>
              <span className="text-[14px] text-ink/60">
                {c.visitsCount} visitas · última{" "}
                {c.lastVisitDate
                  ? formatDateRelative(c.lastVisitDate)
                  : "—"}
              </span>
            </span>
            <span className="text-[16px] font-semibold tabular self-center">
              {formatCurrencyCompact(c.totalSpent)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ── Shared helpers ───────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  dotTone,
}: {
  label: string;
  value: string;
  dotTone?: "warn" | "err" | null;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-[28px] leading-none tabular">{value}</span>
        {dotTone ? (
          <span
            aria-hidden
            className={cn(
              "w-2.5 h-2.5 rounded-full",
              dotTone === "warn" ? "bg-warn" : "bg-err",
            )}
          />
        ) : null}
      </div>
      <span className="text-[14px] text-ink/60">{label}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 px-4 gap-2">
      <Icon name="sparkle" size={20} className="text-ink/30" />
      <p className="m-0 text-[15px] text-ink/60 max-w-[36ch]">{message}</p>
    </div>
  );
}

function pickWorstStore(
  snapshots: readonly StoreSnapshot[],
): { name: string; deficit: number } | null {
  if (snapshots.length < 2) return null;
  const avg =
    snapshots.reduce((s, e) => s + e.salesAmount, 0) / snapshots.length;
  let worst = snapshots[0]!;
  for (const s of snapshots) {
    if (s.salesAmount < worst.salesAmount) worst = s;
  }
  const deficit = Math.max(0, avg - worst.salesAmount);
  return { name: worst.storeName, deficit };
}

function toBannerItem(a: OperationalAlert) {
  return {
    severity: a.severity as Severity,
    title: a.title,
    description: a.description,
    action: a.link ? { label: "Ver", href: a.link } : undefined,
  };
}

function signTone(value: number): "ok" | "err" | "neutral" {
  if (value > 0) return "ok";
  if (value < 0) return "err";
  return "neutral";
}

function pctChange(weak: number, strong: number): string {
  if (strong === 0) return "—";
  return formatPercentChange(((weak - strong) / strong) * 100);
}

function ppChange(weak: number, strong: number): string {
  return formatPercentDelta(weak - strong);
}

function pctOf(numerator: number, denominator: number): string {
  if (denominator <= 0) return "—";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

function pctOfNumber(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return (numerator / denominator) * 100;
}

function trimLabels(labels: readonly string[]): string[] {
  // Show at most ~6 labels evenly spaced; replace with empty strings between.
  const max = 6;
  if (labels.length <= max) return [...labels].map(formatLabel);
  const step = Math.ceil(labels.length / max);
  return labels.map((l, i) => (i % step === 0 ? formatLabel(l) : ""));
}

function formatLabel(iso: string): string {
  // Labels from toMultiSeriesLineData are ISO timestamps; show day + month abbr.
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
  }).format(date);
}
