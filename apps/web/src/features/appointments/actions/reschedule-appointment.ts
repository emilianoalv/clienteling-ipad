"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { appointmentRepository } from "@/server/repositories/appointment.repository";
import { hasConflict } from "../services/has-conflict";
import { rescheduleSchema, type RescheduleInput } from "../schemas/reschedule.schema";
import type { AppointmentId } from "@/types/appointment";

export interface RescheduleResult {
  ok: false;
  fieldErrors?: Record<string, string[]>;
  message?: string;
}

export async function rescheduleAppointment(
  raw: RescheduleInput,
): Promise<RescheduleResult | { ok: true }> {
  const { staff } = await requireSession();
  if (!can(staff.role, "appointments:write")) return { ok: false, message: "Sin permiso" };

  const parsed = rescheduleSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const appointmentId = parsed.data.appointmentId as AppointmentId;
  const current = await appointmentRepository.findById(appointmentId);
  if (!current) return { ok: false, message: "Cita no encontrada" };

  const newAt = new Date(`${parsed.data.date}T${parsed.data.time}:00`).toISOString();

  const existing = await appointmentRepository.list({ baId: current.baId });
  const conflict = hasConflict(
    { baId: current.baId, at: newAt, durationMin: current.durationMin, excludeId: appointmentId },
    existing,
  );
  if (conflict) return { ok: false, message: "Conflicto con otra cita del BA" };

  await appointmentRepository.patch(appointmentId, {
    at: newAt,
    status: "rescheduled",
    rescheduledAt: new Date().toISOString(),
  });

  revalidatePath("/ba/appointments");
  return { ok: true };
}
