import type { Branded } from "./branded";
import type { ClientId } from "./client";
import type { Sku } from "./product";
import type { PurchaseId } from "./purchase";
import type { StaffId } from "./staff";

export type RecommendationId = Branded<string, "Recommendation">;

export type RecommendationStatus = "pending" | "converted" | "dismissed";

export interface Recommendation {
  id: RecommendationId;
  clientId: ClientId;
  baId: StaffId;
  at: string;
  items: readonly Sku[];
  status: RecommendationStatus;
  purchaseId?: PurchaseId;
}
