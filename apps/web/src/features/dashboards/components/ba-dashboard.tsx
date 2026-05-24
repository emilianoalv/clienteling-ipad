import Link from "next/link";
import {
  ConversionBar,
  Donut,
  Sparkline,
  type DonutSegment,
} from "@/components/charts";
import { Button, Icon, ProgressBar } from "@/components/primitives";
import { cn } from "@/lib/cn";
import { formatDateRelative, formatDateShort, smartFormatDate } from "@/lib/format/date";
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
  AlertBadge,
  DashBlock,
  DashHeader,
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
  topClients: readonly TopClient[];
  pendingFollowups: readonly PendingFollowup[];
  upcomingBirthdays: readonly UpcomingBirthday[];
  upcomingAnniversaries: readonly UpcomingAnniversary[];
  estimatedReplenishments: readonly EstimatedReplenishment[];
  operationalAlerts: readonly OperationalAlert[];
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
            <Button variant="default" size="sm" leading={<Icon name="download" size={12} />}>
              Exportar
            </Button>
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
            />,
            <HeroConversion
              key="conv"
              recoToPurchaseRate={data.recoToPurchaseRate}
              counterAvg={data.counterAverages.avgReco2PurchaseRate * 100}
              hasPeers={data.counterAverages.counterHasPeers}
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
            <AlertBadge
              count={carteraAlerts.count}
              severity={carteraAlerts.severity}
            />
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border border-line rounded-lg p-4">
            <CarteraStats
              activeClients={data.activeClients}
              atRiskClients={data.atRiskClients}
            />
            <TopClientsList clients={data.topClients} />
          </div>
        </DashBlock>

        {/* Sección 5 — Próximos pasos */}
        <DashBlock
          title="Próximos pasos"
          right={
            <AlertBadge
              count={upcomingAlerts.count}
              severity={upcomingAlerts.severity}
            />
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
  pacingText,
  pacingAhead,
}: {
  salesAmount: number;
  monthlyTarget: number;
  ratioPct: number;
  salesDelta: PeriodDeltaResult;
  sparklineValues: number[];
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
      <Sparkline values={sparklineValues} className="text-ink" />
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
}: {
  averageTicket: number;
  ticketDelta: PeriodDeltaResult;
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
      <span className="font-display text-[32px] leading-none tabular">
        {formatCurrencyCompact(averageTicket)}
      </span>
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
}: {
  recoToPurchaseRate: number;
  counterAvg: number;
  hasPeers: boolean;
}) {
  return (
    <article className="bg-white border border-line rounded-lg p-4 flex flex-col gap-2 h-full">
      <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        Conv reco → compra
      </span>
      <span className="font-display text-[32px] leading-none tabular">
        {formatPercent(recoToPurchaseRate)}
      </span>
      <span className="text-[14px] text-ink/60">
        {hasPeers
          ? `vs counter ${formatPercent(counterAvg)}`
          : "Sin peers para comparar"}
      </span>
    </article>
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
}: {
  activeClients: number;
  atRiskClients: number;
}) {
  return (
    <div className="flex flex-col gap-4 justify-center">
      <Stat label="clientas activas" value={formatCount(activeClients)} />
      <Stat
        label="en riesgo"
        value={formatCount(atRiskClients)}
        dotTone={atRiskClients > 0 ? "warn" : null}
      />
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
        <span className="font-display text-[40px] leading-none tabular">{value}</span>
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
      <span className="text-[15px] text-ink/60">{label}</span>
    </div>
  );
}

function TopClientsList({ clients }: { clients: readonly TopClient[] }) {
  if (clients.length === 0) {
    return (
      <EmptyState message="Aún no registras clientas. Tu primera visita arranca aquí." />
    );
  }
  return (
    <div>
      <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
        Top 5 clientas por valor
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
  daysAway: number;
  kind: "birthday" | "anniversary" | "replenishment";
  label: string;
  clientId: string;
};

function EventTimeline({
  birthdays,
  anniversaries,
  replenishments,
}: {
  birthdays: readonly UpcomingBirthday[];
  anniversaries: readonly UpcomingAnniversary[];
  replenishments: readonly EstimatedReplenishment[];
}) {
  const events: TimelineEvent[] = [
    ...birthdays.map((b) => ({
      date: b.birthdayDate,
      daysAway: b.daysAway,
      kind: "birthday" as const,
      label: `${b.name} · cumpleaños`,
      clientId: b.clientId as unknown as string,
    })),
    ...anniversaries.map((a) => ({
      date: a.anniversaryDate,
      daysAway: a.daysAway,
      kind: "anniversary" as const,
      label: `${a.name} · ${a.yearsAsClient}° aniversario`,
      clientId: a.clientId as unknown as string,
    })),
    ...replenishments.map((r) => ({
      date: r.estimatedDate,
      daysAway: r.daysAway,
      kind: "replenishment" as const,
      label: `${r.name} · reposición ${r.productName}`,
      clientId: r.clientId as unknown as string,
    })),
  ].sort((a, b) => a.daysAway - b.daysAway);

  if (events.length === 0) {
    return (
      <EmptyState message="No hay cumpleaños ni aniversarios en los próximos 30 días." />
    );
  }

  return (
    <div>
      <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-3">
        Próximos 30 días · {formatCount(events.length)} eventos
      </div>
      <div className="relative h-2 bg-ink/[0.06] rounded-full mb-4">
        {events.map((e, i) => (
          <span
            key={`${e.kind}-${e.clientId}-${i}`}
            className={cn(
              "absolute top-[-4px] w-3 h-3 rounded-full -translate-x-1/2 border border-white",
              e.kind === "birthday"
                ? "bg-lancome-rose-deep"
                : e.kind === "anniversary"
                ? "bg-ink"
                : "bg-warn",
            )}
            style={{ left: `${Math.min(100, (e.daysAway / 30) * 100)}%` }}
            title={`${e.label} · ${formatDateShort(e.date)}`}
          />
        ))}
      </div>
      <ul className="list-none m-0 p-0 divide-y divide-line">
        {events.slice(0, 8).map((e, i) => (
          <li
            key={`${e.kind}-${e.clientId}-${i}`}
            className="grid grid-cols-[24px_1fr_auto] gap-3 items-center py-2"
          >
            <Icon
              name={
                e.kind === "birthday"
                  ? "gift"
                  : e.kind === "anniversary"
                  ? "heart"
                  : "bag"
              }
              size={16}
              className={cn(
                e.kind === "birthday"
                  ? "text-lancome-rose-deep"
                  : e.kind === "anniversary"
                  ? "text-ink"
                  : "text-warn",
              )}
            />
            <Link
              href={`/ba/clients/${e.clientId}`}
              className="text-[16px] text-ink no-underline hover:underline"
            >
              {e.label}
            </Link>
            <span className="text-[14px] text-ink/60 tabular">
              {smartFormatDate(e.date)}
            </span>
          </li>
        ))}
      </ul>
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
