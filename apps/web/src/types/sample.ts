import type { BrandId } from "./brand";
import type { Branded } from "./branded";
import type { ClientId } from "./client";
import type { Sku } from "./product";
import type { PurchaseId } from "./purchase";
import type { StaffId } from "./staff";
import type { StoreId } from "./store";

export type SampleId = Branded<string, "Sample">;

export interface Sample {
  id: SampleId;
  clientId: ClientId;
  baId: StaffId;
  storeId: StoreId;
  brand: BrandId;
  sku: Sku;
  name: string;
  givenAt: string;
  followUpAt?: string;
  converted: boolean;
  purchaseId?: PurchaseId;
}
