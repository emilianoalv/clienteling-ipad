import "server-only";
import { notFound } from "next/navigation";
import type { Appointment, AppointmentId } from "@/types/appointment";
import { appointmentRepository } from "@/server/repositories/appointment.repository";
import { clientRepository } from "@/server/repositories/client.repository";

export async function fetchAppointment(id: string): Promise<Appointment> {
  const appointment = await appointmentRepository.findById(id as AppointmentId);
  if (!appointment) notFound();
  return appointment;
}

export async function fetchAppointmentWithClient(id: string) {
  const appointment = await fetchAppointment(id);
  const client = await clientRepository.findById(appointment.clientId);
  return { appointment, client };
}
