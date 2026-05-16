"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { homeStoreFor } from "@/server/auth/scope";
import { can } from "@/config/rbac";
import { appointmentRepository } from "@/server/repositories/appointment.repository";
import { hasConflict } from "../services/has-conflict";
import { newAppointmentSchema, type NewAppointmentInput } from "../schemas/new-appointment.schema";
import type { ClientId } from "@/types/client";
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
  const at = new Date(`${input.date}T${input.time}:00`).toISOString();

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

  revalidatePath("/ba/appointments");
  redirect(`/ba/appointments?saved=${created.id}`);
}
