import type { BrandId } from "./brand";
import type { Branded } from "./branded";
import type { ClientId } from "./client";
import type { Sku } from "./product";
import type { StaffId } from "./staff";
import type { StoreId } from "./store";

export type PurchaseId = Branded<string, "Purchase">;

export type PaymentMethod = "card" | "cash" | "transfer" | "store-credit";

export interface PurchaseItem {
  sku: Sku;
  qty: number;
  unitPrice: number;
}

export interface Purchase {
  id: PurchaseId;
  clientId: ClientId;
  baId: StaffId;
  storeId: StoreId;
  at: string;
  items: readonly PurchaseItem[];
  total: number;
  payment: PaymentMethod;
  /** Dominant brand of the items (set at create-time). */
  brand?: BrandId;
  ticketRef?: string;
  recommendationId?: string;
  /** True when the BA captured the sale via the manual flow (no POS handoff). */
  manual?: boolean;
}
