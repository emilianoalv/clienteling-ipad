import "server-only";
import type { Client } from "@/types/client";
import type { BrandId } from "@/types/brand";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import { clientRepository } from "@/server/repositories/client.repository";

export interface ListClientsArgs {
  query?: string;
  brand?: BrandId;
  /** BA / Manager brand scope. Clients are kept only if they intersect this set. */
  brands?: readonly BrandId[];
  /**
   * Store scope. Clients are kept only if their `storeId` is in this set.
   * Pass `storeScopeFor(staff)` from `server/auth/scope`. Omit for HQ/Admin.
   */
  storeIds?: readonly StoreId[];
  /**
   * Ownership filter — solo el BA pasa su id aquí. Cuando viene, la lista
   * devuelta solo incluye clientes cuyo `assignedBaIds` la contiene.
   * Gerente/Supervisor/Admin lo dejan undefined y ven todo según scope.
   */
  assignedBaId?: StaffId;
}

export async function listClients(args: ListClientsArgs = {}): Promise<Client[]> {
  return clientRepository.list(args);
}
