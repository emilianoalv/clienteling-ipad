import type { Branded } from "./branded";
import type { ClientId } from "./client";
import type { Sku } from "./product";
import type { PurchaseId } from "./purchase";
import type { StaffId } from "./staff";

export type SampleId = Branded<string, "Sample">;

export interface Sample {
  id: SampleId;
  clientId: ClientId;
  baId: StaffId;
  sku: Sku;
  name: string;
  givenAt: string;
  followUpAt?: string;
  converted: boolean;
  purchaseId?: PurchaseId;
}
