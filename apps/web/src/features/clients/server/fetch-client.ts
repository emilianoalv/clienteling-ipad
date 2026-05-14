import "server-only";
import { notFound } from "next/navigation";
import type { Client, ClientId } from "@/types/client";
import { clientRepository } from "@/server/repositories/client.repository";
import { interactionRepository } from "@/server/repositories/interaction.repository";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { sampleRepository } from "@/server/repositories/sample.repository";
import { recommendationRepository } from "@/server/repositories/recommendation.repository";
import { consentRepository } from "@/server/repositories/consent.repository";
import { appointmentRepository } from "@/server/repositories/appointment.repository";
import { communicationRepository } from "@/server/repositories/communication.repository";

export async function fetchClient(id: string): Promise<Client> {
  const client = await clientRepository.findById(id as ClientId);
  if (!client) notFound();
  return client;
}

export async function fetchClientWithHistory(id: string) {
  const clientId = id as ClientId;
  const [
    client,
    interactions,
    purchases,
    samples,
    recommendations,
    consents,
    appointments,
    communications,
  ] = await Promise.all([
    clientRepository.findById(clientId),
    interactionRepository.listByClient(clientId),
    purchaseRepository.listByClient(clientId),
    sampleRepository.listByClient(clientId),
    recommendationRepository.listByClient(clientId),
    consentRepository.listByClient(clientId),
    appointmentRepository.listByClient(clientId),
    communicationRepository.listByClient(clientId),
  ]);
  if (!client) notFound();
  return {
    client,
    interactions,
    purchases,
    samples,
    recommendations,
    consents,
    appointments,
    communications,
  };
}
