import "server-only";
import type { BrandId } from "@/types/brand";
import type { ClientId } from "@/types/client";
import type { Communication, CommunicationId } from "@/types/communication";
import type { StoreId } from "@/types/store";
import { generateId } from "@/lib/id/generate-id";
import { SEED_COMMUNICATIONS } from "./seed";
import { persistent } from "./_persist";

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
}

const COMMUNICATIONS: Communication[] = persistent("__clienteling.communications.v2", () => [...SEED_COMMUNICATIONS]);

export const communicationRepository: CommunicationRepository = {
  async list(filter = {}) {
    const brandScope = filter.brands;
    const storeScope = filter.storeIds;
    return COMMUNICATIONS.filter((c) => {
      if (brandScope && brandScope.length && !brandScope.includes(c.brand)) return false;
      if (storeScope && storeScope.length && !storeScope.includes(c.storeId)) return false;
      if (filter.channel && c.channel !== filter.channel) return false;
      return true;
    }).sort((a, b) => b.at.localeCompare(a.at));
  },

  async listByClient(clientId) {
    return COMMUNICATIONS.filter((c) => c.clientId === clientId).sort((a, b) =>
      b.at.localeCompare(a.at),
    );
  },

  async create(input) {
    const id = generateId("co") as CommunicationId;
    const comm: Communication = { ...input, id };
    COMMUNICATIONS.unshift(comm);
    return comm;
  },
};
