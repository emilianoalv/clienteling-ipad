"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Donut,
  Funnel,
  LineChart,
  SplitBar,
  type DonutSegment,
  type FunnelStage,
} from "@/components/charts";
import { Chip, Icon, ProgressBar } from "@/components/primitives";
import { cn } from "@/lib/cn";
import { formatDateRelative } from "@/lib/format/date";
import {
  buildXAxisLabels,
  formatPeriodTitle,
} from "../lib/chart-labels";
import {
  formatCount,
  formatCurrencyCompact,
  formatPercent,
  formatPercentChange,
} from "@/lib/format/number";
import type { BrandId } from "@/types/brand";
import type { Gerente, StaffId } from "@/types/staff";
import type {
  BaRankingEntry,
  EstimatedReplenishment,
  OperationalAlert,
  PendingFollowup,
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
import { computeForecastWithSimulation } from "../lib/pacing";
import {
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
  type BaDrillDownData,
  type Severity,
} from "./_shared";

const CATEGORY_COLORS: Record<keyof SalesByCategory, string> = {
  Skincare: "hsl(212, 50%, 45%)",
  Makeup: "hsl(345, 65%, 50%)",
  Fragancia: "hsl(38, 60%, 50%)",
  Unmapped: "hsl(215, 16%, 47%)",
};

export interface ManagerDashboardData {
  salesAmount: number;
  salesDelta: PeriodDeltaResult;
  sparklineData: readonly SparklineBucket[];
  averageTicket: number;
  recoToPurchaseRate: number;
  salesByBrand: SalesByBrandResult;
  baRanking: readonly BaRankingEntry[];
  baDeltasByBaId: ReadonlyMap<StaffId, number>;
  baTargetsByBaId: ReadonlyMap<StaffId, number>;
  baSparklineByBaId: ReadonlyMap<StaffId, readonly SparklineBucket[]>;
  baAlertsByBaId: ReadonlyMap<StaffId, readonly OperationalAlert[]>;
  counterAveragesByBrand: ReadonlyMap<BrandId, BrandCounterAverages>;
  salesByCategory: SalesByCategory;
  topProductsLcm: readonly TopProduct[];
  topProductsYsl: readonly TopProduct[];
  activeClients: number;
  atRiskClients: number;
  repurchaseRate: number;
  topClients: readonly TopClient[];
  pendingFollowups: readonly PendingFollowup[];
  estimatedReplenishments: readonly EstimatedReplenishment[];
  operationalAlerts: readonly OperationalAlert[];
  funnelInteractions: number;
  funnelRecommendations: number;
  funnelPurchases: number;
  funnelRepurchases: number;
  appointmentsTotal: number;
  appointmentsCanceled: number;
}

export interface ManagerDashboardProps {
  staff: Gerente;
  storeName: string;
  storeTarget: number;
  filters: DashboardFilters;
  data: ManagerDashboardData;
}

export function ManagerDashboard({
  staff,
  storeName,
  storeTarget,
  filters,
  data,
}: ManagerDashboardProps) {
  const [drillDown, setDrillDown] = useState<BaDrillDownData | null>(null);

  const split = toSplitBarData(data.salesByBrand);
  const sparklineValues = toSparklinePoints([...data.sparklineData]);
  const sparklineLabels = buildXAxisLabels(data.sparklineData);
  const sparklineTitle = formatPeriodTitle(data.sparklineData);
  const ratioPct =
    storeTarget > 0 ? Math.round((data.salesAmount / storeTarget) * 100) : 0;
  const worstPerformer = pickWorstPerformer(data.baRanking);

  const forecast = computeForecastWithSimulation({
    salesAmount: data.salesAmount,
    monthlyTarget: storeTarget,
    period: filters.period,
    worstPerformer:
      worstPerformer && worstPerformer.deficit > 0
        ? { name: worstPerformer.name, deficit: worstPerformer.deficit }
        : undefined,
  });

  const insights = computeCoachingInsights({
    ranking: data.baRanking,
    deltas: data.baDeltasByBaId,
    counterAveragesByBrand: data.counterAveragesByBrand,
    targetsByBa: data.baTargetsByBaId,
  });

  const criticalAlerts = data.operationalAlerts
    .filter((a) => a.severity === "critical")
    .map(toBannerItem);

  const handleBaClick = (entry: BaRankingEntry) => {
    setDrillDown({
      entry,
      monthlyTarget: data.baTargetsByBaId.get(entry.baId) ?? 0,
      growthPct: data.baDeltasByBaId.get(entry.baId) ?? 0,
      sparklineValues: (data.baSparklineByBaId.get(entry.baId) ?? []).map(
        (b) => b.value,
      ),
      alerts: data.baAlertsByBaId.get(entry.baId) ?? [],
    });
  };

  return (
    <div className="bg-bone min-h-full">
      <DashHeader
        subtitle={`Gerente de Tienda · ${staff.name} · ${storeName}`}
        title="Mi tienda"
        actions={
          <>
            <FilterBar
              roleConfig={{
                period: true,
                store: false,
                brand: true,
                baId: true,
              }}
              scopeOptions={{
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
              storeTarget={storeTarget}
              ratioPct={ratioPct}
              salesDelta={data.salesDelta}
              sparklineValues={sparklineValues}
              sparklineLabels={sparklineLabels}
              sparklineTitle={sparklineTitle}
              forecastText={forecast.text}
              ahead={ratioPct >= 100 || (forecast.simulatedProjection ?? 0) > storeTarget}
            />
          }
          side={[
            <HeroBrandMix key="mix" split={split} />,
            <HeroBaCount
              key="bas"
              active={countActiveBas(data.baRanking)}
              total={data.baRanking.length}
            />,
            <HeroConvAvg
              key="conv"
              recoRate={data.recoToPurchaseRate}
              averageTicket={data.averageTicket}
            />,
          ]}
        />

        {/* Sección 1 — Coaching Insights + Ranking BAs */}
        <DashBlock title="Coaching">
          {insights.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {insights.map((ins, i) => (
                <CoachingInsightCard key={i} insight={ins} />
              ))}
            </div>
          ) : null}
          <BaRankingTable
            ranking={data.baRanking}
            targets={data.baTargetsByBaId}
            counterAvgByBrand={data.counterAveragesByBrand}
            onSelect={handleBaClick}
          />
        </DashBlock>

        {/* Sección 2 — Comparativa entre marcas */}
        <DashBlock
          title="Comparativa entre marcas"
          right={
            <ExportButton filters={filters} onExport={exportBrandComparison} label="Exportar marcas" />
          }
        >
          <BrandComparison data={data.salesByBrand} />
        </DashBlock>

        {/* Sección 3 — Conversion Funnel */}
        <DashBlock title="Conversion Funnel del store">
          <div className="bg-white border border-line rounded-lg p-4">
            <Funnel stages={buildFunnel(data)} />
          </div>
        </DashBlock>

        {/* Sección 4 — Mix de productos */}
        <DashBlock title="Mix de productos">
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

        {/* Sección 5 — Salud de la cartera */}
        <DashBlock
          title="Salud de la cartera"
          right={
            <ExportButton filters={filters} onExport={exportClientsReport} label="Exportar clientes" />
          }
        >
          <div className="bg-white border border-line rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <CarteraStats
              activeClients={data.activeClients}
              atRiskClients={data.atRiskClients}
              repurchaseRate={data.repurchaseRate}
              total={data.activeClients + data.atRiskClients}
            />
            <TopClientsList clients={data.topClients} />
          </div>
        </DashBlock>

        {/* Sección 6 — Operación + Acción */}
        <DashBlock title="Operación + Acción">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <OperationStats
              appointments={data.appointmentsTotal}
              canceled={data.appointmentsCanceled}
              pendingFollowups={data.pendingFollowups.length}
              upcomingReplenishments={data.estimatedReplenishments.length}
            />
            <OperationalAlertsList alerts={data.operationalAlerts} />
          </div>
        </DashBlock>
      </div>

      <BADrillDownModal
        open={drillDown !== null}
        onClose={() => setDrillDown(null)}
        data={drillDown}
      />
    </div>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function HeroMain({
  salesAmount,
  storeTarget,
  ratioPct,
  salesDelta,
  sparklineValues,
  sparklineLabels,
  sparklineTitle,
  forecastText,
  ahead,
}: {
  salesAmount: number;
  storeTarget: number;
  ratioPct: number;
  salesDelta: PeriodDeltaResult;
  sparklineValues: number[];
  sparklineLabels: readonly string[];
  sparklineTitle: string;
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
        Ventas de la tienda
      </span>
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="font-display text-[40px] leading-none tabular">
          {formatCurrencyCompact(salesAmount)}
        </span>
        <span className="text-[18px] text-ink/60">
          / {storeTarget > 0 ? formatCurrencyCompact(storeTarget) : "sin meta"}
        </span>
        {storeTarget > 0 ? (
          <span className="text-[20px] font-semibold tabular">{ratioPct}%</span>
        ) : null}
        <span className={cn("text-[16px] font-semibold tabular", tone)}>
          {formatPercentChange(salesDelta.deltaPct)}
        </span>
      </div>
      {storeTarget > 0 ? (
        <ProgressBar
          value={Math.min(1, salesAmount / storeTarget)}
          tone={ratioPct >= 100 ? "ok" : ratioPct >= 70 ? "warn" : "danger"}
        />
      ) : null}
      <LineChart
        values={sparklineValues}
        labels={sparklineLabels}
        height={220}
        showYAxis
        yAxisFormatter={formatCurrencyCompact}
        xAxisTitle={sparklineTitle}
        colors={["var(--color-ink)"]}
      />
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
        Mix marcas
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

function HeroBaCount({ active, total }: { active: number; total: number }) {
  return (
    <article className="bg-white border border-line rounded-lg p-4 flex flex-col gap-2 h-full">
      <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        BAs con ventas
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

function HeroConvAvg({
  recoRate,
  averageTicket,
}: {
  recoRate: number;
  averageTicket: number;
}) {
  return (
    <article className="bg-white border border-line rounded-lg p-4 flex flex-col gap-2 h-full">
      <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        Conv reco→compra
      </span>
      <span className="font-display text-[32px] leading-none tabular">
        {formatPercent(recoRate)}
      </span>
      <span className="text-[14px] text-ink/60">
        Ticket promedio {formatCurrencyCompact(averageTicket)}
      </span>
    </article>
  );
}

// ── Sec 1 — Coaching + Ranking ───────────────────────────────────────────────

function CoachingInsightCard({ insight }: { insight: CoachingInsight }) {
  return (
    <AlertCard
      severity={insight.severity as Severity}
      title={insight.title}
      description={insight.description}
    />
  );
}

function BaRankingTable({
  ranking,
  targets,
  counterAvgByBrand,
  onSelect,
}: {
  ranking: readonly BaRankingEntry[];
  targets: ReadonlyMap<StaffId, number>;
  counterAvgByBrand: ReadonlyMap<BrandId, BrandCounterAverages>;
  onSelect: (entry: BaRankingEntry) => void;
}) {
  if (ranking.length === 0) {
    return (
      <EmptyState message="Configura al menos un BA en tu tienda para ver el ranking." />
    );
  }
  const topQuartile = Math.max(1, Math.ceil(ranking.length / 4));

  return (
    <div className="bg-white border border-line rounded-lg p-4 overflow-x-auto">
      <div className="grid grid-cols-[1.4fr_0.6fr_1fr_0.7fr_0.9fr_0.9fr] gap-3 px-1 pb-2 border-b border-line text-[14px] font-semibold tracking-[0.12em] uppercase text-ink/60 min-w-[640px]">
        <span>BA</span>
        <span>Marca</span>
        <span>Ventas</span>
        <span>% obj</span>
        <span>Conv</span>
        <span>Estado</span>
      </div>
      <ul className="list-none m-0 p-0 min-w-[640px]">
        {ranking.map((entry, i) => {
          const target = targets.get(entry.baId) ?? 0;
          const ratio = target > 0 ? entry.salesAmount / target : 0;
          const ratioPct = target > 0 ? Math.round(ratio * 100) : null;
          const brandAvg = counterAvgByBrand.get(entry.brand);
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
                className="w-full text-left grid grid-cols-[1.4fr_0.6fr_1fr_0.7fr_0.9fr_0.9fr] gap-3 items-center px-1 py-2.5 border-b border-dashed border-line last:border-b-0 cursor-pointer hover:bg-bone rounded"
              >
                <span className="text-[16px] font-medium">{entry.name}</span>
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

// ── Sec 2 — Brand comparison ─────────────────────────────────────────────────

function BrandComparison({ data }: { data: SalesByBrandResult }) {
  const total = data.Lancome.salesAmount + data.YSL.salesAmount;
  return (
    <div className="bg-white border border-line rounded-lg p-4 grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-5">
      <div className="flex flex-col gap-3">
        <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          Mix Lancôme · YSL
        </span>
        <SplitBar
          a={data.Lancome.salesAmount}
          b={data.YSL.salesAmount}
          aLabel="Lancôme"
          bLabel="YSL"
          aClassName="bg-lancome-rose-deep"
          bClassName="bg-ink"
        />
        <div className="grid grid-cols-2 gap-3 text-[15px] mt-1">
          <div>
            <div className="text-ink/60">Lancôme</div>
            <div className="font-semibold tabular text-[18px]">
              {formatCurrencyCompact(data.Lancome.salesAmount)}
            </div>
            <div className="text-[14px] text-ink/60">
              {total > 0
                ? `${Math.round((data.Lancome.salesAmount / total) * 100)}%`
                : "0%"}
            </div>
          </div>
          <div>
            <div className="text-ink/60">YSL</div>
            <div className="font-semibold tabular text-[18px]">
              {formatCurrencyCompact(data.YSL.salesAmount)}
            </div>
            <div className="text-[14px] text-ink/60">
              {total > 0
                ? `${Math.round((data.YSL.salesAmount / total) * 100)}%`
                : "0%"}
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <BrandKpiColumn label="Lancôme" stats={data.Lancome} />
        <BrandKpiColumn label="YSL" stats={data.YSL} />
      </div>
    </div>
  );
}

function BrandKpiColumn({
  label,
  stats,
}: {
  label: string;
  stats: SalesByBrandResult["Lancome"];
}) {
  return (
    <div className="border border-line rounded-md p-3 bg-paper flex flex-col gap-2">
      <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        {label}
      </span>
      <KvRow
        k="Transacciones"
        v={formatCount(stats.transactionsCount)}
      />
      <KvRow k="Ticket promedio" v={formatCurrencyCompact(stats.averageTicket)} />
      <KvRow k="Conv reco→compra" v={formatPercent(stats.reco2PurchaseRate * 100)} />
      <KvRow k="Clientes activos" v={formatCount(stats.activeClients)} />
      <div>
        <span className="text-[14px] text-ink/60">Top SKU</span>
        <div className="text-[15px] font-medium leading-tight">
          {stats.topProducts[0]?.productName ?? "—"}
        </div>
      </div>
    </div>
  );
}

function KvRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-[14px] text-ink/60">{k}</span>
      <span className="text-[15px] font-semibold tabular">{v}</span>
    </div>
  );
}

// ── Sec 3 — Funnel ───────────────────────────────────────────────────────────

function buildFunnel(data: ManagerDashboardData): FunnelStage[] {
  return [
    { label: "Interacciones registradas", count: data.funnelInteractions },
    { label: "Recomendaciones hechas", count: data.funnelRecommendations },
    { label: "Compras tras recomendación", count: data.funnelPurchases },
    { label: "Recompra en 90 días", count: data.funnelRepurchases },
  ];
}

// ── Sec 4 — Mix de productos ────────────────────────────────────────────────

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

// ── Sec 5 — Salud de la cartera ──────────────────────────────────────────────

function CarteraStats({
  activeClients,
  atRiskClients,
  repurchaseRate,
  total,
}: {
  activeClients: number;
  atRiskClients: number;
  repurchaseRate: number;
  total: number;
}) {
  const activePct = total > 0 ? activeClients / total : 0;
  const atRiskPct = total > 0 ? atRiskClients / total : 0;
  return (
    <div className="flex flex-col gap-4 justify-center">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Stat label="Activos" value={formatCount(activeClients)} />
        <Stat
          label="En riesgo"
          value={formatCount(atRiskClients)}
          dotTone={atRiskClients > 0 ? "warn" : null}
        />
        <Stat label="Recompra 90d" value={formatPercent(repurchaseRate)} />
      </div>
      <div>
        <span className="text-[14px] text-ink/60">Segmentación</span>
        <div className="flex h-3 rounded-full overflow-hidden mt-1">
          <div
            className="bg-ok"
            style={{ width: `${Math.max(2, activePct * 100)}%` }}
          />
          <div
            className="bg-warn"
            style={{ width: `${Math.max(2, atRiskPct * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[14px] text-ink/60 mt-1">
          <span>Activos</span>
          <span>En riesgo</span>
        </div>
      </div>
    </div>
  );
}

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

function TopClientsList({ clients }: { clients: readonly TopClient[] }) {
  if (clients.length === 0) {
    return <EmptyState message="Aún no hay clientes registrados en la tienda." />;
  }
  return (
    <div>
      <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
        Top 10 clientes
      </div>
      <ul className="list-none m-0 p-0 divide-y divide-line">
        {clients.slice(0, 10).map((c) => (
          <li key={c.clientId} className="py-1.5">
            <Link
              href={`/ba/clients/${c.clientId}`}
              className="grid grid-cols-[1fr_auto] gap-2 no-underline text-ink hover:bg-bone -mx-2 px-2 rounded"
            >
              <span className="flex flex-col">
                <span className="text-[15px] leading-snug font-medium">
                  {c.name}
                </span>
                <span className="text-[13px] text-ink/60">
                  {c.visitsCount} visitas · última{" "}
                  {c.lastVisitDate
                    ? formatDateRelative(c.lastVisitDate)
                    : "—"}
                </span>
              </span>
              <span className="text-[15px] font-semibold tabular self-center">
                {formatCurrencyCompact(c.totalSpent)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Sec 6 — Operación + Acción ───────────────────────────────────────────────

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
        label="Follow-ups pendientes equipo"
        value={formatCount(pendingFollowups)}
      />
      <Stat
        label="Eventos 30 días (repos.)"
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

// ── Shared helpers ───────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 px-4 gap-2">
      <Icon name="sparkle" size={20} className="text-ink/30" />
      <p className="m-0 text-[15px] text-ink/60 max-w-[36ch]">{message}</p>
    </div>
  );
}

function pickWorstPerformer(
  ranking: readonly BaRankingEntry[],
): { name: string; deficit: number } | null {
  if (ranking.length < 2) return null;
  const avg =
    ranking.reduce((s, e) => s + e.salesAmount, 0) / ranking.length;
  let worst = ranking[0]!;
  for (const e of ranking) {
    if (e.salesAmount < worst.salesAmount) worst = e;
  }
  const deficit = Math.max(0, avg - worst.salesAmount);
  return { name: worst.name, deficit };
}

function countActiveBas(ranking: readonly BaRankingEntry[]): number {
  return ranking.filter((b) => b.salesAmount > 0).length;
}

function toBannerItem(a: OperationalAlert) {
  return {
    severity: a.severity as Severity,
    title: a.title,
    description: a.description,
    action: a.link ? { label: "Ver", href: a.link } : undefined,
  };
}
