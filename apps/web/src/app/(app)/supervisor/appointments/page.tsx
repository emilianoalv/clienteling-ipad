import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/components/patterns";
import {
  AppointmentCalendar,
  ManagementPanel,
  listAppointments,
} from "@/features/appointments";
import { listClients } from "@/features/clients";
import { ExportButton } from "@/features/dashboards/components/_shared/export-button";
import { exportAgendaReport } from "@/features/dashboards/server/actions";
import { requireSession } from "@/server/auth/session";
import { brandScopeFor, storeScopeFor } from "@/server/auth/scope";
import type { DashboardFilters } from "@/features/dashboards/server/types";

type Tab = "calendar" | "management";

/**
 * /supervisor/appointments — vista agregada de todas las citas de la
 * zona del Supervisor (varias tiendas) con tabs Calendario + Gestión y
 * export RF-46. `storeScopeFor(staff)` ya devuelve `staff.storeIds`
 * para Supervisor, así que el mismo componente que sirve a Gerente
 * funciona acá multi-tienda sin tocar nada del feature.
 *
 * Antes esta ruta no existía: el supervisor solo veía el count en el
 * dashboard sin acceso al calendario completo de la zona.
 */
export default async function SupervisorAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const t = await getTranslations();
  const { staff } = await requireSession();
  const params = await searchParams;
  const tab: Tab = params.tab === "management" ? "management" : "calendar";

  const storeIds = storeScopeFor(staff);
  const brands = brandScopeFor(staff);
  const [appointments, clients] = await Promise.all([
    listAppointments({ brands, storeIds }),
    listClients({ brands, storeIds }),
  ]);
  const clientLookup = Object.fromEntries(clients.map((c) => [c.id, c.name]));

  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const exportFilters: DashboardFilters = {
    period: { from: firstOfMonth, to: today },
    ...(storeIds ? { storeIds } : {}),
    ...(brands ? { brands } : {}),
  };

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title={t("calendar.title")}
        eyebrow="Mi zona"
        right={
          <ExportButton
            filters={exportFilters}
            onExport={exportAgendaReport}
            label="Exportar agenda"
          />
        }
      />

      <nav
        aria-label="Appointments tabs"
        className="flex gap-0 border-b border-line -mt-2"
      >
        <TabLink href="/supervisor/appointments" active={tab === "calendar"}>
          {t("appointment.management.tab_calendar")}
        </TabLink>
        <TabLink
          href="/supervisor/appointments?tab=management"
          active={tab === "management"}
        >
          {t("appointment.management.tab")}
        </TabLink>
      </nav>

      {tab === "calendar" ? (
        <AppointmentCalendar appointments={appointments} clientLookup={clientLookup} />
      ) : (
        <ManagementPanel appointments={appointments} clientLookup={clientLookup} />
      )}
    </section>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`px-5 py-3.5 text-[16px] font-medium no-underline border-b-2 transition-colors ${
        active
          ? "border-ink text-ink font-semibold"
          : "border-transparent text-ink/60 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}
