import Link from "next/link";
import {
  ConversionBar,
  Donut,
  LineChart,
  type DonutSegment,
} from "@/components/charts";
import { Icon, ProgressBar } from "@/components/primitives";
import { cn } from "@/lib/cn";
import type { WoWDelta } from "../lib/wow-delta";
import { formatDateRelative, smartFormatDate } from "@/lib/format/date";
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
import type { BA } from "@/types/staff";
import type {
  BaRankingResult,
  CounterAveragesResult,
  EstimatedReplenishment,
  OperationalAlert,
  PendingFollowup,
  PeriodDeltaResult,
  SalesByCategory,
  SparklineBucket,
  TopClient,
  TopProduct,
  UpcomingAnniversary,
  UpcomingBirthday,
} from "../server/queries";
import type { DashboardFilters } from "../server/types";
import { toSparklinePoints } from "../lib/adapters";
import { computePacing } from "../lib/pacing";
import {
  exportAgendaReport,
  exportBaSales,
  exportClientsReport,
} from "../server/actions";
import {
  AlertBadge,
  DashBlock,
  DashHeader,
  ExportButton,
  FilterBar,
  HeroBlock,
  type Severity,
} from "./_shared";

const CATEGORY_COLORS: Record<keyof SalesByCategory, string> = {
  Skincare: "hsl(212, 50%, 45%)",
  Makeup: "hsl(345, 65%, 50%)",
  Fragancia: "hsl(38, 60%, 50%)",
  Unmapped: "hsl(215, 16%, 47%)",
};

export interface BaDashboardData {
  salesAmount: number;
  salesDelta: PeriodDeltaResult;
  sparklineData: readonly SparklineBucket[];
  averageTicket: number;
  ticketDelta: PeriodDeltaResult;
  baRankingInCounter: BaRankingResult;
  recoToPurchaseRate: number;
  counterAverages: CounterAveragesResult;
  transactionsCount: number;
  newClientsCount: number;
  followUpsCount: number;
  repurchaseRate: number;
  sampleToPurchaseRate: number;
  followupToRevisitRate: number;
  salesByCategory: SalesByCategory;
  topProducts: readonly TopProduct[];
  activeClients: number;
  atRiskClients: number;
  carteraSize: number;
  vipsInCartera: number;
  newClientsThisMonth: number;
  topClients: readonly TopClient[];
  pendingFollowups: readonly PendingFollowup[];
  upcomingBirthdays: readonly UpcomingBirthday[];
  upcomingAnniversaries: readonly UpcomingAnniversary[];
  estimatedReplenishments: readonly EstimatedReplenishment[];
  operationalAlerts: readonly OperationalAlert[];
  ticketWoW: WoWDelta;
  recoWoW: WoWDelta;
}

export interface BaDashboardProps {
  staff: BA;
  filters: DashboardFilters;
  storeName: string;
  monthlyTarget: number;
  data: BaDashboardData;
}

export function BaDashboard({
  staff,
  filters,
  storeName,
  monthlyTarget,
  data,
}: BaDashboardProps) {
  const ratio =
    monthlyTarget > 0 ? data.salesAmount / monthlyTarget : 0;
  const ratioPct = monthlyTarget > 0 ? Math.round(ratio * 100) : 0;
  const pacing = computePacing({
    salesAmount: data.salesAmount,
    monthlyTarget,
    period: filters.period,
  });
  const sparklineValues = toSparklinePoints([...data.sparklineData]);
  const sparklineLabels = buildXAxisLabels(data.sparklineData);
  const sparklineTitle = formatPeriodTitle(data.sparklineData);

  const carteraAlerts = countAlerts(
    data.operationalAlerts,
    (a) => a.category === "retention" || a.category === "compliance",
  );
  const upcomingAlerts = countAlerts(
    data.operationalAlerts,
    (a) => a.category === "operational",
  );

  return (
    <div className="bg-bone min-h-full">
      <DashHeader
        subtitle={`Beauty Advisor · ${staff.name} · ${storeName}`}
        title="Mi desempeño"
        actions={
          <>
            <FilterBar
              roleConfig={{ period: true, store: false, brand: false, baId: false }}
            />
            <ExportButton filters={filters} onExport={exportBaSales} />
          </>
        }
      />

      <div className="px-7 py-6 flex flex-col gap-6">
        <HeroBlock
          main={
            <HeroMain
              salesAmount={data.salesAmount}
              monthlyTarget={monthlyTarget}
              ratioPct={ratioPct}
              salesDelta={data.salesDelta}
              sparklineValues={sparklineValues}
              sparklineLabels={sparklineLabels}
              sparklineTitle={sparklineTitle}
              pacingText={pacing.text}
              pacingAhead={pacing.ratio >= 1}
            />
          }
          side={[
            <HeroRank key="rank" ranking={data.baRankingInCounter} />,
            <HeroTicket
              key="ticket"
              averageTicket={data.averageTicket}
              ticketDelta={data.ticketDelta}
              wow={data.ticketWoW}
            />,
            <HeroConversion
              key="conv"
              recoToPurchaseRate={data.recoToPurchaseRate}
              counterAvg={data.counterAverages.avgReco2PurchaseRate * 100}
              hasPeers={data.counterAverages.counterHasPeers}
              wow={data.recoWoW}
            />,
          ]}
        />

        {/* Sección 1 — Comparativa con counter */}
        <DashBlock title="Comparativa con counter">
          <CounterTable data={data} />
        </DashBlock>

        {/* Sección 2 — Conversiones del clienteling */}
        <DashBlock title="Conversiones del clienteling">
          {data.counterAverages.counterHasPeers ? (
            <div className="bg-white border border-line rounded-lg p-4 flex flex-col gap-4">
              <ConversionBar
                label="Reco → compra"
                value={data.recoToPurchaseRate}
                counterValue={data.counterAverages.avgReco2PurchaseRate * 100}
              />
              <ConversionBar
                label="Sample → compra"
                value={data.sampleToPurchaseRate}
                counterValue={data.counterAverages.avgSample2PurchaseRate * 100}
              />
              <ConversionBar
                label="Follow-up → revisita"
                value={data.followupToRevisitRate}
                counterValue={data.counterAverages.avgFollowUp2RevisitRate * 100}
              />
            </div>
          ) : (
            <EmptyState message="Sin peers en tu counter para comparar todavía. Tus conversiones se mostrarán solas hasta que se sumen más BA al counter." />
          )}
        </DashBlock>

        {/* Sección 3 — Mi mix de ventas */}
        <DashBlock title="Mi mix de ventas">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border border-line rounded-lg p-4">
            <div className="flex justify-center">
              <CategoryDonut salesByCategory={data.salesByCategory} />
            </div>
            <TopProductsList products={data.topProducts} />
          </div>
        </DashBlock>

        {/* Sección 4 — Mi cartera */}
        <DashBlock
          title="Mi cartera"
          right={
            <div className="flex items-center gap-3">
              <AlertBadge
                count={carteraAlerts.count}
                severity={carteraAlerts.severity}
              />
              <ExportButton filters={filters} onExport={exportClientsReport} label="Exportar clientes" />
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border border-line rounded-lg p-4">
            <CarteraStats
              activeClients={data.activeClients}
              atRiskClients={data.atRiskClients}
              carteraSize={data.carteraSize}
              vipsInCartera={data.vipsInCartera}
              newClientsThisMonth={data.newClientsThisMonth}
            />
            <TopClientsList clients={data.topClients} />
          </div>
        </DashBlock>

        {/* Sección 5 — Próximos pasos */}
        <DashBlock
          title="Próximos pasos"
          right={
            <div className="flex items-center gap-3">
              <AlertBadge
                count={upcomingAlerts.count}
                severity={upcomingAlerts.severity}
              />
              <ExportButton filters={filters} onExport={exportAgendaReport} label="Exportar agenda" />
            </div>
          }
        >
          <div className="bg-white border border-line rounded-lg p-4 flex flex-col gap-5">
            <EventTimeline
              birthdays={data.upcomingBirthdays}
              anniversaries={data.upcomingAnniversaries}
              replenishments={data.estimatedReplenishments}
            />
            <PendingFollowupsList
              followups={data.pendingFollowups}
              staffId={staff.id as unknown as string}
            />
          </div>
        </DashBlock>
      </div>
    </div>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function HeroMain({
  salesAmount,
  monthlyTarget,
  ratioPct,
  salesDelta,
  sparklineValues,
  sparklineLabels,
  sparklineTitle,
  pacingText,
  pacingAhead,
}: {
  salesAmount: number;
  monthlyTarget: number;
  ratioPct: number;
  salesDelta: PeriodDeltaResult;
  sparklineValues: number[];
  sparklineLabels: readonly string[];
  sparklineTitle: string;
  pacingText: string;
  pacingAhead: boolean;
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
        Ventas del período
      </span>
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="font-display text-[40px] leading-none tabular">
          {formatCurrencyCompact(salesAmount)}
        </span>
        <span className="text-[18px] text-ink/60">
          / {monthlyTarget > 0 ? formatCurrencyCompact(monthlyTarget) : "sin meta"}
        </span>
        {monthlyTarget > 0 ? (
          <span className="text-[20px] font-semibold tabular">{ratioPct}%</span>
        ) : null}
        <span className={cn("text-[16px] font-semibold tabular", tone)}>
          {formatPercentChange(salesDelta.deltaPct)}
        </span>
      </div>
      {monthlyTarget > 0 ? (
        <ProgressBar
          value={Math.min(1, salesAmount / monthlyTarget)}
          tone={ratioPct >= 100 ? "ok" : ratioPct >= 70 ? "warn" : "danger"}
        />
      ) : null}
      <LineChart
        values={sparklineValues}
        labels={sparklineLabels}
        height={200}
        showYAxis
        yAxisFormatter={formatCurrencyCompact}
        xAxisTitle={sparklineTitle}
        colors={["var(--color-ink)"]}
        className="text-ink"
      />
      {pacingText ? (
        <p
          className={cn(
            "m-0 text-[15px] leading-snug",
            pacingAhead ? "text-ok" : "text-err",
          )}
        >
          {pacingText}
        </p>
      ) : null}
    </article>
  );
}

function HeroRank({ ranking }: { ranking: BaRankingResult }) {
  const percentile =
    ranking.totalInCounter > 0
      ? Math.round(
          ((ranking.totalInCounter - ranking.myRank + 1) /
            ranking.totalInCounter) *
            100,
        )
      : 0;
  return (
    <article className="bg-white border border-line rounded-lg p-4 flex flex-col gap-2 h-full">
      <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        Posición en counter
      </span>
      <span className="font-display text-[32px] leading-none tabular">
        #{ranking.myRank}{" "}
        <span className="text-[18px] text-ink/60">de {ranking.totalInCounter}</span>
      </span>
      <div className="h-2 rounded-full bg-ink/[0.06] overflow-hidden">
        <div className="h-full bg-ink" style={{ width: `${percentile}%` }} />
      </div>
      <span className="text-[14px] text-ink/60">Top {percentile}% del counter</span>
    </article>
  );
}

function HeroTicket({
  averageTicket,
  ticketDelta,
  wow,
}: {
  averageTicket: number;
  ticketDelta: PeriodDeltaResult;
  wow: WoWDelta;
}) {
  const tone =
    ticketDelta.deltaPct > 0
      ? "text-ok"
      : ticketDelta.deltaPct < 0
      ? "text-err"
      : "text-ink/60";
  return (
    <article className="bg-white border border-line rounded-lg p-4 flex flex-col gap-2 h-full">
      <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        Ticket promedio
      </span>
      <div className="flex items-center gap-4">
        <span className="font-display text-[32px] leading-none tabular">
          {formatCurrencyCompact(averageTicket)}
        </span>
        <WoWBadge delta={wow} />
      </div>
      <span className={cn("text-[14px] font-semibold tabular", tone)}>
        {formatPercentChange(ticketDelta.deltaPct)} vs período anterior
      </span>
    </article>
  );
}

function HeroConversion({
  recoToPurchaseRate,
  counterAvg,
  hasPeers,
  wow,
}: {
  recoToPurchaseRate: number;
  counterAvg: number;
  hasPeers: boolean;
  wow: WoWDelta;
}) {
  return (
    <article className="bg-white border border-line rounded-lg p-4 flex flex-col gap-2 h-full">
      <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        Conv reco → compra
      </span>
      <div className="flex items-center gap-4">
        <span className="font-display text-[32px] leading-none tabular">
          {formatPercent(recoToPurchaseRate)}
        </span>
        <WoWBadge delta={wow} />
      </div>
      <span className="text-[14px] text-ink/60">
        {hasPeers
          ? `vs counter ${formatPercent(counterAvg)}`
          : "Sin peers para comparar"}
      </span>
    </article>
  );
}

function WoWBadge({ delta }: { delta: WoWDelta }) {
  if (delta.direction === "new") {
    return <span className="text-sm text-ink/55">· período nuevo</span>;
  }
  if (delta.direction === "flat") {
    return (
      <span className="text-sm text-ink/55">→ sin cambios esta semana</span>
    );
  }
  const isUp = delta.direction === "up";
  return (
    <span
      className={cn(
        "text-sm font-medium",
        isUp ? "text-ok" : "text-err",
      )}
    >
      {isUp ? "↗" : "↘"} {isUp ? "+" : ""}
      {delta.deltaPct}% esta semana
    </span>
  );
}

// ── Sec 1 ────────────────────────────────────────────────────────────────────

function CounterTable({ data }: { data: BaDashboardData }) {
  const peers = data.counterAverages.counterHasPeers;
  const rows: ReadonlyArray<{
    label: string;
    mine: string;
    counter: string;
    delta: string;
    tone: "ok" | "err" | "neutral";
  }> = [
    {
      label: "Transacciones",
      mine: formatCount(data.transactionsCount),
      counter: "—",
      delta: formatPercentChange(data.salesDelta.deltaPct),
      tone: signTone(data.salesDelta.deltaPct),
    },
    {
      label: "Clientes nuevos",
      mine: formatCount(data.newClientsCount),
      counter: "—",
      delta: "—",
      tone: "neutral",
    },
    {
      label: "Follow-ups enviados",
      mine: formatCount(data.followUpsCount),
      counter: "—",
      delta: "—",
      tone: "neutral",
    },
    {
      label: "Recompra 90d",
      mine: formatPercent(data.repurchaseRate),
      counter: peers
        ? formatPercent(data.counterAverages.avgFollowUp2RevisitRate * 100)
        : "—",
      delta: "—",
      tone: "neutral",
    },
  ];

  return (
    <div className="bg-white border border-line rounded-lg p-4">
      <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-3 px-2 pb-2 border-b border-line text-[14px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        <span>Métrica</span>
        <span>Tú</span>
        <span>Counter avg</span>
        <span>Δ</span>
      </div>
      <ul className="list-none m-0 p-0">
        {rows.map((r) => (
          <li
            key={r.label}
            className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-3 items-baseline px-2 py-2.5 border-b border-dashed border-line last:border-b-0"
          >
            <span className="text-[16px]">{r.label}</span>
            <span className="text-[16px] font-semibold tabular">{r.mine}</span>
            <span className="text-[16px] text-ink/60 tabular">{r.counter}</span>
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

// ── Sec 3 ────────────────────────────────────────────────────────────────────

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
    return <EmptyState message="Sin ventas registradas en este período. Prueba ampliando el rango." />;
  }

  return (
    <Donut
      segments={segments}
      centerLabel={formatCurrencyCompact(total)}
      centerSub="período"
    />
  );
}

function TopProductsList({ products }: { products: readonly TopProduct[] }) {
  if (products.length === 0) {
    return <EmptyState message="Aún no hay productos vendidos en este período." />;
  }
  return (
    <div>
      <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
        Top 5 productos
      </div>
      <ul className="list-none m-0 p-0 divide-y divide-line">
        {products.map((p) => (
          <li
            key={p.sku}
            className="grid grid-cols-[1fr_auto] gap-2 py-2"
          >
            <span className="flex flex-col">
              <span className="text-[16px] leading-snug">{p.productName}</span>
              <span className="text-[14px] text-ink/60">
                SKU {p.sku} · {formatCount(p.unitsSold)} u.
              </span>
            </span>
            <span className="text-[16px] font-semibold tabular self-center">
              {formatCurrencyCompact(p.revenue)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Sec 4 ────────────────────────────────────────────────────────────────────

function CarteraStats({
  activeClients,
  atRiskClients,
  carteraSize,
  vipsInCartera,
  newClientsThisMonth,
}: {
  activeClients: number;
  atRiskClients: number;
  carteraSize: number;
  vipsInCartera: number;
  newClientsThisMonth: number;
}) {
  const hasCartera = carteraSize > 0;
  const coveragePct = hasCartera
    ? Math.min(100, Math.round((activeClients / carteraSize) * 100))
    : 0;
  const atRiskPct = hasCartera
    ? Math.min(100, Math.round((atRiskClients / carteraSize) * 100))
    : 0;

  const activeContext = hasCartera
    ? `Atiendes el ${coveragePct}% de tu cartera asignada`
    : "Sin cartera asignada todavía";
  const atRiskContext = !hasCartera
    ? "Sin cartera asignada todavía"
    : atRiskClients === 0
      ? "Tu cartera está saludable"
      : `${atRiskPct}% de tu cartera requiere atención`;

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-8">
      <StatWithContext
        value={activeClients}
        label="clientes activos"
        context={activeContext}
        progressPct={coveragePct}
        tone="ok"
      />
      <StatWithContext
        value={atRiskClients}
        label="en riesgo"
        context={atRiskContext}
        progressPct={atRiskPct}
        tone={atRiskClients > 0 ? "warn" : "ok"}
      />
      <StatSimple
        value={vipsInCartera}
        label="VIPs en cartera"
        context={contextForVips(vipsInCartera, carteraSize)}
      />
      <StatSimple
        value={newClientsThisMonth}
        label="nuevos este mes"
        context={contextForNewClients(newClientsThisMonth, carteraSize)}
      />
    </div>
  );
}

function contextForVips(vips: number, cartera: number): string {
  if (vips === 0) return "Tu cartera está creciendo · sin VIPs aún";
  if (cartera === 0) return "";
  const pct = Math.round((vips / cartera) * 100);
  return `${pct}% de tu cartera · clientes más valiosos`;
}

function contextForNewClients(newCount: number, cartera: number): string {
  if (newCount === 0) return "Sin nuevos registros este mes";
  if (cartera === 0) return "";
  const pct = Math.round((newCount / cartera) * 100);
  return `+${newCount} clientas · ${pct}% crecimiento mensual`;
}

function StatWithContext({
  value,
  label,
  context,
  progressPct,
  tone,
}: {
  value: number;
  label: string;
  context: string;
  progressPct: number;
  tone: "ok" | "warn";
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-display text-[40px] leading-none tabular">
        {formatCount(value)}
      </span>
      <span className="text-[15px] text-ink/60">{label}</span>
      <span className="text-[12.5px] text-ink/55 mt-1">{context}</span>
      <div
        className="w-full h-1 bg-bone rounded-full overflow-hidden mt-1"
        role="progressbar"
        aria-valuenow={progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full transition-all",
            tone === "warn" ? "bg-warn" : "bg-ok",
          )}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}

function StatSimple({
  value,
  label,
  context,
}: {
  value: number;
  label: string;
  context: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-display text-[40px] leading-none tabular">
        {formatCount(value)}
      </span>
      <span className="text-[15px] text-ink/60">{label}</span>
      <span className="text-[12.5px] text-ink/55 mt-1">{context}</span>
    </div>
  );
}

function TopClientsList({ clients }: { clients: readonly TopClient[] }) {
  if (clients.length === 0) {
    return (
      <EmptyState message="Aún no registras clientes. Tu primera visita arranca aquí." />
    );
  }
  return (
    <div>
      <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
        Top 5 clientes por valor
      </div>
      <ul className="list-none m-0 p-0 divide-y divide-line">
        {clients.map((c) => {
          const lastVisit = c.lastVisitDate
            ? formatDateRelative(c.lastVisitDate)
            : "sin visita";
          return (
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
                    {c.visitsCount} visitas · última {lastVisit}
                  </span>
                </span>
                <span className="text-[16px] font-semibold tabular self-center">
                  {formatCurrencyCompact(c.totalSpent)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Sec 5 ────────────────────────────────────────────────────────────────────

type TimelineEvent = {
  date: Date;
  kind: "birthday" | "anniversary";
  fullName: string;
  clientId: string;
};

const MONTH_NAMES_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

function displayName(fullName: string): string {
  const first = fullName.split(" ")[0] ?? fullName;
  return first.length <= 12 ? first : first.slice(0, 11) + "…";
}

function EventTimeline({
  birthdays,
  anniversaries,
}: {
  birthdays: readonly UpcomingBirthday[];
  anniversaries: readonly UpcomingAnniversary[];
  replenishments: readonly EstimatedReplenishment[];
}) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDay = today.getDate();
  const monthShort = MONTH_NAMES_ES[month];
  const monthName = `${monthShort} ${year}`;

  const events: TimelineEvent[] = [
    ...birthdays.map((b) => ({
      date: new Date(b.birthdayDate),
      kind: "birthday" as const,
      fullName: b.name,
      clientId: b.clientId as unknown as string,
    })),
    ...anniversaries.map((a) => ({
      date: new Date(a.anniversaryDate),
      kind: "anniversary" as const,
      fullName: a.name,
      clientId: a.clientId as unknown as string,
    })),
  ]
    .filter((e) => e.date >= startOfMonth && e.date <= endOfMonth)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const positionPct = (day: number) =>
    daysInMonth > 1 ? ((day - 1) / (daysInMonth - 1)) * 100 : 50;

  const headerCount =
    events.length === 0
      ? "Sin eventos"
      : `${events.length} evento${events.length > 1 ? "s" : ""}`;

  const dayLabels = Array.from(
    new Set([1, 7, 14, 21, 28, daysInMonth].filter((d) => d <= daysInMonth)),
  );

  return (
    <div>
      <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-3">
        {monthName} · {headerCount}
      </div>

      {/* Nombres encima de los dots */}
      <div className="relative h-5 mb-1">
        {events.map((e, i) => (
          <span
            key={`name-${e.kind}-${e.clientId}-${i}`}
            className="absolute -translate-x-1/2 text-[11px] font-medium text-lancome-rose-deep whitespace-nowrap"
            style={{ left: `${positionPct(e.date.getDate())}%` }}
          >
            {displayName(e.fullName)}
          </span>
        ))}
      </div>

      {/* Timeline bar */}
      <div className="relative h-3">
        {/* Línea base */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-ink/15" />

        {/* Tick marks (días impares) */}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1)
          .filter((d) => d % 2 === 1)
          .map((day) => (
            <div
              key={`tick-${day}`}
              aria-hidden
              className="absolute top-1/2 w-px h-1.5 bg-ink/20"
              style={{
                left: `${positionPct(day)}%`,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}

        {/* Marcador "hoy" */}
        <div
          aria-label={`Hoy, ${todayDay} de ${monthShort}`}
          className="absolute top-1/2 w-0.5 h-4 bg-ink"
          style={{
            left: `${positionPct(todayDay)}%`,
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Dots de eventos (todos del mismo color) */}
        {events.map((e, i) => {
          const day = e.date.getDate();
          return (
            <span
              key={`dot-${e.kind}-${e.clientId}-${i}`}
              className="absolute top-1/2 w-3 h-3 rounded-full bg-lancome-rose-deep ring-2 ring-white"
              style={{
                left: `${positionPct(day)}%`,
                transform: "translate(-50%, -50%)",
              }}
              title={`${e.fullName} · ${e.kind === "birthday" ? "cumpleaños" : "aniversario"} · ${day} ${monthShort}`}
            />
          );
        })}
      </div>

      {/* Labels de días */}
      <div className="relative h-4 mt-1 text-[10px] text-ink/45">
        {dayLabels.map((day) => (
          <span
            key={`label-${day}`}
            className="absolute -translate-x-1/2"
            style={{ left: `${positionPct(day)}%` }}
          >
            {day}
          </span>
        ))}
      </div>

      {/* Empty state */}
      {events.length === 0 && (
        <p className="text-[14px] text-ink/55 italic mt-4 text-center">
          Sin cumpleaños ni aniversarios en {monthName}.
        </p>
      )}
    </div>
  );
}

function PendingFollowupsList({
  followups,
  staffId,
}: {
  followups: readonly PendingFollowup[];
  staffId: string;
}) {
  const mine = followups.filter(
    (f) => (f.baId as unknown as string) === staffId,
  );
  if (mine.length === 0) {
    return (
      <EmptyState message="Estás al día. No tienes follow-ups pendientes." />
    );
  }
  return (
    <div>
      <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
        Follow-ups pendientes · {formatCount(mine.length)}
      </div>
      <ul className="list-none m-0 p-0 divide-y divide-line">
        {mine.slice(0, 8).map((f) => (
          <li
            key={f.taskId}
            className="grid grid-cols-[1fr_auto_auto] gap-3 items-center py-2"
          >
            <Link
              href="/ba/followup"
              className="text-[16px] text-ink no-underline hover:underline"
            >
              {f.description}
            </Link>
            <span className="text-[14px] text-ink/60 uppercase tracking-[0.04em]">
              {labelForFollowupType(f.type)}
            </span>
            <span
              className={cn(
                "text-[14px] tabular",
                f.isOverdue ? "text-err font-semibold" : "text-ink/60",
              )}
            >
              {smartFormatDate(f.dueAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function labelForFollowupType(
  type: PendingFollowup["type"],
): string {
  switch (type) {
    case "call":
      return "Llamada";
    case "whatsapp":
      return "WhatsApp";
    case "email":
      return "Email";
    case "sample-feedback":
      return "Muestra";
    case "appointment":
      return "Cita";
    case "other":
      return "Otro";
  }
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

function signTone(value: number): "ok" | "err" | "neutral" {
  if (value > 0) return "ok";
  if (value < 0) return "err";
  return "neutral";
}

function countAlerts(
  alerts: readonly OperationalAlert[],
  predicate: (a: OperationalAlert) => boolean,
): { count: number; severity: Severity } {
  const filtered = alerts.filter(predicate);
  if (filtered.length === 0) return { count: 0, severity: "info" };
  const hasCritical = filtered.some((a) => a.severity === "critical");
  const hasWarning = filtered.some((a) => a.severity === "warning");
  const severity: Severity = hasCritical
    ? "critical"
    : hasWarning
    ? "warning"
    : "info";
  return { count: filtered.length, severity };
}
