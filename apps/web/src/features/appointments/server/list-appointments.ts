import "server-only";
import type { Appointment } from "@/types/appointment";
import type { BrandId } from "@/types/brand";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import { appointmentRepository } from "@/server/repositories/appointment.repository";

export interface ListAppointmentsArgs {
  baId?: StaffId;
  from?: Date;
  to?: Date;
  /** BA / Manager brand scope. Mirrors prototype `useBrandLock`. */
  brands?: readonly BrandId[];
  /** Store scope. Pass `storeScopeFor(staff)`. Omit for HQ/Admin. */
  storeIds?: readonly StoreId[];
}

export async function listAppointments(args: ListAppointmentsArgs = {}): Promise<Appointment[]> {
  return appointmentRepository.list(args);
}
