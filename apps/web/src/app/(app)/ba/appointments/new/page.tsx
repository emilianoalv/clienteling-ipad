import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/primitives";
import { SectionHeader } from "@/components/patterns";
import { NewAppointmentForm, listAppointments } from "@/features/appointments";
import { listClients } from "@/features/clients";
import { requireSession } from "@/server/auth/session";
import { brandScopeFor, storeScopeFor } from "@/server/auth/scope";
import type { StaffId } from "@/types/staff";

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const t = await getTranslations();
  const { staff } = await requireSession();
  const storeIds = storeScopeFor(staff);
  const brands = brandScopeFor(staff);
  const [clients, appointments, params] = await Promise.all([
    listClients({ brands, storeIds }),
    listAppointments({ brands, storeIds }),
    searchParams,
  ]);

  // Only pre-select when the clientId from the URL is in the BA's
  // accessible list — silently ignore otherwise to avoid leaking access.
  const defaultClientId =
    params.clientId && clients.some((c) => c.id === params.clientId)
      ? params.clientId
      : undefined;

  const baOptions: ReadonlyArray<{ id: StaffId; label: string }> = [
    { id: staff.id, label: staff.name },
  ];

  return (
    <section>
      <SectionHeader
        title={t("calendar.new")}
        eyebrow={t("calendar.title")}
        right={
          <Link
            href="/ba/appointments"
            className="inline-flex items-center gap-1.5 text-ink/60 hover:text-ink"
          >
            <Icon name="arrow-left" size={14} /> {t("app.back")}
          </Link>
        }
      />
      <NewAppointmentForm
        clients={clients}
        defaultBaId={staff.id}
        baOptions={baOptions}
        existingAppointments={appointments}
        {...(defaultClientId ? { defaultClientId } : {})}
      />
    </section>
  );
}
