import { Button, Icon, ProgressBar } from "@/components/primitives";
import { BarChart, SplitBar } from "@/components/charts";
import { formatCurrency } from "@/lib/format/format-currency";
import { cn } from "@/lib/cn";
import { DashBlock, DashHeader, DashKpi } from "./_shared";

const TIER_MIX: ReadonlyArray<{
  name: string;
  basePct: number;
  revenuePct: number;
  className: string;
}> = [
  { name: "Icon", basePct: 18, revenuePct: 42, className: "bg-ysl-gold" },
  { name: "Signature", basePct: 32, revenuePct: 28, className: "bg-lancome-rose-deep" },
  { name: "Atelier", basePct: 28, revenuePct: 18, className: "bg-mist" },
  { name: "Nueva", basePct: 22, revenuePct: 12, className: "bg-line" },
];

const TOP_STORES: ReadonlyArray<[string, number, number]> = [
  ["Liverpool Polanco", 28.4, 14],
  ["Palacio Polanco", 23.7, 11],
  ["Liverpool Perisur", 18.2, 9],
  ["Liverpool Interlomas", 15.9, 6],
  ["Palacio Santa Fe", 12.1, -3],
  ["Liverpool Andares", 11.4, 8],
  ["Palacio Perisur", 10.8, 4],
];

const CATEGORY_LABELS = [
  "Fragancia",
  "Skincare premium",
  "Base/Teint",
  "Labial",
  "Sérum",
  "Corrector",
  "Set regalo",
] as const;
const CATEGORY_VALUES = [42, 36, 28, 24, 22, 18, 12] as const;

export function HqDashboard() {
  return (
    <div className="bg-bone min-h-full">
      <DashHeader
        subtitle="Dirección regional · L'Oréal Luxe México"
        title="El negocio"
        scopes={[
          { label: "País", value: "México", icon: "calendar" },
          { label: "Período", value: "YTD · 2026" },
          { label: "Casa", value: "Lancôme + YSL" },
          { label: "Cadena", value: "Liverpool + Palacio" },
        ]}
        actions={
          <>
            <Button variant="default" size="sm" leading={<Icon name="download" size={12} />}>
              Board pack
            </Button>
            <Button variant="primary" size="sm">
              Vista ejecutiva
            </Button>
          </>
        }
      />

      <div className="px-7 py-7 flex flex-col gap-2">
        <section className="bg-gradient-to-b from-white to-bone border border-line rounded-xl p-6 mb-6">
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-10 items-end">
            <div>
              <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
                Ventas año a la fecha · L&apos;Oréal Luxe México
              </div>
              <div className="font-display text-[68px] leading-[1] tabular mt-2 tracking-[-0.02em]">
                {formatCurrency(168_420_000)}
              </div>
              <div className="flex gap-3.5 mt-3 items-center">
                <span className="inline-flex items-center h-7 px-3 rounded-pill bg-ok/[0.08] border border-ok/20 text-ok text-[16px] font-semibold">
                  ▲ +11% YoY
                </span>
                <span className="text-[16px]">
                  Proyección cierre anual <b className="tabular">{formatCurrency(210_500_000)}</b>
                </span>
              </div>
            </div>
            <HeroStat
              label="Ventas incrementales"
              value={formatCurrency(28_700_000)}
              hint="17% del total · atribuido a clienteling"
            />
            <HeroStat
              label="ROI del programa"
              value={
                <>
                  3.4<span className="text-[24px]">×</span>
                </>
              }
              hint={<>Payback <b className="tabular">7.2 meses</b></>}
            />
            <HeroStat
              label="Adopción BA nacional"
              value={
                <>
                  86<span className="text-[24px]">%</span>
                </>
              }
              hint={
                <>
                  <b className="tabular">324 / 378</b> BAs ·{" "}
                  <b className="text-ok">+8 pts</b>
                </>
              }
            />
          </div>
        </section>

        <DashBlock eyebrow="Financiero" caption="Ventas · Growth · Incremental · ROI · Payback · Ticket">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <DashKpi
              tall
              label="Ventas MTD"
              value={formatCurrency(42_180_000)}
              delta={9}
              spark={[36, 37, 38, 40, 41, 41, 42]}
              hint="abril 2026"
            />
            <DashKpi
              tall
              label="Ventas YTD"
              value={formatCurrency(168_420_000)}
              delta={11}
              spark={[120, 128, 135, 142, 150, 158, 168]}
            />
            <DashKpi tall label="Growth YoY" value="+11%" delta={11} tone="ok" hint="vs. YTD 2025" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <DashKpi
              tall
              label="Ventas incrementales"
              value={formatCurrency(28_700_000)}
              delta={22}
              tone="ok"
              hint="17% del total · vs. base sin perfil"
            />
            <DashKpi
              tall
              label="ROI del programa"
              value="3.4×"
              tone="ok"
              hint={`Payback 7.2 meses · inv. ${formatCurrency(8_450_000)}`}
            />
            <DashKpi
              tall
              label="Ticket nacional"
              value={formatCurrency(6_410)}
              delta={5}
              hint="con perfil 7 850 · sin perfil 5 680"
            />
          </div>
        </DashBlock>

        <DashBlock eyebrow="Clientes" caption="Base · Growth · VIP · Retención · CLV · Conversión">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <DashKpi tall label="Base activa" value="28,412" delta={7} hint="compra < 180 días" />
            <DashKpi tall label="Growth base" value="+18%" delta={18} tone="ok" hint="+4 320 clientas vs YE 2025" />
            <DashKpi tall label="VIP · contribución" value="18% / 42%" tone="ok" hint="% clientas / % revenue" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <DashKpi tall label="Retención 12m" value="73%" delta={3} hint="meta ≥ 70%" tone="ok" />
            <DashKpi tall label="CLV promedio" value={formatCurrency(41_800)} delta={9} hint="modelo 5 años" />
            <DashKpi tall label="Conversión 1→2 compra" value="46%" delta={6} hint="dentro de 90 días" />
          </div>
        </DashBlock>

        <DashBlock eyebrow="Performance" caption="Marca · Tier · Cadena · Top tiendas · Categorías">
          <div className="grid grid-cols-2 gap-3">
            <article className="bg-white border border-line rounded-xl p-5">
              <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
                Split por marca
              </div>
              <div className="mt-3.5">
                <SplitBar
                  a={101_060_000}
                  b={67_360_000}
                  aLabel="Lancôme"
                  bLabel="YSL"
                  aClassName="bg-lancome-rose-deep"
                  bClassName="bg-ink"
                />
              </div>
              <div className="flex justify-between mt-3.5 text-[16px]">
                <span>
                  <b className="tabular">{formatCurrency(101_060_000)}</b> · Lancôme ·{" "}
                  <span className="text-ok">+9%</span>
                </span>
                <span>
                  <b className="tabular">{formatCurrency(67_360_000)}</b> · YSL ·{" "}
                  <span className="text-ok">+14%</span>
                </span>
              </div>
            </article>

            <article className="bg-white border border-line rounded-xl p-5">
              <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
                Split por cadena
              </div>
              <div className="mt-3.5">
                <SplitBar
                  a={96_000_000}
                  b={72_420_000}
                  aLabel="Liverpool"
                  bLabel="Palacio"
                  aClassName="bg-ysl-gold"
                  bClassName="bg-ink"
                />
              </div>
              <div className="flex justify-between mt-3.5 text-[16px]">
                <span>
                  <b className="tabular">{formatCurrency(96_000_000)}</b> · Liverpool ·{" "}
                  <span className="text-ok">+10%</span>
                </span>
                <span>
                  <b className="tabular">{formatCurrency(72_420_000)}</b> · Palacio ·{" "}
                  <span className="text-ok">+12%</span>
                </span>
              </div>
            </article>
          </div>

          <article className="bg-white border border-line rounded-xl p-5 mt-3">
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              Mix por tier de clienta
            </div>
            <div className="grid grid-cols-4 gap-5 mt-3.5">
              {TIER_MIX.map((t) => (
                <div key={t.name}>
                  <div className={cn("h-1.5 rounded-pill", t.className)} />
                  <div className="mt-2.5">
                    <div className="font-display text-[26px] tabular">{t.basePct}%</div>
                    <div className="text-[15px]">
                      <b>{t.name}</b> · base
                    </div>
                    <div className="text-[14px] text-ink/60 mt-0.5">{t.revenuePct}% del revenue</div>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="bg-white border border-line rounded-xl p-5 mt-3">
            <div className="flex justify-between items-baseline">
              <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
                Top tiendas · YTD
              </div>
              <Button size="sm" trailing={<Icon name="arrow-right" size={12} />}>
                Ver 22 tiendas
              </Button>
            </div>
            <ul className="list-none m-0 mt-2 p-0">
              {TOP_STORES.map(([name, vM, yoy], i) => (
                <li
                  key={name}
                  className="grid grid-cols-[22px_1.4fr_1fr_auto_auto] gap-3 items-center py-3 border-b border-dashed border-line last:border-b-0"
                >
                  <span className="text-[15px] font-semibold text-ink/60 tabular">#{i + 1}</span>
                  <span className="text-[16px] font-medium">{name}</span>
                  <ProgressBar value={Math.min(1, vM / 30)} />
                  <span className="text-[16px] font-semibold tabular">
                    {formatCurrency(vM * 1_000_000)}
                  </span>
                  <span
                    className={cn(
                      "text-[15px] font-semibold tabular min-w-[40px] text-right",
                      yoy >= 0 ? "text-ok" : "text-err",
                    )}
                  >
                    {yoy >= 0 ? "+" : ""}
                    {yoy}%
                  </span>
                </li>
              ))}
            </ul>
          </article>

          <article className="bg-white border border-line rounded-xl p-5 mt-3 mb-6">
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              Top categorías · % del revenue YTD
            </div>
            <div className="mt-3">
              <BarChart values={[...CATEGORY_VALUES]} labels={[...CATEGORY_LABELS]} height={96} highlight={0} />
            </div>
          </article>
        </DashBlock>

        <DashBlock eyebrow="Adopción" caption="BAs · Tiendas · Perfiles · Calidad · Cobertura">
          <div className="grid grid-cols-5 gap-3">
            <DashKpi tall label="% BAs activos" value="86%" delta={8} tone="ok" hint="324 / 378" />
            <DashKpi tall label="Tiendas al 100%" value="14 / 22" delta={3} hint="meta 18 en Q2" />
            <DashKpi tall label="Perfiles creados YTD" value="41,280" delta={28} />
            <DashKpi tall label="Calidad de perfiles" value="82%" delta={5} hint="completitud > 80%" />
            <DashKpi tall label="Cobertura nacional" value="68%" delta={11} hint="clientela con perfil" />
          </div>
        </DashBlock>

        <DashBlock eyebrow="Operación" caption="Plataforma · flota · inversión">
          <div className="grid grid-cols-3 gap-3">
            <DashKpi tall label="Uptime plataforma" value="99.92%" tone="ok" hint="SLA 99.5% · sin incidentes P1" />
            <DashKpi tall label="iPads activos" value="412 / 430" hint="96% de flota · 18 fuera de servicio" />
            <DashKpi
              tall
              label="Costos operativos YTD"
              value={formatCurrency(8_450_000)}
              delta={4}
              hint={`~${formatCurrency(515_244)} / mes · licencias + soporte`}
            />
          </div>
        </DashBlock>
      </div>
    </div>
  );
}

function HeroStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        {label}
      </div>
      <div className="font-display text-[40px] leading-none tabular mt-1">{value}</div>
      <div className="text-[16px] mt-1">{hint}</div>
    </div>
  );
}
