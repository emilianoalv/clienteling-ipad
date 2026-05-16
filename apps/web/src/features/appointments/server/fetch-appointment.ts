import "server-only";
import { notFound } from "next/navigation";
import type { Appointment, AppointmentId } from "@/types/appointment";
import type { Staff } from "@/types/staff";
import { appointmentRepository } from "@/server/repositories/appointment.repository";
import { clientRepository } from "@/server/repositories/client.repository";
import { isStoreInScope } from "@/server/auth/scope";

/**
 * Loads a single appointment by id, enforcing the caller's store scope.
 * Returns `notFound()` if the appointment doesn't exist OR if its `storeId`
 * is outside the caller's `visibleStoreIds`. Silent — no existence leak.
 */
export async function fetchAppointment(id: string, staff: Staff): Promise<Appointment> {
  const appointment = await appointmentRepository.findById(id as AppointmentId);
  if (!appointment) notFound();
  if (!isStoreInScope(staff, appointment.storeId)) notFound();
  return appointment;
}

export async function fetchAppointmentWithClient(id: string, staff: Staff) {
  const appointment = await fetchAppointment(id, staff);
  const client = await clientRepository.findById(appointment.clientId);
  return { appointment, client };
}
