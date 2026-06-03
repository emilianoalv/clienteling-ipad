import "server-only";
import type { BrandId } from "@/types/brand";
import type { ClientId } from "@/types/client";
import type { Purchase, PurchaseId } from "@/types/purchase";
import type { StoreId } from "@/types/store";
import { generateId } from "@/lib/id/generate-id";
import { SEED_PURCHASES } from "./seed";
import { MAY_2026_PURCHASES } from "./seed-may-2026";
import { DEEP_2026_PURCHASES } from "./seed-deep-2026";
import { persistent } from "./_persist";
import { appendOverlayPurchase, readOverlayPurchases } from "./_overlay";

export interface PurchaseListFilter {
  /** Brand scope (intersection). Skips entries whose `brand` is set and not in the scope. */
  brands?: readonly BrandId[];
  /**
   * Store scope of the requesting staff. Use `visibleStoreIds(staff, allStoreIds)` to compute.
   * Omit to disable scoping (Admin/HQ).
   */
  storeIds?: readonly StoreId[];
  /** Filter por BA específica (atribución). Útil para Mi KPI y /gerente/team. */
  baId?: import("@/types/staff").StaffId;
  /** Free-text matched against ticketRef / id. Client-name matching happens in the feature layer. */
  query?: string;
}

export interface PurchaseRepository {
  list(filter?: PurchaseListFilter): Promise<Purchase[]>;
  /**
   * Lista compras de un cliente. Si `brands` viene, filtra al brand-scope
   * del staff — necesario para que en perfiles multi-brand una BA YSL solo
   * vea sus compras YSL (y viceversa).
   */
  listByClient(
    clientId: ClientId,
    filter?: { brands?: readonly BrandId[] },
  ): Promise<Purchase[]>;
  findById(id: PurchaseId): Promise<Purchase | null>;
  create(input: Omit<Purchase, "id">): Promise<Purchase>;
  /** ARCO cascade — borra todas las compras de un cliente. */
  deleteByClient(clientId: ClientId): Promise<number>;
}

/**
 * Merge overlay-first (más recientes / autoritativos) con el seed in-memory,
 * deduped por id. Permite que las escrituras en serverless sobrevivan el
 * salto entre lambdas vía cookies.
 */
async function mergedPurchases(): Promise<Purchase[]> {
  const overlay = await readOverlayPurchases();
  const seen = new Set<string>(overlay.map((p) => p.id as unknown as string));
  const merged: Purchase[] = [...overlay];
  for (const p of PURCHASES) {
    if (seen.has(p.id as unknown as string)) continue;
    merged.push(p);
  }
  return merged;
}

const PURCHASES: Purchase[] = persistent("__clienteling.purchases.v7", () => [
  ...SEED_PURCHASES,
  ...MAY_2026_PURCHASES,
  ...DEEP_2026_PURCHASES,
]);

export const purchaseRepository: PurchaseRepository = {
  async list(filter = {}) {
    const brandScope = filter.brands;
    const storeScope = filter.storeIds;
    const baFilter = filter.baId;
    const query = filter.query?.trim().toLowerCase();
    const all = await mergedPurchases();
    return all.filter((p) => {
      if (brandScope && brandScope.length && p.brand && !brandScope.includes(p.brand)) return false;
      if (storeScope && storeScope.length && !storeScope.includes(p.storeId)) return false;
      if (baFilter && p.baId !== baFilter) return false;
      if (!query) return true;
      return `${p.id} ${p.ticketRef ?? ""}`.toLowerCase().includes(query);
    }).sort((a, b) => b.at.localeCompare(a.at));
  },

  async listByClient(clientId, filter = {}) {
    const brandScope = filter.brands;
    const all = await mergedPurchases();
    return all
      .filter((p) => {
        if (p.clientId !== clientId) return false;
        if (brandScope && brandScope.length && p.brand && !brandScope.includes(p.brand)) return false;
        return true;
      })
      .sort((a, b) => b.at.localeCompare(a.at));
  },

  async findById(id) {
    const all = await mergedPurchases();
    return all.find((p) => p.id === id) ?? null;
  },

  async create(input) {
    const id = generateId("pu") as PurchaseId;
    const purchase: Purchase = { ...input, id };
    PURCHASES.unshift(purchase);
    await appendOverlayPurchase(purchase);
    return purchase;
  },

  async deleteByClient(clientId) {
    let removed = 0;
    for (let i = PURCHASES.length - 1; i >= 0; i--) {
      if (PURCHASES[i]!.clientId === clientId) {
        PURCHASES.splice(i, 1);
        removed++;
      }
    }
    return removed;
  },
};
