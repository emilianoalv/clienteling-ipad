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
import type { AuditEvent } from "@/types/audit-event";
import type { Product } from "@/types/product";
import type { Template } from "@/types/template";
import type { User } from "@/types/user";
import type { Admin, StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import { cn } from "@/lib/cn";
import { formatDateRelative } from "@/lib/format/date";
import {
  formatCurrencyCompact,
  formatPercent,
  formatPercentChange,
} from "@/lib/format/number";
import type {
  BaRankingEntry,
  OperationalAlert,
  PeriodDeltaResult,
  SalesByBrandResult,
  SalesByCategory,
  SparklineBucket,
  StoreRankingEntry,
  TopClient,
  TopProduct,
} from "../server/queries";
import type { DashboardFilters } from "../server/types";
import {
  toSparklinePoints,
  toSplitBarData,
} from "../lib/adapters";
import type { AdoptionData } from "../lib/adoption-tracker";
import type { ComplianceData } from "../lib/compliance-score";
import { computeForecastWithSimulation } from "../lib/pacing";
import type { StrategicInsight } from "../lib/strategic-insights";
import {
  exportAgendaReport,
  exportBaRanking,
  exportBrandComparison,
  exportClientsReport,
} from "../server/actions";
import {
  AdoptionTracker,
  AlertBanner,
  AlertCard,
  BADrillDownModal,
  ComplianceScoreCard,
  DashBlock,
  DashHeader,
  ExportButton,
  FilterBar,
  HeroBlock,
  StoreDrillDownModal,
  StrategicInsightCard,
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

export interface AdminDashboardData {
  salesAmount: number;
  salesDelta: PeriodDeltaResult;
  sparklineData: readonly SparklineBucket[];
  averageTicket: number;
  recoToPurchaseRate: number;
  salesByBrand: SalesByBrandResult;
  salesByCategory: SalesByCategory;
  topProducts: readonly TopProduct[];
  activeClients: number;
  atRiskClients: number;
  topClients: readonly TopClient[];
  operationalAlerts: readonly OperationalAlert[];
  appointmentsTotal: number;
  appointmentsCanceled: number;
  funnelInteractions: number;
  funnelRecommendations: number;
  funnelPurchases: number;
  funnelRepurchases: number;
  storeRanking: readonly StoreRankingEntry[];
  baRanking: readonly BaRankingEntry[];
  baDeltasByBaId: ReadonlyMap<StaffId, number>;
  baTargetsByBaId: ReadonlyMap<StaffId, number>;
  baSparklineByBaId: ReadonlyMap<StaffId, readonly SparklineBucket[]>;
  baAlertsByBaId: ReadonlyMap<StaffId, readonly OperationalAlert[]>;
  /** Health context for store drill-down — sparkline + alerts per store. */
  storeSparklineByStoreId: ReadonlyMap<StoreId, readonly SparklineBucket[]>;
  storeBasByStoreId: ReadonlyMap<StoreId, readonly BaRankingEntry[]>;
  storeAlertsByStoreId: ReadonlyMap<StoreId, readonly OperationalAlert[]>;
  storeTargetsByStoreId: ReadonlyMap<StoreId, number>;
  strategicInsights: readonly StrategicInsight[];
  complianceData: ComplianceData;
  adoptionData: AdoptionData;
  brandTrend: {
    labels: readonly string[];
    series: ReadonlyArray<{ label: string; values: readonly number[] }>;
  };
  // Sec 7 — governance migrated from admin-home
  users: readonly User[];
  products: readonly Product[];
  templates: readonly Template[];
  auditEvents: readonly AuditEvent[];
  privacyNoticeVersion: string;
  storeLookup: Readonly<Record<string, string>>;
}

export interface AdminDashboardProps {
  staff: Admin;
  countryName: string;
  nationalTarget: number;
  filters: DashboardFilters;
  data: AdminDashboardData;
}

export function AdminDashboard({
  staff,
  countryName,
  nationalTarget,
  filters,
  data,
}: AdminDashboardProps) {
  const [baDrillDown, setBaDrillDown] = useState<BaDrillDownData | null>(null);
  const [storeDrillDown, setStoreDrillDown] =
    useState<StoreDrillDownData | null>(null);

  const split = toSplitBarData(data.salesByBrand);
  const sparklineValues = toSparklinePoints([...data.sparklineData]);
  const ratioPct =
    nationalTarget > 0
      ? Math.round((data.salesAmount / nationalTarget) * 100)
      : 0;

  const worstStore = pickWorstStore(data.storeRanking, data.storeTargetsByStoreId);
  const forecast = computeForecastWithSimulation({
    salesAmount: data.salesAmount,
    monthlyTarget: nationalTarget,
    period: filters.period,
    worstPerformer:
      worstStore && worstStore.deficit > 0
        ? { name: worstStore.name, deficit: worstStore.deficit }
        : undefined,
  });

  const criticalAlerts = data.operationalAlerts
    .filter((a) => a.severity === "critical")
    .map(toBannerItem);

  const activeBaCountry = data.baRanking.filter((b) => b.salesAmount > 0)
    .length;
  const totalBaCountry = data.baRanking.length;
  const storesActive = data.storeRanking.filter((s) => s.salesAmount > 0).length;

  const handleBaClick = (entry: BaRankingEntry) => {
    setBaDrillDown({
      entry,
      monthlyTarget: data.baTargetsByBaId.get(entry.baId) ?? 0,
      growthPct: data.baDeltasByBaId.get(entry.baId) ?? 0,
      sparklineValues: (data.baSparklineByBaId.get(entry.baId) ?? []).map(
        (b) => b.value,
      ),
      alerts: data.baAlertsByBaId.get(entry.baId) ?? [],
    });
  };

  const handleStoreClick = (entry: StoreRankingEntry) => {
    const sparkline = data.storeSparklineByStoreId.get(entry.storeId) ?? [];
    const bas = data.storeBasByStoreId.get(entry.storeId) ?? [];
    const alerts = data.storeAlertsByStoreId.get(entry.storeId) ?? [];
    const target = data.storeTargetsByStoreId.get(entry.storeId) ?? 0;
    setStoreDrillDown({
      storeName: entry.storeName,
      health: {
        score: ratioPctFor(entry.salesAmount, target),
        grade:
          ratioPctFor(entry.salesAmount, target) >= 80
            ? "verde"
            : ratioPctFor(entry.salesAmount, target) >= 60
            ? "ambar"
            : "rojo",
        breakdown: {
          targetCompletion: ratioPctFor(entry.salesAmount, target),
          baAdoption: bas.length > 0 ? 100 : 0,
          alertsScore: Math.max(
            0,
            100 - alerts.filter((a) => a.severity === "critical").length * 10,
          ),
          interactionRate: 80, // Admin store-drill is an approximation; supervisor owns the precise score.
        },
      },
      sales: { current: entry.salesAmount, target },
      baRanking: bas,
      sparklineValues: sparkline.map((b) => b.value),
      alerts,
    });
  };

  return (
    <div className="bg-bone min-h-full">
      <DashHeader
        subtitle={`Administrador Central · ${staff.name} · ${countryName}`}
        title="Gobernanza nacional"
        actions={
          <>
            <FilterBar
              roleConfig={{
                period: true,
                store: true,
                brand: true,
                baId: false,
              }}
              scopeOptions={{
                stores: data.storeRanking.map((s) => ({
                  id: s.storeId,
                  label: s.storeName,
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
              nationalTarget={nationalTarget}
              ratioPct={ratioPct}
              salesDelta={data.salesDelta}
              sparklineValues={sparklineValues}
              forecastText={forecast.text}
              ahead={
                ratioPct >= 100 ||
                (forecast.simulatedProjection ?? 0) > nationalTarget
              }
            />
          }
          side={[
            <HeroBrandMix key="mix" split={split} />,
            <HeroStoresCount
              key="stores"
              active={storesActive}
              total={data.storeRanking.length}
            />,
            <HeroBaCount
              key="bas"
              active={activeBaCountry}
              total={totalBaCountry}
            />,
          ]}
        />

        {/* Sec 1 — Ranking nacional */}
        <DashBlock
          title="Ranking nacional"
          right={
            <ExportButton filters={filters} onExport={exportBaRanking} label="Exportar ranking" />
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TopStoresTable
              ranking={data.storeRanking}
              targets={data.storeTargetsByStoreId}
              onSelect={handleStoreClick}
            />
            <TopBasTable
              ranking={data.baRanking.slice(0, 10)}
              targets={data.baTargetsByBaId}
              onSelect={handleBaClick}
            />
          </div>
        </DashBlock>

        {/* Sec 2 — Funnel + Strategic Insights */}
        <DashBlock title="Conversion Funnel + Strategic Insights">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-line rounded-lg p-4">
              <Funnel stages={buildFunnel(data)} />
            </div>
            <ul className="list-none m-0 p-0 grid gap-3">
              {data.strategicInsights.length === 0 ? (
                <li>
                  <EmptyState message="Aún no hay suficientes datos nacionales para emitir un insight estratégico." />
                </li>
              ) : (
                data.strategicInsights.map((ins, i) => (
                  <li key={i}>
                    <StrategicInsightCard insight={ins} />
                  </li>
                ))
              )}
            </ul>
          </div>
        </DashBlock>

        {/* Sec 3 — Comparativa marcas país */}
        <DashBlock
          title="Comparativa marcas país"
          right={
            <ExportButton filters={filters} onExport={exportBrandComparison} label="Exportar marcas" />
          }
        >
          <div className="bg-white border border-line rounded-lg p-4 grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-5">
            <div className="flex flex-col gap-3">
              <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
                Mix nacional
              </span>
              <SplitBar
                a={data.salesByBrand.Lancome.salesAmount}
                b={data.salesByBrand.YSL.salesAmount}
                aLabel="Lancôme"
                bLabel="YSL"
                aClassName="bg-lancome-rose-deep"
                bClassName="bg-ink"
              />
              <BrandKpiColumn label="Lancôme" stats={data.salesByBrand.Lancome} />
              <BrandKpiColumn label="YSL" stats={data.salesByBrand.YSL} />
            </div>
            <div>
              <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
                Tendencia 90 días
              </span>
              {data.brandTrend.series.length === 0 ||
              data.brandTrend.labels.length < 2 ? (
                <EmptyState message="Aún no hay datos suficientes para mostrar la tendencia comparada." />
              ) : (
                <LineChart
                  series={data.brandTrend.series.map((s) => s.values)}
                  labels={trimLabels(data.brandTrend.labels)}
                  colors={["var(--color-lancome-rose-deep)", "var(--color-ink)"]}
                  legend={data.brandTrend.series.map((s) => s.label)}
                />
              )}
            </div>
          </div>
        </DashBlock>

        {/* Sec 4 — Mix de productos país */}
        <DashBlock title="Mix de productos país">
          <div className="bg-white border border-line rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-center">
              <CategoryDonut salesByCategory={data.salesByCategory} />
            </div>
            <TopProductsList products={data.topProducts} />
          </div>
        </DashBlock>

        {/* Sec 5 — Compliance Posture */}
        <DashBlock title="Compliance Posture · LFPDPPP">
          <ComplianceScoreCard data={data.complianceData} />
        </DashBlock>

        {/* Sec 6 — Adoption Tracker */}
        <DashBlock title="Adoption Tracker">
          <AdoptionTracker data={data.adoptionData} />
        </DashBlock>

        {/* Sec 7 — Gobernanza del sistema (migrado de admin-home) */}
        <DashBlock title="Gobernanza del sistema">
          <GovernanceSection
            users={data.users}
            products={data.products}
            templates={data.templates}
            auditEvents={data.auditEvents}
            privacyNoticeVersion={data.privacyNoticeVersion}
            storeLookup={data.storeLookup}
          />
        </DashBlock>

        {/* Sec 8 — Alertas + System Health */}
        <DashBlock
          title="Alertas + System Health"
          right={
            <ExportButton filters={filters} onExport={exportAgendaReport} label="Exportar agenda" />
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SystemHealthCard />
            <OperationalAlertsList alerts={data.operationalAlerts} />
          </div>
        </DashBlock>

        {/* Top clientes nacional */}
        <DashBlock
          title="Top clientes país"
          right={
            <ExportButton filters={filters} onExport={exportClientsReport} label="Exportar clientes" />
          }
        >
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
  nationalTarget,
  ratioPct,
  salesDelta,
  sparklineValues,
  forecastText,
  ahead,
}: {
  salesAmount: number;
  nationalTarget: number;
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
        Ventas nacionales
      </span>
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="font-display text-[40px] leading-none tabular">
          {formatCurrencyCompact(salesAmount)}
        </span>
        <span className="text-[18px] text-ink/60">
          /{" "}
          {nationalTarget > 0
            ? formatCurrencyCompact(nationalTarget)
            : "sin meta"}
        </span>
        {nationalTarget > 0 ? (
          <span className="text-[20px] font-semibold tabular">{ratioPct}%</span>
        ) : null}
        <span className={cn("text-[16px] font-semibold tabular", tone)}>
          {formatPercentChange(salesDelta.deltaPct)}
        </span>
      </div>
      {nationalTarget > 0 ? (
        <ProgressBar
          value={Math.min(1, salesAmount / nationalTarget)}
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
  const lcmPct =
    split.total > 0 ? Math.round((split.lancome / split.total) * 100) : 0;
  return (
    <article className="bg-white border border-line rounded-lg p-4 flex flex-col gap-2 h-full">
      <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        Mix marcas país
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

function HeroStoresCount({
  active,
  total,
}: {
  active: number;
  total: number;
}) {
  return (
    <article className="bg-white border border-line rounded-lg p-4 flex flex-col gap-2 h-full">
      <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        Tiendas activas
      </span>
      <span className="font-display text-[32px] leading-none tabular">
        {active} <span className="text-[18px] text-ink/60">de {total}</span>
      </span>
      <span className="text-[14px] text-ink/60">Reportando ventas en el período</span>
    </article>
  );
}

function HeroBaCount({ active, total }: { active: number; total: number }) {
  return (
    <article className="bg-white border border-line rounded-lg p-4 flex flex-col gap-2 h-full">
      <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        BAs activos nacional
      </span>
      <span className="font-display text-[32px] leading-none tabular">
        {active} <span className="text-[18px] text-ink/60">de {total}</span>
      </span>
      <span className="text-[14px] text-ink/60">
        {total > 0 ? Math.round((active / total) * 100) : 0}% del equipo país
      </span>
    </article>
  );
}

// ── Sec 1 — Ranking nacional ────────────────────────────────────────────────

function TopStoresTable({
  ranking,
  targets,
  onSelect,
}: {
  ranking: readonly StoreRankingEntry[];
  targets: ReadonlyMap<StoreId, number>;
  onSelect: (entry: StoreRankingEntry) => void;
}) {
  if (ranking.length === 0) {
    return <EmptyState message="No hay datos de tiendas en el período." />;
  }
  return (
    <div className="bg-white border border-line rounded-lg p-4">
      <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
        Top tiendas
      </div>
      <ul className="list-none m-0 p-0">
        {ranking.map((entry) => {
          const target = targets.get(entry.storeId) ?? 0;
          const ratioPct = target > 0 ? Math.round((entry.salesAmount / target) * 100) : null;
          return (
            <li key={entry.storeId}>
              <button
                type="button"
                onClick={() => onSelect(entry)}
                className="w-full text-left grid grid-cols-[24px_1.4fr_1fr_0.6fr] gap-3 items-center px-1 py-2 border-b border-dashed border-line last:border-b-0 cursor-pointer hover:bg-bone rounded"
              >
                <span className="text-[15px] text-ink/60 tabular">
                  #{entry.rank}
                </span>
                <span className="text-[16px] font-medium">
                  {entry.storeName}
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
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TopBasTable({
  ranking,
  targets,
  onSelect,
}: {
  ranking: readonly BaRankingEntry[];
  targets: ReadonlyMap<StaffId, number>;
  onSelect: (entry: BaRankingEntry) => void;
}) {
  if (ranking.length === 0) {
    return <EmptyState message="No hay BAs activos en el período." />;
  }
  return (
    <div className="bg-white border border-line rounded-lg p-4">
      <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
        Top BAs país
      </div>
      <ul className="list-none m-0 p-0">
        {ranking.map((entry) => {
          const target = targets.get(entry.baId) ?? 0;
          const ratioPct = target > 0 ? Math.round((entry.salesAmount / target) * 100) : null;
          return (
            <li key={entry.baId}>
              <button
                type="button"
                onClick={() => onSelect(entry)}
                className="w-full text-left grid grid-cols-[24px_1.2fr_0.6fr_1fr_0.6fr] gap-3 items-center px-1 py-2 border-b border-dashed border-line last:border-b-0 cursor-pointer hover:bg-bone rounded"
              >
                <span className="text-[15px] text-ink/60 tabular">
                  #{entry.rank}
                </span>
                <span className="flex flex-col">
                  <span className="text-[16px] font-medium leading-tight">
                    {entry.name}
                  </span>
                  <span className="text-[13px] text-ink/60">{entry.storeName}</span>
                </span>
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
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Sec 2 — Funnel ──────────────────────────────────────────────────────────

function buildFunnel(data: AdminDashboardData): FunnelStage[] {
  return [
    { label: "Interacciones registradas", count: data.funnelInteractions },
    { label: "Recomendaciones hechas", count: data.funnelRecommendations },
    { label: "Compras tras recomendación", count: data.funnelPurchases },
    { label: "Recompra en 90 días", count: data.funnelRepurchases },
  ];
}

// ── Sec 3 — Brand comparison helpers ────────────────────────────────────────

function BrandKpiColumn({
  label,
  stats,
}: {
  label: string;
  stats: SalesByBrandResult["Lancome"];
}) {
  return (
    <div className="border border-line rounded-md p-3 bg-paper flex flex-col gap-1">
      <span className="text-[13px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        {label}
      </span>
      <KvRow k="Ventas" v={formatCurrencyCompact(stats.salesAmount)} />
      <KvRow k="Ticket promedio" v={formatCurrencyCompact(stats.averageTicket)} />
      <KvRow k="Conv reco→compra" v={formatPercent(stats.reco2PurchaseRate * 100)} />
    </div>
  );
}

function KvRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-[14px]">
      <span className="text-ink/60">{k}</span>
      <span className="font-semibold tabular">{v}</span>
    </div>
  );
}

// ── Sec 4 — Mix productos ───────────────────────────────────────────────────

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
      centerSub="país"
    />
  );
}

function TopProductsList({ products }: { products: readonly TopProduct[] }) {
  if (products.length === 0) {
    return <EmptyState message="Sin productos vendidos en este período." />;
  }
  return (
    <div>
      <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
        Top 10 SKUs nacionales
      </div>
      <ul className="list-none m-0 p-0 divide-y divide-line">
        {products.slice(0, 10).map((p) => (
          <li
            key={p.sku}
            className="grid grid-cols-[1fr_auto_auto] gap-3 py-1.5 items-baseline text-[15px]"
          >
            <span>{p.productName}</span>
            <span className="text-[13px] text-ink/60 tabular">
              {p.brand}
            </span>
            <span className="font-semibold tabular">
              {formatCurrencyCompact(p.revenue)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Sec 7 — Governance ──────────────────────────────────────────────────────

function GovernanceSection({
  users,
  products,
  templates,
  auditEvents,
  privacyNoticeVersion,
  storeLookup,
}: {
  users: readonly User[];
  products: readonly Product[];
  templates: readonly Template[];
  auditEvents: readonly AuditEvent[];
  privacyNoticeVersion: string;
  storeLookup: Readonly<Record<string, string>>;
}) {
  const lancomeCount = products.filter((p) => p.brand === "Lancôme").length;
  const yslCount = products.filter((p) => p.brand === "YSL").length;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <article className="bg-white border border-line rounded-lg p-4">
        <header className="flex items-baseline justify-between">
          <div>
            <span className="block text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              Usuarios & roles
            </span>
            <div className="font-display text-[22px] mt-0.5">
              {users.length} activos
            </div>
          </div>
          <Link
            href="/admin/users"
            className="text-[15px] font-semibold text-ink/60 hover:text-ink no-underline"
          >
            Ver todos →
          </Link>
        </header>
        <ul className="list-none m-0 mt-3 p-0">
          {users.slice(0, 5).map((u) => (
            <li
              key={u.id}
              className="grid grid-cols-[1fr_auto] gap-2 items-center py-2 border-b border-dashed border-line last:border-b-0"
            >
              <div>
                <div className="text-[16px] font-medium">{u.name}</div>
                <div className="text-[15px] text-ink/60">
                  {describeScope(u, storeLookup)}
                </div>
              </div>
              <Chip size="sm">{u.role}</Chip>
            </li>
          ))}
        </ul>
      </article>

      <article className="bg-white border border-line rounded-lg p-4">
        <span className="block text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          Permisos por rol
        </span>
        <ul className="list-none m-0 mt-3 p-0 flex flex-col gap-2">
          {ROLE_SCOPES.map((r) => (
            <li key={r.role} className="p-2.5 bg-bone rounded-md">
              <div className="text-[16px] font-semibold">{r.role}</div>
              <div className="text-[15px] text-ink/60 mt-0.5">
                {r.scopes.join(" · ")}
              </div>
            </li>
          ))}
        </ul>
      </article>

      <article className="bg-white border border-line rounded-lg p-4">
        <span className="block text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          Catálogo · gobernanza
        </span>
        <ul className="list-none m-0 mt-2 p-0 grid gap-1">
          <KvRow k="SKUs Lancôme" v={String(lancomeCount)} />
          <KvRow k="SKUs YSL" v={String(yslCount)} />
          <KvRow k="Plantillas seguimiento" v={String(templates.length)} />
          <KvRow k="Aviso de privacidad" v={privacyNoticeVersion} />
        </ul>
      </article>

      <div className="md:col-span-3">
        <AuditLogCompact events={auditEvents.slice(0, 6)} />
      </div>
    </div>
  );
}

function AuditLogCompact({ events }: { events: readonly AuditEvent[] }) {
  return (
    <article className="bg-white border border-line rounded-lg p-4 flex flex-col gap-3">
      <header>
        <span className="block text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          Auditoría
        </span>
        <h3 className="m-0 font-display text-[20px] leading-tight">
          Últimos eventos críticos
        </h3>
      </header>
      {events.length === 0 ? (
        <p className="m-0 text-[15px] text-ink/60">Sin eventos recientes.</p>
      ) : (
        <ul className="list-none m-0 p-0">
          {events.map((e) => (
            <li
              key={e.id}
              className="grid grid-cols-[1.1fr_1fr_1.1fr_0.7fr] gap-3 py-2 border-b border-dashed border-line last:border-b-0 items-center"
            >
              <span className="text-[15px] font-medium">{e.title}</span>
              <span className="text-[15px] text-ink/60">{e.subject}</span>
              <span className="text-[15px] text-ink/60">{e.actor}</span>
              <span className="text-[14px] tabular text-ink/60">
                {formatAuditDateTime(e.at)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function formatAuditDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const ROLE_SCOPES: ReadonlyArray<{
  role: string;
  scopes: readonly string[];
}> = [
  {
    role: "BA",
    scopes: ["Ver sus clientes", "Crear interacciones", "Recomendar", "Enviar seguimientos"],
  },
  {
    role: "Gerente",
    scopes: ["Ver su tienda", "Coaching", "Dispositivos", "Incidencias"],
  },
  {
    role: "Supervisor",
    scopes: ["Ver su zona", "Reportes de zona", "Revisar BAs"],
  },
  {
    role: "Admin",
    scopes: ["Acceso global", "Catálogo", "Plantillas", "Auditoría", "Integraciones"],
  },
];

function describeScope(
  u: User,
  storeLookup: Readonly<Record<string, string>>,
): string {
  if (u.team) return u.team;
  if (u.zone) return u.zone;
  if (u.storeId) return storeLookup[u.storeId] ?? u.storeId;
  if (u.storeIds && u.storeIds.length) return `${u.storeIds.length} tiendas`;
  return "—";
}

// ── Sec 8 — System Health ───────────────────────────────────────────────────

function SystemHealthCard() {
  // Until F4 wires real integration health, render a static green panel so
  // the demo doesn't claim fake uptime. The numbers are conservative and
  // labelled "placeholder" for stakeholder context.
  const integrations: ReadonlyArray<{ label: string; status: "ok" }> = [
    { label: "POS · L'Oréal", status: "ok" },
    { label: "WhatsApp Business API", status: "ok" },
    { label: "E-commerce L'Oréal Luxe", status: "ok" },
  ];
  return (
    <article className="bg-white border border-line rounded-lg p-4 flex flex-col gap-3">
      <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        System Health
      </span>
      <ul className="list-none m-0 p-0 grid gap-2">
        {integrations.map((i) => (
          <li
            key={i.label}
            className="flex items-center justify-between gap-3 text-[15px]"
          >
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="w-2 h-2 rounded-full bg-ok" />
              {i.label}
            </span>
            <span className="text-[14px] text-ink/60">Operativo</span>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 gap-3 mt-2">
        <Stat label="Uptime 7d" value="99.9%" />
        <Stat label="Tickets abiertos" value="0" />
      </div>
      <span className="text-[13px] text-ink/40 italic">
        Placeholder — F4 conectará telemetría real de integraciones.
      </span>
    </article>
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

function TopClientsList({ clients }: { clients: readonly TopClient[] }) {
  if (clients.length === 0) {
    return <EmptyState message="Aún no hay clientes registrados." />;
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
                {c.lastVisitDate ? formatDateRelative(c.lastVisitDate) : "—"}
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

// ── Shared helpers ──────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-[24px] leading-none tabular">{value}</div>
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
  ranking: readonly StoreRankingEntry[],
  targets: ReadonlyMap<StoreId, number>,
): { name: string; deficit: number } | null {
  if (ranking.length < 2) return null;
  let worst = ranking[0]!;
  let worstRatio = Number.POSITIVE_INFINITY;
  for (const entry of ranking) {
    const target = targets.get(entry.storeId) ?? 0;
    if (target <= 0) continue;
    const ratio = entry.salesAmount / target;
    if (ratio < worstRatio) {
      worstRatio = ratio;
      worst = entry;
    }
  }
  if (!Number.isFinite(worstRatio)) return null;
  const target = targets.get(worst.storeId) ?? 0;
  const deficit = Math.max(0, target - worst.salesAmount);
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

function ratioPctFor(sales: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((sales / target) * 100)));
}

function trimLabels(labels: readonly string[]): string[] {
  const max = 6;
  if (labels.length <= max) return [...labels].map(formatLabel);
  const step = Math.ceil(labels.length / max);
  return labels.map((l, i) => (i % step === 0 ? formatLabel(l) : ""));
}

function formatLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
  }).format(date);
}
