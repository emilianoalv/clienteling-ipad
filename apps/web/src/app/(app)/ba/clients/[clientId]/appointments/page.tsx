import Link from "next/link";
import { Icon } from "@/components/primitives";
import { fetchClient } from "@/features/clients";
import { AppointmentHistory } from "@/features/clients/components/appointment-history";
import { appointmentRepository } from "@/server/repositories/appointment.repository";
import { userRepository } from "@/server/repositories/user.repository";
import { requireSession } from "@/server/auth/session";
import type { ClientId } from "@/types/client";

export default async function ClientAppointmentsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { staff } = await requireSession();
  const [client, appointments, users] = await Promise.all([
    fetchClient(clientId, staff),
    appointmentRepository.listByClient(clientId as ClientId),
    userRepository.list(),
  ]);

  const baLookup: Record<string, string> = {};
  for (const u of users) baLookup[u.id as unknown as string] = u.name;

  return (
    <section className="flex flex-col gap-4">
      <nav
        aria-label="Breadcrumb"
        className="inline-flex items-center gap-2 text-[14.5px] font-medium"
      >
        <Link
          href={`/ba/clients/${clientId}`}
          className="inline-flex items-center gap-1.5 text-ink hover:text-ink/80"
        >
          <Icon name="arrow-left" size={14} />
          Volver al perfil
        </Link>
      </nav>

      <AppointmentHistory
        clientId={clientId}
        clientName={client.name}
        appointments={appointments}
        baLookup={baLookup}
      />
    </section>
  );
}
