import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/primitives";
import { fetchClient } from "@/features/clients";
import { AppointmentDetail } from "@/features/clients/components/appointment-detail";
import { appointmentRepository } from "@/server/repositories/appointment.repository";
import { storeRepository } from "@/server/repositories/store.repository";
import { userRepository } from "@/server/repositories/user.repository";
import { requireSession } from "@/server/auth/session";
import type { AppointmentId } from "@/types/appointment";
import type { UserId } from "@/types/user";

/**
 * Espejo read-only de /ba/clients/[id]/appointments/[appointmentId]
 * para Gerente. AppointmentDetail recibe readOnly para esconder las
 * acciones (Confirmar / Completar / Reagendar / Cancelar) — esas son
 * propias del BA, el Gerente solo consulta.
 */
export default async function GerenteAppointmentDetailPage({
  params,
}: {
  params: Promise<{ clientId: string; appointmentId: string }>;
}) {
  const { clientId, appointmentId } = await params;
  const { staff } = await requireSession();

  const appointment = await appointmentRepository.findById(appointmentId as AppointmentId);
  if (!appointment || appointment.clientId !== clientId) notFound();

  const [client, store, ba] = await Promise.all([
    fetchClient(clientId, staff),
    storeRepository.findById(appointment.storeId),
    userRepository.findById(appointment.baId as unknown as UserId),
  ]);

  return (
    <section className="flex flex-col gap-4">
      <nav
        aria-label="Breadcrumb"
        className="inline-flex items-center gap-2 text-[14.5px] font-medium"
      >
        <Link
          href={`/gerente/clients/${clientId}/appointments`}
          className="inline-flex items-center gap-1.5 text-ink hover:text-ink/80"
        >
          <Icon name="arrow-left" size={14} />
          Citas
        </Link>
        <span className="text-ink/40">/</span>
        <span className="text-ink/60">Detalle</span>
      </nav>

      <AppointmentDetail
        client={client}
        appointment={appointment}
        baName={ba?.name ?? "—"}
        storeName={store?.name ?? "—"}
        readOnly
      />
    </section>
  );
}
