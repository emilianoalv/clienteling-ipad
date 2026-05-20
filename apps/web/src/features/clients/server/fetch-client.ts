import "server-only";
import { notFound } from "next/navigation";
import type { Client, ClientId } from "@/types/client";
import type { Staff } from "@/types/staff";
import { clientRepository } from "@/server/repositories/client.repository";
import { interactionRepository } from "@/server/repositories/interaction.repository";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { sampleRepository } from "@/server/repositories/sample.repository";
import { recommendationRepository } from "@/server/repositories/recommendation.repository";
import { consentRepository } from "@/server/repositories/consent.repository";
import { appointmentRepository } from "@/server/repositories/appointment.repository";
import { communicationRepository } from "@/server/repositories/communication.repository";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";
import { userRepository } from "@/server/repositories/user.repository";
import { isStoreInScope } from "@/server/auth/scope";

/**
 * Loads a single client by id, enforcing the caller's store scope. Returns
 * `notFound()` (404) if either the client doesn't exist OR the client's
 * `storeId` is outside the caller's `visibleStoreIds` — the same response
 * for both, so the API doesn't leak existence to out-of-scope callers.
 *
 * Per `docs/06-routing-and-rbac.md`: silent 404 is the agreed pattern for
 * scope violations.
 */
export async function fetchClient(id: string, staff: Staff): Promise<Client> {
  const client = await clientRepository.findById(id as ClientId);
  if (!client) notFound();
  if (!isStoreInScope(staff, client.storeId)) notFound();
  return client;
}

export async function fetchClientWithHistory(id: string, staff: Staff) {
  const clientId = id as ClientId;
  // Validate scope upfront so we don't even start the parallel reads if the
  // caller is out of scope.
  const initial = await clientRepository.findById(clientId);
  if (!initial) notFound();
  if (!isStoreInScope(staff, initial.storeId)) notFound();

  const [
    client,
    interactions,
    purchases,
    samples,
    recommendations,
    consents,
    appointments,
    communications,
    followupTasks,
    users,
  ] = await Promise.all([
    clientRepository.findById(clientId),
    interactionRepository.listByClient(clientId),
    purchaseRepository.listByClient(clientId),
    sampleRepository.listByClient(clientId),
    recommendationRepository.listByClient(clientId),
    consentRepository.listByClient(clientId),
    appointmentRepository.listByClient(clientId),
    communicationRepository.listByClient(clientId),
    followupTaskRepository.listByClient(clientId),
    userRepository.list(),
  ]);
  if (!client) notFound();

  // baLookup: map StaffId → display name. Used by the Citas tab to render the
  // BA who attended each appointment. Includes all staff so it also works for
  // historical appointments attended by someone outside the current scope.
  const baLookup: Record<string, string> = {};
  for (const u of users) baLookup[u.id as unknown as string] = u.name;

  return {
    client,
    interactions,
    purchases,
    samples,
    recommendations,
    consents,
    appointments,
    communications,
    followupTasks,
    baLookup,
  };
}
