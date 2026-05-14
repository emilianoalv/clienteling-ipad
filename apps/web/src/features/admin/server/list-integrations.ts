import "server-only";
import type { Integration } from "@/types/integration";
import { integrationRepository } from "@/server/repositories/integration.repository";

export async function listIntegrations(): Promise<Integration[]> {
  return integrationRepository.list();
}
