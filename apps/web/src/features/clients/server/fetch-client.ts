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
import { productRepository } from "@/server/repositories/product.repository";
import { userRepository } from "@/server/repositories/user.repository";
import { brandScopeFor, isStoreInScope } from "@/server/auth/scope";
import type { Product, Sku } from "@/types/product";
import { deriveAffinities } from "../services/derive-affinities";

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

  const brands = brandScopeFor(staff);
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
    products,
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
    productRepository.list({ brands }),
  ]);
  if (!client) notFound();

  // baLookup: map StaffId → display name. Used by the Citas tab to render the
  // BA who attended each appointment. Includes all staff so it also works for
  // historical appointments attended by someone outside the current scope.
  const baLookup: Record<string, string> = {};
  for (const u of users) baLookup[u.id as unknown as string] = u.name;

  // productBySku: SKU → Product. Used by RecsPreview / SamplesPreview to render
  // real product names instead of raw SKUs in the inline lists.
  const productBySku: Record<string, Product> = {};
  for (const p of products) productBySku[p.sku as Sku] = p;

  // Derive afinidades automáticas combinando perfil + historial de compras.
  // Más útil que la lista manual del seed: emerge "Fan de Génifique" tras
  // 2 compras de la línea sin que la BA tenga que marcarlo manualmente.
  const derivedAffinities = deriveAffinities({ client, purchases, productBySku });

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
    productBySku,
    derivedAffinities,
  };
}
