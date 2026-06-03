"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { homeStoreFor } from "@/server/auth/scope";
import { can } from "@/config/rbac";
import { appointmentRepository } from "@/server/repositories/appointment.repository";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";
import { hasConflict } from "../services/has-conflict";
import { newAppointmentSchema, type NewAppointmentInput } from "../schemas/new-appointment.schema";
import type { ClientId } from "@/types/client";
import type { FollowupTaskId } from "@/types/followup-task";
import type { StaffId } from "@/types/staff";

export interface CreateAppointmentError {
  ok: false;
  fieldErrors?: Record<string, string[]>;
  message?: string;
}

export async function createAppointment(
  raw: NewAppointmentInput,
): Promise<CreateAppointmentError | void> {
  const { staff } = await requireSession();
  if (!can(staff.role, "appointments:write")) return { ok: false, message: "Sin permiso" };

  const storeId = homeStoreFor(staff);
  if (!storeId) return { ok: false, message: "Tu rol no tiene tienda asignada para crear citas." };

  const parsed = newAppointmentSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const input = parsed.data;
  // La hora viene del form como horario local CDMX (lo que la BA escribió en
  // el iPad). En Vercel el servidor corre en UTC, así que `new Date(string)`
  // sin offset interpreta el string como UTC → la cita aterriza 6h
  // desfasada (10:00 CDMX termina como 04:00 CDMX en el calendario, fuera
  // del rango 10-18 que renderiza). CDMX = UTC-6 (no DST), corregimos.
  const at = cdmxLocalToUtcIso(input.date, input.time);

  const existing = await appointmentRepository.list({ baId: input.baId as StaffId });
  const conflict = hasConflict(
    { baId: input.baId as StaffId, at, durationMin: input.durationMin },
    existing,
  );
  if (conflict) return { ok: false, message: "El BA ya tiene una cita en ese horario" };

  const created = await appointmentRepository.create({
    clientId: input.clientId as ClientId,
    baId: input.baId as StaffId,
    brand: input.brand,
    storeId,
    at,
    durationMin: input.durationMin,
    kind: input.kind,
    status: "scheduled",
    ...(input.notes !== undefined && { notes: input.notes }),
  });

  // Cierre del ciclo: si esta cita nació de una tarea de seguimiento
  // (chip "Cita" en /ba/followup), marcamos la task como hecha con un
  // result auto-generado. Best-effort — si la task no existe o ya está
  // hecha, no rompemos la creación de la cita.
  if (input.originatingTaskId) {
    const dateLabel = `${input.date} ${input.time}`;
    await followupTaskRepository
      .complete(
        input.originatingTaskId as FollowupTaskId,
        `Cita agendada para ${dateLabel}.`,
      )
      .catch(() => null);
    revalidatePath("/ba/followup");
  }

  revalidatePath("/ba/appointments");
  redirect(`/ba/appointments?saved=${created.id}`);
}

/**
 * Convierte un date+time local CDMX (UTC-6, sin DST) al ISO en UTC.
 * Ej: ("2026-06-11", "10:00") → "2026-06-11T16:00:00.000Z"
 */
function cdmxLocalToUtcIso(date: string, time: string): string {
  const [yyyy, mo, dd] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(Date.UTC(yyyy!, mo! - 1, dd!, hh! + 6, mm!)).toISOString();
}
