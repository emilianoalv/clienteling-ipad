"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { appointmentRepository } from "@/server/repositories/appointment.repository";
import { auditEventRepository } from "@/server/repositories/audit-event.repository";
import { clientRepository } from "@/server/repositories/client.repository";
import { communicationRepository } from "@/server/repositories/communication.repository";
import { consentRepository } from "@/server/repositories/consent.repository";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";
import { interactionRepository } from "@/server/repositories/interaction.repository";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { recommendationRepository } from "@/server/repositories/recommendation.repository";
import { sampleRepository } from "@/server/repositories/sample.repository";
import { storeRepository } from "@/server/repositories/store.repository";
import type { ClientId } from "@/types/client";

export type ArcoDeletionResult =
  | { ok: true; redirectTo: string }
  | { ok: false; message: string };

/**
 * RNF-05 · LFPDPPP · derecho al olvido. Borra el cliente y TODOS sus datos
 * transaccionales en cascada, deja un evento de auditoría inmutable con el
 * nombre y la marca de tiempo, y redirige al listado.
 *
 * El cliente físico se borra; el rastro queda en el audit log (nombre +
 * actor + timestamp + conteos) para cumplir el requisito legal de
 * trazabilidad sin re-identificar al titular.
 */
export async function requestArcoDeletion(input: {
  clientId: ClientId;
  /** El usuario debe teclear el nombre exacto del cliente para confirmar. */
  confirmName: string;
}): Promise<ArcoDeletionResult> {
  const { session, staff } = await requireSession();
  if (!can(staff.role, "clients:write")) {
    return { ok: false, message: "Sin permiso para ejercer ARCO." };
  }

  const client = await clientRepository.findById(input.clientId);
  if (!client) return { ok: false, message: "Cliente no encontrado." };

  if (input.confirmName.trim() !== client.name) {
    return {
      ok: false,
      message: "El nombre tecleado no coincide. Doble confirmación falló.",
    };
  }

  // Cascade borrado de datos transaccionales antes que el cliente.
  const [
    communications,
    consents,
    purchases,
    samples,
    recommendations,
    appointments,
    followups,
    interactions,
  ] = await Promise.all([
    communicationRepository.deleteByClient(input.clientId),
    consentRepository.deleteByClient(input.clientId),
    purchaseRepository.deleteByClient(input.clientId),
    sampleRepository.deleteByClient(input.clientId),
    recommendationRepository.deleteByClient(input.clientId),
    appointmentRepository.deleteByClient(input.clientId),
    followupTaskRepository.deleteByClient(input.clientId),
    interactionRepository.deleteByClient(input.clientId),
  ]);

  await clientRepository.delete(input.clientId);

  // Rastro auditable. Conserva el nombre + actor + conteos: en producción
  // podría hashearse el nombre, pero LFPDPPP permite mantener el ticket
  // mientras esté justificado por la obligación de probar el cumplimiento.
  const stores = await storeRepository.list();
  const storeName = stores.find((s) => s.id === client.storeId)?.name ?? client.storeId;
  await auditEventRepository.create({
    title: "ARCO · derecho al olvido ejecutado",
    subject: client.name,
    actor: `${session.userId} · ${staff.name} · ${storeName} · ${staff.role}`,
  });

  // Logging interno (no se muestra al usuario; útil en demo y para QA).
  console.info("[ARCO] Borrado cascade", {
    clientId: input.clientId,
    name: client.name,
    counts: {
      communications,
      consents,
      purchases,
      samples,
      recommendations,
      appointments,
      followups,
      interactions,
    },
  });

  revalidatePath("/ba/clients");
  revalidatePath("/admin");
  return { ok: true, redirectTo: "/ba/clients" };
}

/**
 * Variante que redirige directamente — útil cuando se invoca como form action
 * sin necesidad de manejar el resultado en el cliente.
 *
 * @internal No usado por la UI actual (ver `requestArcoDeletion`).
 */
export async function requestArcoDeletionAndRedirect(input: {
  clientId: ClientId;
  confirmName: string;
}): Promise<{ ok: false; message: string } | void> {
  const result = await requestArcoDeletion(input);
  if (!result.ok) return result;
  redirect(result.redirectTo);
}
