import { Button, Icon, ProgressBar } from "@/components/primitives";
import { BarChart } from "@/components/charts";
import { formatCurrency } from "@/lib/format/format-currency";
import { DashBlock, DashHeader, DashKpi } from "./_shared";

const RANKING_BARS = [95, 92, 90, 88, 85, 82, 80, 78, 75, 70, 65, 60] as const;
const MY_POSITION = 3;
const PERFILES_SEM = [2, 3, 4, 2, 3, 2, 2] as const;

export interface BaDashboardProps {
  baName: string;
  storeName: string;
}

/**
 * BA "Mi desempeño" dashboard. Mirrors prototype `DashBA`.
 *
 * Numbers are hardcoded prototype values; F4 will wire them to a real KPI
 * service that derives metrics from purchases / interactions / recommendations.
 */
export function BaDashboard({ baName, storeName }: BaDashboardProps) {
  return (
    <div className="bg-bone min-h-full">
      <DashHeader
        subtitle={`Beauty Advisor · ${baName} · ${storeName}`}
        title="Mi desempeño"
        scopes={[
          { label: "Período", value: "Abril 2026", icon: "calendar" },
          { label: "Marca", value: "Todas" },
          { label: "Comparar", value: "vs. Marzo" },
        ]}
        actions={
          <>
            <Button variant="default" size="sm" leading={<Icon name="download" size={12} />}>
              Exportar
            </Button>
            <Button variant="primary" size="sm">
              Ver objetivos
            </Button>
          </>
        }
      />

      <div className="px-7 py-6 flex flex-col gap-2">
        <DashBlock eyebrow="Impacto de negocio" caption="Toca para desglosar">
          <div className="grid grid-cols-4 gap-3">
            <DashKpi
              tall
              label="Ventas mes"
              value={formatCurrency(486_200)}
              delta={12}
              spark={[320, 340, 380, 360, 410, 430, 486]}
              hint="vs. marzo"
              drillHref="/ba/purchases"
            />
            <DashKpi
              tall
              label="Ventas trimestre"
              value={formatCurrency(1_264_000)}
              delta={9}
              spark={[380, 420, 470, 480, 460, 510, 486]}
              hint="Q2 en curso"
              drillHref="/ba/purchases"
            />
            <DashKpi
              tall
              label="% vs objetivo"
              value="108%"
              delta={8}
              hint={`Meta ${formatCurrency(450_000)}`}
              tone="ok"
            />
            <DashKpi
              tall
              label="Ticket promedio"
              value={formatCurrency(5_820)}
              delta={4}
              spark={[5100, 5300, 5420, 5500, 5620, 5700, 5820]}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <DashKpi
              label="Conversión recomendación → compra"
              value="58%"
              delta={6}
              hint="42 / 72 recomendaciones"
              drillHref="/ba/clients"
            />
            <DashKpi label="Clientes nuevos" value="14" delta={2} hint="mes actual" drillHref="/ba/clients" />
            <DashKpi label="Recompra 90 días" value="41%" delta={3} hint="68 / 164 clientas" drillHref="/ba/clients" />
          </div>
        </DashBlock>

        <DashBlock
          eyebrow="Gestión de cartera"
          right={
            <Button size="sm" trailing={<Icon name="arrow-right" size={12} />}>
              Abrir cartera
            </Button>
          }
        >
          <div className="grid grid-cols-3 gap-3">
            <DashKpi label="Clientes activos" value="164" hint="contacto < 180 días" drillHref="/ba/clients" />
            <DashKpi label="Clientes en riesgo" value="22" tone="warn" hint="sin compra 90–180 días" drillHref="/ba/clients" />
            <DashKpi label="Seguimientos hoy" value="7" tone="err" hint="pendientes de enviar" drillHref="/ba/followup" />
            <DashKpi label="Citas semana" value="9" hint="4 confirmadas · 5 propuestas" drillHref="/ba/appointments" />
            <DashKpi label="Eventos" value="11" hint="3 cumpleaños · 8 reposición" drillHref="/ba/clients" />
            <DashKpi label="Muestras con conversión" value="32%" delta={5} hint="14 de 44 cerraron venta" drillHref="/ba/samples" />
          </div>
        </DashBlock>

        <DashBlock eyebrow="Adopción" caption="Uso · completitud · ranking">
          <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-3">
            <article className="bg-white border border-line rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
                    Perfiles semana
                  </div>
                  <div className="font-display text-[36px] mt-1 leading-none tabular">18</div>
                  <div className="text-[15px] mt-1 text-ink/60">
                    meta 15 / sem · <span className="text-ok font-semibold">+20%</span>
                  </div>
                </div>
                <BarChart
                  values={[...PERFILES_SEM]}
                  labels={["L", "M", "X", "J", "V", "S", "D"]}
                  height={62}
                  className="w-32"
                />
              </div>
            </article>
            <DashKpi tall label="Completitud de perfil" value="87%" delta={4} hint="Objetivo ≥ 80%" tone="ok" />
            <DashKpi tall label="Días consecutivos usando app" value="23" hint="racha actual · récord 41" />
          </div>

          <article className="bg-white border border-line rounded-lg p-4 mt-3">
            <div className="flex justify-between items-baseline">
              <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
                Ranking adopción (sin nombres)
              </div>
              <span className="text-[15px] text-ink/60">mi posición entre 12 BAs Polanco</span>
            </div>
            <div className="flex items-end gap-1 h-16 mt-3">
              {RANKING_BARS.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={
                      i === MY_POSITION
                        ? "w-full rounded-sm bg-ink"
                        : "w-full rounded-sm bg-ink/[0.08]"
                    }
                    style={{ height: `${v}%` }}
                  />
                  <span
                    className={
                      i === MY_POSITION
                        ? "text-[13px] font-semibold text-ink"
                        : "text-[13px] text-ink/60"
                    }
                  >
                    {i === MY_POSITION ? "TÚ" : `#${i + 1}`}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[15px] text-ink/60">Top 25% del equipo</span>
              <span className="text-[15px] font-medium tabular">#4 de 12</span>
            </div>
          </article>
        </DashBlock>

        <ProgressHelper />
      </div>
    </div>
  );
}

/**
 * Tiny progress legend at the very bottom — pure decoration so the page has
 * a visible end on the iPad viewport.
 */
function ProgressHelper() {
  return (
    <div className="mt-2 flex items-center gap-3">
      <ProgressBar value={0.87} tone="ok" />
      <span className="text-[15px] text-ink/60 whitespace-nowrap">87% adopción</span>
    </div>
  );
}
