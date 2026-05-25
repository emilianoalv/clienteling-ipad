import "server-only";
import type { BrandId } from "@/types/brand";
import type { ClientId } from "@/types/client";
import type { Recommendation, RecommendationId } from "@/types/recommendation";
import type { StoreId } from "@/types/store";
import { generateId } from "@/lib/id/generate-id";
import { SEED_RECOMMENDATIONS } from "./seed";
import { persistent } from "./_persist";

export interface RecommendationListFilter {
  /**
   * Brand scope of the requesting staff. A recommendation is visible if its
   * `brand` is in this set. Omit (Admin) to disable.
   */
  brands?: readonly BrandId[];
  /**
   * Store scope of the requesting staff. Use `visibleStoreIds(staff, allStoreIds)`
   * to compute. Omit to disable scoping (Admin).
   */
  storeIds?: readonly StoreId[];
}

export interface RecommendationRepository {
  list(filter?: RecommendationListFilter): Promise<Recommendation[]>;
  listByClient(clientId: ClientId): Promise<Recommendation[]>;
  findById(id: RecommendationId): Promise<Recommendation | null>;
  create(input: Omit<Recommendation, "id">): Promise<Recommendation>;
  patch(
    id: RecommendationId,
    patch: Partial<Omit<Recommendation, "id">>,
  ): Promise<Recommendation | null>;
  /** ARCO cascade — borra todas las recomendaciones de un cliente. */
  deleteByClient(clientId: ClientId): Promise<number>;
}

const RECS: Recommendation[] = persistent("__clienteling.recommendations.v3", () => [...SEED_RECOMMENDATIONS]);

export const recommendationRepository: RecommendationRepository = {
  async list(filter = {}) {
    const storeScope = filter.storeIds;
    const brandScope = filter.brands;
    return RECS.filter((r) => {
      if (storeScope && storeScope.length && !storeScope.includes(r.storeId)) return false;
      if (brandScope && brandScope.length && !brandScope.includes(r.brand)) return false;
      return true;
    }).sort((a, b) => b.at.localeCompare(a.at));
  },

  async listByClient(clientId) {
    return RECS.filter((r) => r.clientId === clientId).sort((a, b) => b.at.localeCompare(a.at));
  },

  async findById(id) {
    return RECS.find((r) => r.id === id) ?? null;
  },

  async create(input) {
    const id = generateId("rc") as RecommendationId;
    const rec: Recommendation = { ...input, id };
    RECS.unshift(rec);
    return rec;
  },

  async patch(id, patch) {
    const idx = RECS.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    const current = RECS[idx]!;
    const next: Recommendation = { ...current, ...patch };
    RECS[idx] = next;
    return next;
  },

  async deleteByClient(clientId) {
    let removed = 0;
    for (let i = RECS.length - 1; i >= 0; i--) {
      if (RECS[i]!.clientId === clientId) {
        RECS.splice(i, 1);
        removed++;
      }
    }
    return removed;
  },
};
