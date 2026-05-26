import Link from "next/link";
import { Card } from "@/components/patterns";
import { Icon, type IconProps } from "@/components/primitives";
import {
  ExportButton,
  FilterBar,
} from "@/features/dashboards/components/_shared";
import {
  exportBaPerformance,
  exportClientsReport,
  exportConversionByBa,
} from "@/features/dashboards/server/actions";
import type { DashboardFilters } from "@/features/dashboards/server/types";
import type { StaffId } from "@/types/staff";

/**
 * Reportes del Gerente — cumple RF-43 / RF-45 / RF-47.
 *
 * No es una "biblioteca de reportes programados" (eso era el placeholder
 * F4). Cada card es un export real que corre con el scope del Gerente
 * (tienda + marcas) intersectado con los filtros que la usuaria
 * selecciona arriba.
 *
 * RF-46 (agenda) vive en `/gerente/appointments` con su propio
 * `<ExportButton>` — no se duplica aquí. El card debajo solo lo
 * referencia con un link.
 */
export interface GerenteReportsScreenProps {
  filters: DashboardFilters;
  baOptions: ReadonlyArray<{ id: StaffId; label: string }>;
  /** Si el Gerente ve una sola marca, ocultamos el selector de marca. */
  showBrandFilter: boolean;
}

interface ReportCard {
  icon: IconProps["name"];
  title: string;
  description: string;
  action: (filters: DashboardFilters, format: "xlsx" | "csv") => Promise<{
    base64: string;
    mimeType: string;
    filename: string;
  }>;
}

export function GerenteReportsScreen({
  filters,
  baOptions,
  showBrandFilter,
}: GerenteReportsScreenProps) {
  const cards: ReadonlyArray<ReportCard> = [
    {
      icon: "user",
      title: "Listado de clientes",
      description:
        "Exporta el padrón completo de la tienda con nombre, teléfono, nacimiento, último BA, cliente desde, último contacto, última transacción y tipo de seguimiento. Útil para campañas y reactivación.",
      action: exportClientsReport,
    },
    {
      icon: "users",
      title: "Desempeño por BA",
      description:
        "Una fila por BA con # transacciones, clientes registrados, seguimientos completados y recomendaciones hechas en el período. Para evaluaciones y coaching.",
      action: exportBaPerformance,
    },
    {
      icon: "sparkle",
      title: "Tasa de conversión por BA",
      description:
        "Por cada BA: % de recomendaciones que terminaron en compra y % de seguimientos completados que generaron revisita en los siguientes 30 días.",
      action: exportConversionByBa,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <FilterBar
        roleConfig={{
          period: true,
          store: false,
          brand: showBrandFilter,
          baId: true,
        }}
        scopeOptions={{ bas: baOptions }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {cards.map((card) => (
          <Card key={card.title} variant="luxe" className="flex flex-col gap-4">
            <ReportHeader icon={card.icon} title={card.title} />
            <p className="m-0 text-[14.5px] leading-snug text-ink/65">
              {card.description}
            </p>
            <div className="flex justify-end mt-auto">
              <ExportButton
                filters={filters}
                onExport={card.action}
                label="Descargar"
              />
            </div>
          </Card>
        ))}

        {/* Agenda — el export real vive en /gerente/appointments. No
            replicamos el botón para no tener dos fuentes que pueden
            divergir; aquí solo señalizamos dónde está. */}
        <Card className="flex flex-col gap-4 border-dashed">
          <ReportHeader icon="calendar" title="Reporte de agenda" />
          <p className="m-0 text-[14.5px] leading-snug text-ink/65">
            La exportación de citas con sus columnas (nombre, teléfono, fecha,
            tipo de evento, comentario) ya vive en la pantalla de Agenda
            porque ahí se aplican los mismos filtros de tab y BA.
          </p>
          <div className="flex justify-end mt-auto">
            <Link
              href="/gerente/appointments"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md border border-line bg-white text-[15px] font-semibold text-ink no-underline hover:bg-bone transition-colors"
            >
              Ir a Agenda
              <Icon name="arrow-right" size={13} />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ReportHeader({
  icon,
  title,
}: {
  icon: IconProps["name"];
  title: string;
}) {
  return (
    <header className="flex items-center gap-4 pb-3 border-b border-line">
      <span
        aria-hidden
        className="inline-flex w-14 h-14 items-center justify-center rounded-full bg-ink text-paper shrink-0"
      >
        <Icon name={icon} size={26} />
      </span>
      <h3 className="m-0 font-display text-[28px] leading-[1.05] tracking-[-0.015em] text-ink">
        {title}
      </h3>
    </header>
  );
}
