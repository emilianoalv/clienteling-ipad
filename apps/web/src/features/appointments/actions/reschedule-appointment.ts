"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { brandScopeFor, isStoreInScope } from "@/server/auth/scope";
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
  // Out-of-scope returns the same error as not-found (no existence leak).
  // Brand scope: una BA Lancôme no debe poder reagendar citas YSL del
  // cliente compartido (y viceversa).
  const brandScope = brandScopeFor(staff);
  if (
    !current ||
    !isStoreInScope(staff, current.storeId) ||
    (brandScope && !brandScope.includes(current.brand))
  ) {
    return { ok: false, message: "Cita no encontrada" };
  }

  // Misma corrección que create-appointment: input es CDMX local, el server
  // está en UTC. Construimos UTC explícito con offset +6 para que la cita
  // aterrice en la hora que la BA quiso.
  const newAt = cdmxLocalToUtcIso(parsed.data.date, parsed.data.time);

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

function cdmxLocalToUtcIso(date: string, time: string): string {
  const [yyyy, mo, dd] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(Date.UTC(yyyy!, mo! - 1, dd!, hh! + 6, mm!)).toISOString();
}
