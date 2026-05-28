import type { Report, ReportFormat } from "@/types/report";
import { Button, Icon, type IconProps } from "@/components/primitives";
import { Card, KvRow, SectionHeader } from "@/components/patterns";

const FORMAT_ICON: Record<ReportFormat, IconProps["name"]> = {
  pdf: "pdf",
  xlsx: "excel",
  csv: "excel",
};

export interface ReportsScreenProps {
  reports: readonly Report[];
}

export function ReportsScreen({ reports }: ReportsScreenProps) {
  return (
    <div className="grid grid-cols-[1fr_340px] gap-6 items-start">
      <Card variant="luxe" className="flex flex-col gap-4">
        <header className="flex items-center justify-between">
          <div>
            <span className="block text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              Reportes
            </span>
            <h2 className="m-0 font-display text-[28px] leading-tight">Biblioteca ejecutiva</h2>
          </div>
          <Button
            variant="primary"
            leading={<Icon name="plus" size={12} />}
            disabled
            title="Disponible en F4"
          >
            Programar reporte
          </Button>
        </header>

        <div className="inline-flex items-start gap-2 px-4 py-3 bg-warn/[0.08] text-warn rounded-md text-[14px] font-medium border border-warn/25 leading-snug">
          <Icon name="warning" size={14} className="mt-0.5 shrink-0" />
          <span>
            Esta vista cataloga reportes programados — feature de F4. Para descargas inmediatas
            (clientes, agenda, ventas por BA) usa los exports XLSX/CSV de los dashboards de cada
            rol (Gerente, Supervisor, Admin) o el botón &ldquo;Exportar&rdquo; en el listado de
            clientes.
          </span>
        </div>

        <ul className="list-none m-0 p-0">
          {reports.map((r) => (
            <li
              key={r.id}
              className="grid grid-cols-[24px_1.8fr_1fr_0.8fr_0.9fr_0.7fr_auto_auto] gap-3 items-center py-3 border-b border-line last:border-b-0"
            >
              <Icon name={FORMAT_ICON[r.fmt]} />
              <div>
                <div className="text-[16px] font-semibold">{r.name}</div>
                <div className="text-[15px] font-medium text-ink/60">
                  Última ejecución · {formatDate(r.lastRun)}
                </div>
              </div>
              <span className="text-[16px] text-ink/60">{r.owner}</span>
              <span className="inline-flex items-center h-[22px] px-2 rounded-pill border border-line bg-bone text-[15px] font-medium w-fit">
                {r.freq}
              </span>
              <span className="font-mono text-[15px] uppercase text-ink/60">{r.fmt}</span>
              <Button
                variant="default"
                size="sm"
                iconOnly
                aria-label="Descargar"
                disabled
                title="Disponible en F4"
              >
                <Icon name="download" size={12} />
              </Button>
              <Button variant="default" size="sm" disabled title="Disponible en F4">
                Abrir
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      <aside className="flex flex-col gap-4 sticky top-4">
        <Card>
          <SectionHeader size="inline" title="Armar reporte ad-hoc" eyebrow="Constructor rápido" />
          <KvRow
            label="Entidad"
            value="Clientes · Compras · Recomendaciones · Muestras"
          />
          <KvRow label="Dimensiones" value="Tienda · BA · Marca · Canal" />
          <KvRow label="Métricas" value="LTV · Ticket · Conv. muestra · Opt-in" />
          <KvRow label="Período" value="Semana · Mes · Trimestre · Año" />
          <KvRow label="Formato" value="PDF ejecutivo · Excel · CSV" dashed={false} />
          <Button variant="primary" className="w-full mt-3" disabled title="Disponible en F4">
            Generar
          </Button>
        </Card>
      </aside>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
