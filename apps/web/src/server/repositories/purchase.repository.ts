import "server-only";
import type { BrandId } from "@/types/brand";
import type { ClientId } from "@/types/client";
import type { Purchase, PurchaseId } from "@/types/purchase";
import type { StoreId } from "@/types/store";
import { generateId } from "@/lib/id/generate-id";
import { SEED_PURCHASES } from "./seed";
import { persistent } from "./_persist";

export interface PurchaseListFilter {
  /** Brand scope (intersection). Skips entries whose `brand` is set and not in the scope. */
  brands?: readonly BrandId[];
  /**
   * Store scope of the requesting staff. Use `visibleStoreIds(staff, allStoreIds)` to compute.
   * Omit to disable scoping (Admin/HQ).
   */
  storeIds?: readonly StoreId[];
  /** Free-text matched against ticketRef / id. Client-name matching happens in the feature layer. */
  query?: string;
}

export interface PurchaseRepository {
  list(filter?: PurchaseListFilter): Promise<Purchase[]>;
  listByClient(clientId: ClientId): Promise<Purchase[]>;
  findById(id: PurchaseId): Promise<Purchase | null>;
  create(input: Omit<Purchase, "id">): Promise<Purchase>;
}

const PURCHASES: Purchase[] = persistent("__clienteling.purchases.v2", () => [...SEED_PURCHASES]);

export const purchaseRepository: PurchaseRepository = {
  async list(filter = {}) {
    const brandScope = filter.brands;
    const storeScope = filter.storeIds;
    const query = filter.query?.trim().toLowerCase();
    return PURCHASES.filter((p) => {
      if (brandScope && brandScope.length && p.brand && !brandScope.includes(p.brand)) return false;
      if (storeScope && storeScope.length && !storeScope.includes(p.storeId)) return false;
      if (!query) return true;
      return `${p.id} ${p.ticketRef ?? ""}`.toLowerCase().includes(query);
    }).sort((a, b) => b.at.localeCompare(a.at));
  },

  async listByClient(clientId) {
    return PURCHASES.filter((p) => p.clientId === clientId).sort((a, b) => b.at.localeCompare(a.at));
  },

  async findById(id) {
    return PURCHASES.find((p) => p.id === id) ?? null;
  },

  async create(input) {
    const id = generateId("pu") as PurchaseId;
    const purchase: Purchase = { ...input, id };
    PURCHASES.unshift(purchase);
    return purchase;
  },
};
