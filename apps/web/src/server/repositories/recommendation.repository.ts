import "server-only";
import type { BrandId } from "@/types/brand";
import type { ClientId } from "@/types/client";
import type { Recommendation, RecommendationId } from "@/types/recommendation";
import type { StoreId } from "@/types/store";
import { generateId } from "@/lib/id/generate-id";
import { SEED_RECOMMENDATIONS } from "./seed";
import { MAY_2026_RECOMMENDATIONS } from "./seed-may-2026";
import { DEEP_2026_RECOMMENDATIONS } from "./seed-deep-2026";
import { persistent } from "./_persist";
import {
  appendOverlayRecommendation,
  readOverlayRecommendations,
  upsertOverlayRecommendation,
} from "./_overlay";

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
  listByClient(
    clientId: ClientId,
    filter?: { brands?: readonly BrandId[] },
  ): Promise<Recommendation[]>;
  findById(id: RecommendationId): Promise<Recommendation | null>;
  create(input: Omit<Recommendation, "id">): Promise<Recommendation>;
  patch(
    id: RecommendationId,
    patch: Partial<Omit<Recommendation, "id">>,
  ): Promise<Recommendation | null>;
  /** ARCO cascade — borra todas las recomendaciones de un cliente. */
  deleteByClient(clientId: ClientId): Promise<number>;
}

const RECS: Recommendation[] = persistent("__clienteling.recommendations.v7", () => [
  ...SEED_RECOMMENDATIONS,
  ...MAY_2026_RECOMMENDATIONS,
  ...DEEP_2026_RECOMMENDATIONS,
]);

/** Overlay primero (cookies) + seed in-memory, deduped por id. */
async function mergedRecs(): Promise<Recommendation[]> {
  const overlay = await readOverlayRecommendations();
  const seen = new Set<string>(overlay.map((r) => r.id as unknown as string));
  const merged: Recommendation[] = [...overlay];
  for (const r of RECS) {
    if (seen.has(r.id as unknown as string)) continue;
    merged.push(r);
  }
  return merged;
}

export const recommendationRepository: RecommendationRepository = {
  async list(filter = {}) {
    const storeScope = filter.storeIds;
    const brandScope = filter.brands;
    const all = await mergedRecs();
    return all.filter((r) => {
      if (storeScope && storeScope.length && !storeScope.includes(r.storeId)) return false;
      if (brandScope && brandScope.length && !brandScope.includes(r.brand)) return false;
      return true;
    }).sort((a, b) => b.at.localeCompare(a.at));
  },

  async listByClient(clientId, filter = {}) {
    const brandScope = filter.brands;
    const all = await mergedRecs();
    return all
      .filter((r) => {
        if (r.clientId !== clientId) return false;
        if (brandScope && brandScope.length && !brandScope.includes(r.brand)) return false;
        return true;
      })
      .sort((a, b) => b.at.localeCompare(a.at));
  },

  async findById(id) {
    const all = await mergedRecs();
    return all.find((r) => r.id === id) ?? null;
  },

  async create(input) {
    const id = generateId("rc") as RecommendationId;
    const rec: Recommendation = { ...input, id };
    RECS.unshift(rec);
    await appendOverlayRecommendation(rec);
    return rec;
  },

  async patch(id, patch) {
    const idx = RECS.findIndex((r) => r.id === id);
    let next: Recommendation | null = null;
    if (idx >= 0) {
      const current = RECS[idx]!;
      next = { ...current, ...patch };
      RECS[idx] = next;
    } else {
      // Puede que el item viva solo en overlay (creado por la misma BA en
      // un lambda anterior). Buscamos ahí y, si está, lo persistimos
      // actualizado de vuelta al overlay para que la mutación viaje.
      const overlay = await readOverlayRecommendations();
      const found = overlay.find((r) => r.id === id);
      if (!found) return null;
      next = { ...found, ...patch };
    }
    await upsertOverlayRecommendation(next);
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
