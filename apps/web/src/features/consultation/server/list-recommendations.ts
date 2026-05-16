import "server-only";
import type { ClientId } from "@/types/client";
import type { Recommendation } from "@/types/recommendation";
import type { StoreId } from "@/types/store";
import { recommendationRepository } from "@/server/repositories/recommendation.repository";

export interface ListRecommendationsArgs {
  /** Store scope. Pass `storeScopeFor(staff)`. Omit for HQ/Admin. */
  storeIds?: readonly StoreId[];
  /** If set, returns only this client's recommendations (no store filter applied — caller is expected to have already validated client-level scope). */
  clientId?: ClientId;
}

export async function listRecommendations(
  args: ListRecommendationsArgs = {},
): Promise<Recommendation[]> {
  if (args.clientId) return recommendationRepository.listByClient(args.clientId);
  return recommendationRepository.list({ storeIds: args.storeIds });
}
