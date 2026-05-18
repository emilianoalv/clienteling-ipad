import "server-only";
import type { BrandId } from "@/types/brand";
import type { ClientId } from "@/types/client";
import type { Interaction, InteractionId } from "@/types/interaction";
import type { StoreId } from "@/types/store";
import { generateId } from "@/lib/id/generate-id";
import { SEED_INTERACTIONS } from "./seed";
import { persistent } from "./_persist";

export interface InteractionListFilter {
  /**
   * Brand scope of the requesting staff. Mirrors purchase/appointment repos.
   * Omit (or pass `undefined`) for nacional scope (Admin).
   */
  brands?: readonly BrandId[];
  /**
   * Store scope of the requesting staff. Use `visibleStoreIds(staff, allStoreIds)`
   * to compute. Omit (or pass `undefined`) for nacional scope (Admin).
   */
  storeIds?: readonly StoreId[];
  /** Inclusive lower bound on `at`. */
  from?: Date;
  /** Exclusive upper bound on `at` (use end-of-period). */
  to?: Date;
}

export interface InteractionRepository {
  list(filter?: InteractionListFilter): Promise<Interaction[]>;
  listByClient(clientId: ClientId): Promise<Interaction[]>;
  create(input: Omit<Interaction, "id">): Promise<Interaction>;
}

const INTERACTIONS: Interaction[] = persistent("__clienteling.interactions.v2", () => [
  ...SEED_INTERACTIONS,
]);

export const interactionRepository: InteractionRepository = {
  async list(filter = {}) {
    const brandScope = filter.brands;
    const storeScope = filter.storeIds;
    return INTERACTIONS.filter((i) => {
      if (brandScope && brandScope.length && !brandScope.includes(i.brand)) return false;
      if (storeScope && storeScope.length && !storeScope.includes(i.storeId)) return false;
      const at = new Date(i.at);
      if (filter.from && at < filter.from) return false;
      if (filter.to && at >= filter.to) return false;
      return true;
    }).sort((a, b) => b.at.localeCompare(a.at));
  },

  async listByClient(clientId) {
    return INTERACTIONS.filter((i) => i.clientId === clientId).sort((a, b) =>
      b.at.localeCompare(a.at),
    );
  },

  async create(input) {
    const id = generateId("int") as InteractionId;
    const interaction: Interaction = { ...input, id };
    INTERACTIONS.unshift(interaction);
    return interaction;
  },
};
