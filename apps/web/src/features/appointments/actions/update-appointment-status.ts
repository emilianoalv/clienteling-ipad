"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { appointmentRepository } from "@/server/repositories/appointment.repository";
import type { AppointmentId } from "@/types/appointment";

type SimpleTransition = "confirm" | "complete" | "no-show";

const STATUS_BY_TRANSITION = {
  confirm: "confirmed",
  complete: "completed",
  "no-show": "no-show",
} as const;

export async function transitionAppointment(
  appointmentId: string,
  transition: SimpleTransition,
): Promise<{ ok: false; message: string } | { ok: true }> {
  const { staff } = await requireSession();
  if (!can(staff.role, "appointments:write")) return { ok: false, message: "Sin permiso" };

  await appointmentRepository.patch(appointmentId as AppointmentId, {
    status: STATUS_BY_TRANSITION[transition],
  });

  revalidatePath("/ba/appointments");
  return { ok: true };
}
