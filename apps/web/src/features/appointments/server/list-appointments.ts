import "server-only";
import type { Appointment } from "@/types/appointment";
import type { BrandId } from "@/types/brand";
import type { StaffId } from "@/types/staff";
import { appointmentRepository } from "@/server/repositories/appointment.repository";

export interface ListAppointmentsArgs {
  baId?: StaffId;
  from?: Date;
  to?: Date;
  /** BA / Manager brand scope. Mirrors prototype `useBrandLock`. */
  brands?: readonly BrandId[];
}

export async function listAppointments(args: ListAppointmentsArgs = {}): Promise<Appointment[]> {
  return appointmentRepository.list(args);
}
