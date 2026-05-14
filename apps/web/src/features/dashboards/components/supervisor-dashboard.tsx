import { Button, Icon, ProgressBar } from "@/components/primitives";
import { Heatmap, LineChart, ScatterPlot, StatusLight, type StatusLightLevel } from "@/components/charts";
import { formatCurrency } from "@/lib/format/format-currency";
import { cn } from "@/lib/cn";
import { DashBlock, DashHeader, DashKpi } from "./_shared";

interface ZoneStore {
  id: string;
  label: string;
  sales: number;
  pct: number;
  yoy: number;
  adoption: number;
  clients: number;
  status: StatusLightLevel;
}

const STORES: readonly ZoneStore[] = [
  { id: "st-001", label: "Liverpool Polanco", sales: 5_820_000, pct: 112, yoy: 14, adoption: 87, clients: 1842, status: "verde" },
  { id: "st-002", label: "Liverpool Interlomas", sales: 3_410_000, pct: 94, yoy: 6, adoption: 72, clients: 1140, status: "amarillo" },
  { id: "st-003", label: "Palacio Polanco", sales: 4_980_000, pct: 104, yoy: 9, adoption: 82, clients: 1520, status: "verde" },
  { id: "st-004", label: "Palacio Santa Fe", sales: 2_140_000, pct: 71, yoy: -3, adoption: 54, clients: 820, status: "rojo" },
  { id: "st-005", label: "Liverpool Perisur", sales: 3_820_000, pct: 96, yoy: 5, adoption: 76, clients: 1290, status: "amarillo" },
];

const STATUS_COUNTS = STORES.reduce(
  (acc, s) => {
    acc[s.status]++;
    return acc;
  },
  { verde: 0, amarillo: 0, rojo: 0 } as Record<StatusLightLevel, number>,
);

const TREND_WEEKS = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10", "S11", "S12"] as const;

export interface SupervisorDashboardProps {
  supervisorName: string;
}

export function SupervisorDashboard({ supervisorName }: SupervisorDashboardProps) {
  return (
    <div className="bg-bone min-h-full">
      <DashHeader
        subtitle={`Supervisor de zona · ${supervisorName} · Centro CDMX`}
        title="Mis tiendas"
        scopes={[
          { label: "Zona", value: "Centro · 5 tiendas", icon: "calendar" },
          { label: "Período", value: "MTD · Abril 2026" },
          { label: "Cadena", value: "Todas" },
        ]}
        actions={
          <>
            <Button variant="default" size="sm" leading={<Icon name="download" size={12} />}>
              Exportar
            </Button>
            <Button variant="primary" size="sm">
              Abrir coaching
            </Button>
          </>
        }
      />

      <div className="px-7 py-6 flex flex-col gap-2">
        <DashBlock title="Overview">
          <div className="grid grid-cols-5 gap-3">
            <DashKpi tall label="Ventas" value={formatCurrency(20_170_000)} delta={8} spark={[14, 15, 16, 17, 18, 19, 20]} />
            <DashKpi tall label="% objetivo" value="96%" hint={`Meta ${formatCurrency(21_000_000)}`} tone="warn" />
            <DashKpi tall label="Growth YoY" value="+8%" delta={8} tone="ok" />
            <DashKpi tall label="Adopción" value="74%" delta={5} hint="de 52 BAs en zona" />
            <DashKpi tall label="Clientes activos" value="6,612" delta={4} />
          </div>
        </DashBlock>

        <DashBlock
          eyebrow="Crítico"
          title="Semáforo de tiendas"
          caption="Basado en ventas vs objetivo + adopción BA"
        >
          <article className="bg-white border border-line rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 mb-3.5 pb-3.5 border-b border-line">
              <SemBucket level="verde" count={STATUS_COUNTS.verde} note="≥100% objetivo · ≥80% adopción" />
              <SemBucket level="amarillo" count={STATUS_COUNTS.amarillo} note="85–99% objetivo · 60–79% adopción" />
              <SemBucket level="rojo" count={STATUS_COUNTS.rojo} note="<85% objetivo · <60% adopción · intervención" />
            </div>

            <div className="grid grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr_auto] gap-3 px-1 pb-2 border-b border-line mb-1 text-[14px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              <span>Tienda</span>
              <span>Estado</span>
              <span>Ventas</span>
              <span>% obj.</span>
              <span>YoY</span>
              <span>Adopción</span>
              <span>Acción</span>
            </div>
            <ul className="list-none m-0 p-0">
              {STORES.map((s) => (
                <li
                  key={s.id}
                  className="grid grid-cols-[1.6fr_0.8fr_0.8fr_0.8fr_0.8fr_0.8fr_auto] gap-3 items-center py-3 border-b border-dashed border-line last:border-b-0"
                >
                  <span className="text-[16px] font-medium">{s.label}</span>
                  <StatusLight status={s.status} />
                  <span className="text-[16px] font-semibold tabular">{formatCurrency(s.sales)}</span>
                  <span
                    className={cn(
                      "text-[16px] font-semibold tabular",
                      s.pct >= 100 ? "text-ok" : s.pct >= 85 ? "text-warn" : "text-err",
                    )}
                  >
                    {s.pct}%
                  </span>
                  <span
                    className={cn(
                      "text-[16px] font-semibold tabular",
                      s.yoy >= 0 ? "text-ok" : "text-err",
                    )}
                  >
                    {s.yoy >= 0 ? "+" : ""}
                    {s.yoy}%
                  </span>
                  <div className="flex items-center gap-2">
                    <ProgressBar
                      value={s.adoption / 100}
                      tone={s.adoption >= 80 ? "ok" : s.adoption >= 60 ? "warn" : "danger"}
                    />
                    <span className="text-[15px] tabular w-8">{s.adoption}%</span>
                  </div>
                  <Button size="sm" trailing={<Icon name="arrow-right" size={12} />}>
                    Drill
                  </Button>
                </li>
              ))}
            </ul>
          </article>
        </DashBlock>

        <DashBlock title="Ranking">
          <div className="grid grid-cols-2 gap-3">
            <RankCard
              title="Top / Bottom · Ventas"
              rows={[...STORES]
                .sort((a, b) => b.sales - a.sales)
                .map((s) => ({ label: s.label, value: formatCurrency(s.sales) }))}
            />
            <RankCard
              title="Top / Bottom · Adopción"
              rows={[...STORES]
                .sort((a, b) => b.adoption - a.adoption)
                .map((s) => ({ label: s.label, value: `${s.adoption}%` }))}
            />
          </div>

          <article className="bg-white border border-line rounded-lg p-4 mt-3">
            <div className="flex justify-between items-baseline">
              <div>
                <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
                  Scatter · adopción vs ventas
                </div>
                <div className="font-display text-[18px] mt-0.5 leading-tight">
                  Correlación por tienda
                </div>
              </div>
              <span className="text-[15px] text-ink/60">
                Cuadrantes: Estrella · Rezagada · Alta adopción · Altas ventas
              </span>
            </div>
            <div className="mt-3">
              <ScatterPlot
                points={STORES.map((s) => ({
                  label: s.label.split(" ").slice(-1)[0] ?? s.label,
                  adoption: s.adoption,
                  sales: s.sales,
                }))}
              />
            </div>
            <article className="mt-2.5 px-3 py-3 rounded-lg bg-err/[0.08] border border-err/20">
              <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-err">
                Desviación detectada
              </div>
              <p className="m-0 mt-1 text-[16px]">
                <b>Palacio Santa Fe</b> cayó a 54% adopción y 71% objetivo — revisar turnos y plan de coaching.
              </p>
            </article>
          </article>
        </DashBlock>

        <DashBlock title="Operación">
          <div className="grid grid-cols-4 gap-3">
            <DashKpi tall label="% iPads activos" value="94%" hint="47 de 50 dispositivos" tone="ok" />
            <DashKpi tall label="Tickets abiertos" value="6" tone="warn" />
            <DashKpi tall label="Tiempo resolución" value="14h" hint="mediana · SLA 24h" />
            <article className="bg-white border border-line rounded-lg p-4">
              <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
                Categorías de tickets
              </div>
              <ul className="list-none m-0 mt-1.5 p-0">
                {[
                  ["Login", 2],
                  ["Sincronización", 2],
                  ["Impresora recibo", 1],
                  ["Red tienda", 1],
                ].map(([cat, n]) => (
                  <li
                    key={cat as string}
                    className="grid grid-cols-[1fr_auto] items-center py-1.5 border-b border-dashed border-line last:border-b-0"
                  >
                    <span className="text-[16px]">{cat}</span>
                    <span className="text-[16px] font-semibold tabular">{n}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </DashBlock>

        <DashBlock title="Tendencias">
          <div className="grid grid-cols-2 gap-3">
            <article className="bg-white border border-line rounded-lg p-4">
              <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
                12 semanas · Ventas zona
              </div>
              <div className="mt-2">
                <LineChart
                  series={[[3.8, 4.0, 4.1, 3.9, 4.2, 4.4, 4.6, 4.5, 4.7, 4.9, 5.0, 5.1]]}
                  labels={TREND_WEEKS}
                />
              </div>
            </article>
            <article className="bg-white border border-line rounded-lg p-4">
              <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
                12 semanas · Adopción zona
              </div>
              <div className="mt-2">
                <LineChart
                  series={[[58, 60, 62, 64, 66, 68, 70, 72, 73, 74, 74, 75]]}
                  labels={TREND_WEEKS}
                  colors={["var(--color-ok)"]}
                />
              </div>
            </article>

            <article className="bg-white border border-line rounded-lg p-4">
              <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
                Liverpool vs Palacio · ventas 12 s
              </div>
              <div className="mt-2">
                <LineChart
                  series={[
                    [2.1, 2.2, 2.3, 2.2, 2.4, 2.5, 2.7, 2.6, 2.8, 2.9, 3.0, 3.1],
                    [1.7, 1.8, 1.8, 1.7, 1.8, 1.9, 1.9, 1.9, 1.9, 2.0, 2.0, 2.0],
                  ]}
                  labels={TREND_WEEKS}
                  colors={["var(--color-lancome-rose-deep)", "var(--color-ink)"]}
                  legend={["Liverpool", "Palacio"]}
                />
              </div>
            </article>

            <article className="bg-white border border-line rounded-lg p-4">
              <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
                Heatmap México · ventas por región
              </div>
              <div className="mt-3">
                <Heatmap
                  cells={[
                    { region: "CDMX Norte", value: "5.8M", intensity: 0.95 },
                    { region: "CDMX Sur", value: "4.2M", intensity: 0.75 },
                    { region: "Santa Fe", value: "2.1M", intensity: 0.3 },
                    { region: "GDL", value: "3.4M", intensity: 0.55 },
                    { region: "MTY", value: "3.9M", intensity: 0.65 },
                    { region: "Puebla", value: "1.8M", intensity: 0.25 },
                    { region: "Querétaro", value: "1.2M", intensity: 0.2 },
                    { region: "Cancún", value: "2.6M", intensity: 0.42 },
                    { region: "Mérida", value: "0.9M", intensity: 0.15 },
                    { region: "Toluca", value: "0.8M", intensity: 0.12 },
                    { region: "León", value: "1.1M", intensity: 0.18 },
                    { region: "Tijuana", value: "1.4M", intensity: 0.22 },
                  ]}
                />
              </div>
            </article>
          </div>
        </DashBlock>
      </div>
    </div>
  );
}

function SemBucket({
  level,
  count,
  note,
}: {
  level: StatusLightLevel;
  count: number;
  note: string;
}) {
  const tone =
    level === "verde"
      ? { bg: "bg-ok/[0.08]", dot: "bg-ok", label: "Verde" }
      : level === "amarillo"
      ? { bg: "bg-warn/[0.08]", dot: "bg-warn", label: "Amarillo" }
      : { bg: "bg-err/[0.08]", dot: "bg-err", label: "Rojo" };
  return (
    <div className={cn("p-3.5 rounded-md", tone.bg)}>
      <div className="flex items-center gap-2 text-[16px] font-semibold">
        <span className={cn("inline-block w-2.5 h-2.5 rounded-full", tone.dot)} />
        {tone.label}
      </div>
      <div className="font-display text-[36px] mt-1 leading-none tabular">{count}</div>
      <div className="text-[15px] text-ink/60 mt-0.5">{note}</div>
    </div>
  );
}

function RankCard({
  title,
  rows,
}: {
  title: string;
  rows: ReadonlyArray<{ label: string; value: string }>;
}) {
  return (
    <article className="bg-white border border-line rounded-lg p-4">
      <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        {title}
      </div>
      <ul className="list-none m-0 mt-1 p-0">
        {rows.map((r, i) => {
          const isTop = i < 2;
          const isBot = i === rows.length - 1;
          return (
            <li
              key={r.label}
              className="grid grid-cols-[24px_1fr_auto_auto] gap-2.5 items-center py-2 border-b border-dashed border-line last:border-b-0"
            >
              <span
                className={cn(
                  "text-[16px] font-semibold tabular",
                  isTop ? "text-ok" : isBot ? "text-err" : "text-ink/60",
                )}
              >
                #{i + 1}
              </span>
              <span className="text-[16px]">{r.label}</span>
              <span className="text-[16px] font-semibold tabular">{r.value}</span>
              {isTop ? (
                <span className="text-[14px] font-semibold uppercase tracking-[0.04em] text-ok px-1.5 rounded-pill border border-ok/20 bg-ok/10">
                  TOP
                </span>
              ) : isBot ? (
                <span className="text-[14px] font-semibold uppercase tracking-[0.04em] text-err px-1.5 rounded-pill border border-err/20 bg-err/10">
                  BOTTOM
                </span>
              ) : (
                <span />
              )}
            </li>
          );
        })}
      </ul>
    </article>
  );
}
