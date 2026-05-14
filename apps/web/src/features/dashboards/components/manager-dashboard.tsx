import { Button, Icon, ProgressBar } from "@/components/primitives";
import { SplitBar } from "@/components/charts";
import { formatCurrency } from "@/lib/format/format-currency";
import { DashBlock, DashHeader, DashKpi } from "./_shared";

const BA_RANKING = [
  { name: "Valentina R.", sales: 486_200, pct: 108 },
  { name: "Fernanda O.", sales: 442_800, pct: 98 },
  { name: "Paulina T.", sales: 418_500, pct: 93 },
  { name: "Regina M.", sales: 388_100, pct: 86 },
  { name: "Camila S.", sales: 310_400, pct: 69 },
  { name: "Daniela V.", sales: 284_700, pct: 63 },
];

export interface ManagerDashboardProps {
  storeName: string;
}

export function ManagerDashboard({ storeName }: ManagerDashboardProps) {
  return (
    <div className="bg-bone min-h-full">
      <DashHeader
        subtitle={`Store Manager · ${storeName}`}
        title="Mi tienda"
        scopes={[
          { label: "Período", value: "MTD · Abril 2026", icon: "calendar" },
          { label: "Comparar", value: "vs. Marzo" },
          { label: "Turno", value: "Todos" },
        ]}
        actions={
          <>
            <Button variant="default" size="sm" leading={<Icon name="download" size={12} />}>
              Exportar
            </Button>
            <Button variant="primary" size="sm">
              Coaching semanal
            </Button>
          </>
        }
      />

      <div className="px-7 py-6 flex flex-col gap-2">
        <DashBlock title="Performance">
          <div className="grid grid-cols-[repeat(3,1fr)_1.4fr] gap-3">
            <DashKpi
              tall
              label="Ventas MTD"
              value={formatCurrency(5_820_000)}
              delta={7}
              spark={[420, 440, 460, 480, 520, 540, 582]}
            />
            <DashKpi tall label="Ventas QTD" value={formatCurrency(15_240_000)} delta={6} />
            <DashKpi tall label="Ventas YTD" value={formatCurrency(58_120_000)} delta={9} />
            <article className="bg-ok/[0.08] border border-ok/20 rounded-lg p-4">
              <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ok">
                HIGHLIGHT · Lift clienteling
              </div>
              <div className="font-display text-[32px] mt-1 leading-none tabular">+38%</div>
              <p className="m-0 mt-1 text-[15px] leading-snug">
                Ticket con perfil ({formatCurrency(7_850)}) vs. sin perfil ({formatCurrency(5_680)}).
                <br />
                <span className="text-ok font-semibold">Clienteling justifica la adopción.</span>
              </p>
            </article>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-3">
            <DashKpi
              label="% vs objetivo"
              value="112%"
              delta={5}
              hint={`Meta ${formatCurrency(5_200_000)}`}
              tone="ok"
            />
            <DashKpi label="Ticket promedio" value={formatCurrency(6_820)} delta={4} />
            <DashKpi
              label="Ventas clienteling"
              value={formatCurrency(3_210_000)}
              delta={14}
              hint="55% del total · atribuido a perfil"
            />
          </div>

          <article className="bg-white border border-line rounded-lg p-4 mt-3">
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2.5">
              Split Lancôme · YSL
            </div>
            <SplitBar
              a={3_490_000}
              b={2_330_000}
              aLabel="Lancôme"
              bLabel="YSL"
              aClassName="bg-lancome-rose-deep"
              bClassName="bg-ink"
            />
            <div className="flex gap-5 mt-2.5 text-[16px]">
              <div>
                <span className="text-[15px] text-ink/60">Lancôme</span>
                <div className="font-semibold tabular">{formatCurrency(3_490_000)}</div>
              </div>
              <div>
                <span className="text-[15px] text-ink/60">YSL</span>
                <div className="font-semibold tabular">{formatCurrency(2_330_000)}</div>
              </div>
              <div className="ml-auto">
                <span className="text-[15px] text-ink/60">Balance objetivo</span>
                <div className="text-[16px]">60% / 40%</div>
              </div>
            </div>
          </article>
        </DashBlock>

        <DashBlock title="Equipo" right={<Button size="sm">Gestionar BAs</Button>}>
          <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_1fr] gap-3">
            <article className="bg-white border border-line rounded-lg p-4 row-span-2">
              <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
                Ranking BAs · ventas MTD
              </div>
              <ul className="list-none m-0 mt-2.5 p-0">
                {BA_RANKING.map((r, i) => (
                  <li
                    key={r.name}
                    className="grid grid-cols-[18px_1.1fr_1fr_0.5fr] gap-2.5 items-center py-2 border-b border-dashed border-line last:border-b-0"
                  >
                    <span className="text-[16px] text-ink/60 tabular">#{i + 1}</span>
                    <span className="text-[16px] font-medium">{r.name}</span>
                    <ProgressBar
                      value={Math.min(1, r.pct / 120)}
                      tone={r.pct >= 100 ? "ok" : r.pct >= 80 ? "neutral" : "warn"}
                    />
                    <span className="text-[15px] font-semibold text-right tabular">
                      {formatCurrency(r.sales)}
                    </span>
                  </li>
                ))}
              </ul>
            </article>

            <DashKpi tall label="Adopción equipo" value="87%" delta={6} hint="11 de 12 BAs activos" tone="ok" />
            <DashKpi tall label="BAs inactivos 3 días" value="1" tone="err" hint="Daniela V. · notificada" />
            <DashKpi tall label="Perfiles nuevos (sem.)" value="96" delta={18} hint="meta 80 / sem" />
            <DashKpi tall label="Calidad perfiles (>80%)" value="84%" delta={3} hint="10 de 12 BAs sobre meta" />
          </div>
        </DashBlock>

        <DashBlock title="Clientes">
          <div className="grid grid-cols-5 gap-3">
            <DashKpi label="Activos" value="1,842" delta={4} />
            <DashKpi label="En riesgo" value="214" tone="warn" hint="sin compra 90–180 días" />
            <DashKpi label="VIP (top 20%)" value="368" hint={`LTV ≥ ${formatCurrency(150_000)}`} />
            <DashKpi label="Retención 12m" value="71%" delta={2} />
            <DashKpi label="NPS" value="9.1" hint="n = 342 respuestas" tone="ok" />
          </div>
        </DashBlock>

        <DashBlock title="Operación">
          <div className="grid grid-cols-4 gap-3">
            <DashKpi label="Citas" value="142" hint="semana · 18 hoy" drillHref="/ba/appointments" />
            <DashKpi label="No-show" value="7%" tone="warn" hint="objetivo ≤ 10%" />
            <DashKpi label="Seguimientos" value="312" hint="enviados semana" drillHref="/ba/followup" />
            <DashKpi label="Eventos" value="48" hint="14 cumpleaños · 34 reposición" />
          </div>
        </DashBlock>
      </div>
    </div>
  );
}
