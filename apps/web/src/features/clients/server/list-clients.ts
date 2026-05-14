import "server-only";
import type { Client } from "@/types/client";
import type { BrandId } from "@/types/brand";
import { clientRepository } from "@/server/repositories/client.repository";

export interface ListClientsArgs {
  query?: string;
  brand?: BrandId;
  /** BA / Manager brand scope. Clients are kept only if they intersect this set. */
  brands?: readonly BrandId[];
}

export async function listClients(args: ListClientsArgs = {}): Promise<Client[]> {
  return clientRepository.list(args);
}
