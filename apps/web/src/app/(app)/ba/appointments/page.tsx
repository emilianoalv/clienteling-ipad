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
import { assignedBaScopeFor, brandScopeFor, storeScopeFor } from "@/server/auth/scope";

type Tab = "calendar" | "management";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; saved?: string }>;
}) {
  const t = await getTranslations();
  const { staff } = await requireSession();
  const params = await searchParams;
  const tab: Tab = params.tab === "management" ? "management" : "calendar";
  const savedId = params.saved;

  const storeIds = storeScopeFor(staff);
  const brands = brandScopeFor(staff);
  const baOwnerId = assignedBaScopeFor(staff);
  const [appointments, clients] = await Promise.all([
    // BA solo ve sus citas (las que ella agendó). Gerente/Supervisor/Admin
    // ven todas las del scope para coordinar el counter.
    listAppointments({ brands, storeIds, ...(baOwnerId ? { baId: baOwnerId } : {}) }),
    // clientLookup SIN filtro de ownership — necesitamos el NOMBRE del
    // cliente aunque históricamente la atendiera otra BA. Sin esto,
    // citas existentes mostraban el ID raw ("cl-paloma-pol") en lugar
    // del nombre. La privacidad sigue protegida porque el BA solo ve
    // citas que ella misma agendó.
    listClients({ brands, storeIds }),
  ]);
  const clientLookup = Object.fromEntries(clients.map((c) => [c.id, c.name]));
  const savedAppointment = savedId ? appointments.find((a) => a.id === savedId) : undefined;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader
        title={t("calendar.title")}
        eyebrow={t("rail.appointments")}
        right={
          <Link href="/ba/appointments/new">
            <Button variant="primary" leading={<Icon name="plus" />}>
              {t("calendar.new")}
            </Button>
          </Link>
        }
      />

      {savedAppointment ? (
        <div className="flex items-center gap-3 px-4 py-3 rounded-md border border-ok/20 bg-ok/10 text-ok">
          <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-ok text-paper">
            <Icon name="check" size={14} />
          </span>
          <span className="text-[16px] font-semibold">{t("appointment.saved_eyebrow")}</span>
          <span className="text-[16px] font-medium text-ok/70">
            {clientLookup[savedAppointment.clientId] ?? "—"} ·{" "}
            {t(`appointment.kind.${savedAppointment.kind}`)}
          </span>
          <Link
            href="/ba/appointments"
            className="ml-auto text-[16px] font-semibold no-underline underline-offset-2 hover:underline"
            aria-label={t("app.cancel")}
          >
            ✕
          </Link>
        </div>
      ) : null}

      <nav
        aria-label="Appointments tabs"
        className="flex gap-0 border-b border-line -mt-2"
      >
        <TabLink href="/ba/appointments" active={tab === "calendar"}>
          {t("appointment.management.tab_calendar")}
        </TabLink>
        <TabLink href="/ba/appointments?tab=management" active={tab === "management"}>
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
