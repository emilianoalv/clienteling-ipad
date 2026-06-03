import "server-only";
import type { BrandId } from "@/types/brand";
import type { ClientId } from "@/types/client";
import type { Interaction, InteractionId } from "@/types/interaction";
import type { StoreId } from "@/types/store";
import { generateId } from "@/lib/id/generate-id";
import { SEED_INTERACTIONS } from "./seed";
import { persistent } from "./_persist";
import { appendOverlayInteraction, readOverlayInteractions } from "./_overlay";

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
  listByClient(
    clientId: ClientId,
    filter?: { brands?: readonly BrandId[] },
  ): Promise<Interaction[]>;
  create(input: Omit<Interaction, "id">): Promise<Interaction>;
  /** ARCO cascade — borra todas las interacciones de un cliente. */
  deleteByClient(clientId: ClientId): Promise<number>;
}

const INTERACTIONS: Interaction[] = persistent("__clienteling.interactions.v2", () => [
  ...SEED_INTERACTIONS,
]);

async function mergedInteractions(): Promise<Interaction[]> {
  const overlay = await readOverlayInteractions();
  const seen = new Set<string>(overlay.map((i) => i.id as unknown as string));
  const merged: Interaction[] = [...overlay];
  for (const i of INTERACTIONS) {
    if (seen.has(i.id as unknown as string)) continue;
    merged.push(i);
  }
  return merged;
}

export const interactionRepository: InteractionRepository = {
  async list(filter = {}) {
    const brandScope = filter.brands;
    const storeScope = filter.storeIds;
    const all = await mergedInteractions();
    return all.filter((i) => {
      if (brandScope && brandScope.length && !brandScope.includes(i.brand)) return false;
      if (storeScope && storeScope.length && !storeScope.includes(i.storeId)) return false;
      const at = new Date(i.at);
      if (filter.from && at < filter.from) return false;
      if (filter.to && at >= filter.to) return false;
      return true;
    }).sort((a, b) => b.at.localeCompare(a.at));
  },

  async listByClient(clientId, filter = {}) {
    const brandScope = filter.brands;
    const all = await mergedInteractions();
    return all
      .filter((i) => {
        if (i.clientId !== clientId) return false;
        if (brandScope && brandScope.length && !brandScope.includes(i.brand)) return false;
        return true;
      })
      .sort((a, b) => b.at.localeCompare(a.at));
  },

  async create(input) {
    const id = generateId("int") as InteractionId;
    const interaction: Interaction = { ...input, id };
    INTERACTIONS.unshift(interaction);
    await appendOverlayInteraction(interaction);
    return interaction;
  },

  async deleteByClient(clientId) {
    let removed = 0;
    for (let i = INTERACTIONS.length - 1; i >= 0; i--) {
      if (INTERACTIONS[i]!.clientId === clientId) {
        INTERACTIONS.splice(i, 1);
        removed++;
      }
    }
    return removed;
  },
};
