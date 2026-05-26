import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button, Icon } from "@/components/primitives";
import { SectionHeader } from "@/components/patterns";
import {
  AppointmentCalendar,
  ManagementPanel,
  listAppointments,
} from "@/features/appointments";
import { listClients } from "@/features/clients";
import { requireSession } from "@/server/auth/session";
import { brandScopeFor, storeScopeFor } from "@/server/auth/scope";

type Tab = "calendar" | "management";

/**
 * /gerente/appointments — el Gerente ve TODAS las citas de su tienda
 * agregadas (todos sus BAs). Reusa los mismos componentes que /ba/
 * appointments (AppointmentCalendar + ManagementPanel) pero con scope
 * de tienda, no de BA. Antes la ruta no existía y daba 404 desde el rail.
 */
export default async function ManagerAppointmentsPage({
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
    // Gerente ve agregado: todas las citas de la tienda (todos los BAs).
    // No filtra por baId — quiere ver el counter completo para coordinar.
    listAppointments({ brands, storeIds }),
    // Lookup global de clientes en scope — para resolver nombres en el
    // calendario y la tabla de gestión.
    listClients({ brands, storeIds }),
  ]);
  const clientLookup = Object.fromEntries(clients.map((c) => [c.id, c.name]));

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title={t("calendar.title")} eyebrow="Mi tienda" />

      <nav
        aria-label="Appointments tabs"
        className="flex gap-0 border-b border-line -mt-2"
      >
        <TabLink href="/gerente/appointments" active={tab === "calendar"}>
          {t("appointment.management.tab_calendar")}
        </TabLink>
        <TabLink href="/gerente/appointments?tab=management" active={tab === "management"}>
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

void Button;
void Icon;
