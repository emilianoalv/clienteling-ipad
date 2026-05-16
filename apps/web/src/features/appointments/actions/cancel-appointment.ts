"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { isStoreInScope } from "@/server/auth/scope";
import { can } from "@/config/rbac";
import { appointmentRepository } from "@/server/repositories/appointment.repository";
import { cancelSchema, type CancelInput } from "../schemas/reschedule.schema";
import type { AppointmentId } from "@/types/appointment";

export interface CancelResult {
  ok: false;
  message: string;
}

export async function cancelAppointment(
  raw: CancelInput,
): Promise<CancelResult | { ok: true }> {
  const { staff } = await requireSession();
  if (!can(staff.role, "appointments:write")) return { ok: false, message: "Sin permiso" };

  const parsed = cancelSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Entrada inválida" };

  const current = await appointmentRepository.findById(parsed.data.appointmentId as AppointmentId);
  if (!current || !isStoreInScope(staff, current.storeId)) {
    return { ok: false, message: "Cita no encontrada" };
  }

  await appointmentRepository.patch(parsed.data.appointmentId as AppointmentId, {
    status: "cancelled",
    cancelledAt: new Date().toISOString(),
    ...(parsed.data.reason !== undefined && { cancelReason: parsed.data.reason }),
  });

  revalidatePath("/ba/appointments");
  return { ok: true };
}
