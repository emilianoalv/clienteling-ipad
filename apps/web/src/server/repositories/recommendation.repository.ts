import "server-only";
import type { ClientId } from "@/types/client";
import type { Recommendation, RecommendationId } from "@/types/recommendation";
import { generateId } from "@/lib/id/generate-id";
import { SEED_RECOMMENDATIONS } from "./seed";
import { persistent } from "./_persist";

export interface RecommendationRepository {
  listByClient(clientId: ClientId): Promise<Recommendation[]>;
  findById(id: RecommendationId): Promise<Recommendation | null>;
  create(input: Omit<Recommendation, "id">): Promise<Recommendation>;
  patch(
    id: RecommendationId,
    patch: Partial<Omit<Recommendation, "id">>,
  ): Promise<Recommendation | null>;
}

const RECS: Recommendation[] = persistent("__clienteling.recommendations", () => [...SEED_RECOMMENDATIONS]);

export const recommendationRepository: RecommendationRepository = {
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
