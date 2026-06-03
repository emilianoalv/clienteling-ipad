import "server-only";
import type { BrandId } from "@/types/brand";
import type { ClientId } from "@/types/client";
import type { Communication, CommunicationId } from "@/types/communication";
import type { StoreId } from "@/types/store";
import { generateId } from "@/lib/id/generate-id";
import { SEED_COMMUNICATIONS } from "./seed";
import { MAY_2026_COMMUNICATIONS } from "./seed-may-2026";
import { persistent } from "./_persist";
import { appendOverlayCommunication, readOverlayCommunications } from "./_overlay";

export interface CommunicationListFilter {
  brands?: readonly BrandId[];
  /**
   * Store scope of the requesting staff. Use `visibleStoreIds(staff, allStoreIds)` to compute.
   * Omit to disable scoping (Admin/HQ).
   */
  storeIds?: readonly StoreId[];
  channel?: Communication["channel"];
}

export interface CommunicationRepository {
  list(filter?: CommunicationListFilter): Promise<Communication[]>;
  listByClient(clientId: ClientId): Promise<Communication[]>;
  create(input: Omit<Communication, "id">): Promise<Communication>;
  /** ARCO cascade — borra todas las comunicaciones de un cliente. */
  deleteByClient(clientId: ClientId): Promise<number>;
}

const COMMUNICATIONS: Communication[] = persistent("__clienteling.communications.v4", () => [
  ...SEED_COMMUNICATIONS,
  ...MAY_2026_COMMUNICATIONS,
]);

async function mergedComms(): Promise<Communication[]> {
  const overlay = await readOverlayCommunications();
  const seen = new Set<string>(overlay.map((c) => c.id as unknown as string));
  const merged: Communication[] = [...overlay];
  for (const c of COMMUNICATIONS) {
    if (seen.has(c.id as unknown as string)) continue;
    merged.push(c);
  }
  return merged;
}

export const communicationRepository: CommunicationRepository = {
  async list(filter = {}) {
    const brandScope = filter.brands;
    const storeScope = filter.storeIds;
    const all = await mergedComms();
    return all.filter((c) => {
      if (brandScope && brandScope.length && !brandScope.includes(c.brand)) return false;
      if (storeScope && storeScope.length && !storeScope.includes(c.storeId)) return false;
      if (filter.channel && c.channel !== filter.channel) return false;
      return true;
    }).sort((a, b) => b.at.localeCompare(a.at));
  },

  async listByClient(clientId) {
    const all = await mergedComms();
    return all.filter((c) => c.clientId === clientId).sort((a, b) =>
      b.at.localeCompare(a.at),
    );
  },

  async create(input) {
    const id = generateId("co") as CommunicationId;
    const comm: Communication = { ...input, id };
    COMMUNICATIONS.unshift(comm);
    await appendOverlayCommunication(comm);
    return comm;
  },

  async deleteByClient(clientId) {
    let removed = 0;
    for (let i = COMMUNICATIONS.length - 1; i >= 0; i--) {
      if (COMMUNICATIONS[i]!.clientId === clientId) {
        COMMUNICATIONS.splice(i, 1);
        removed++;
      }
    }
    return removed;
  },
};
