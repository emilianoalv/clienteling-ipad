import "server-only";
import type { BrandId } from "@/types/brand";
import type { ClientId } from "@/types/client";
import type { Purchase, PurchaseId } from "@/types/purchase";
import { generateId } from "@/lib/id/generate-id";
import { SEED_PURCHASES } from "./seed";
import { persistent } from "./_persist";

export interface PurchaseListFilter {
  /** Brand scope (intersection). Skips entries whose `brand` is set and not in the scope. */
  brands?: readonly BrandId[];
  /** Free-text matched against ticketRef / id. Client-name matching happens in the feature layer. */
  query?: string;
}

export interface PurchaseRepository {
  list(filter?: PurchaseListFilter): Promise<Purchase[]>;
  listByClient(clientId: ClientId): Promise<Purchase[]>;
  create(input: Omit<Purchase, "id">): Promise<Purchase>;
}

const PURCHASES: Purchase[] = persistent("__clienteling.purchases", () => [...SEED_PURCHASES]);

export const purchaseRepository: PurchaseRepository = {
  async list(filter = {}) {
    const scope = filter.brands;
    const query = filter.query?.trim().toLowerCase();
    return PURCHASES.filter((p) => {
      if (scope && scope.length && p.brand && !scope.includes(p.brand)) return false;
      if (!query) return true;
      return `${p.id} ${p.ticketRef ?? ""}`.toLowerCase().includes(query);
    }).sort((a, b) => b.at.localeCompare(a.at));
  },

  async listByClient(clientId) {
    return PURCHASES.filter((p) => p.clientId === clientId).sort((a, b) => b.at.localeCompare(a.at));
  },

  async create(input) {
    const id = generateId("pu") as PurchaseId;
    const purchase: Purchase = { ...input, id };
    PURCHASES.unshift(purchase);
    return purchase;
  },
};
