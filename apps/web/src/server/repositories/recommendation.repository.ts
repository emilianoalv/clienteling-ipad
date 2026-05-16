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
   * Brand scope of the requesting staff. Currently Recommendations don't carry
   * a brand directly — the field is reserved for future brand-tagged recs.
   * Omit to disable scoping (Admin/HQ).
   */
  brands?: readonly BrandId[];
  /**
   * Store scope of the requesting staff. Use `visibleStoreIds(staff, allStoreIds)`
   * to compute. Omit to disable scoping (Admin/HQ).
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
}

const RECS: Recommendation[] = persistent("__clienteling.recommendations.v2", () => [...SEED_RECOMMENDATIONS]);

export const recommendationRepository: RecommendationRepository = {
  async list(filter = {}) {
    const storeScope = filter.storeIds;
    return RECS.filter((r) => {
      if (storeScope && storeScope.length && !storeScope.includes(r.storeId)) return false;
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
};
