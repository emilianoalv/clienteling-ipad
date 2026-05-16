import "server-only";
import type { BrandId } from "@/types/brand";
import type { ClientId } from "@/types/client";
import type { Communication } from "@/types/communication";
import type { StoreId } from "@/types/store";
import { communicationRepository } from "@/server/repositories/communication.repository";

export interface ListCommunicationsArgs {
  brands?: readonly BrandId[];
  /** Store scope. Pass `storeScopeFor(staff)`. Omit for HQ/Admin. */
  storeIds?: readonly StoreId[];
  channel?: Communication["channel"];
  clientId?: ClientId;
}

export async function listCommunications(args: ListCommunicationsArgs = {}): Promise<
  Communication[]
> {
  if (args.clientId) return communicationRepository.listByClient(args.clientId);
  return communicationRepository.list(args);
}
