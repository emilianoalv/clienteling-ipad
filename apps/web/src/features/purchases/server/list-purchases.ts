import "server-only";
import type { BrandId } from "@/types/brand";
import type { Purchase } from "@/types/purchase";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import { purchaseRepository } from "@/server/repositories/purchase.repository";

export interface ListPurchasesArgs {
  brands?: readonly BrandId[];
  /** Store scope. Pass `storeScopeFor(staff)`. Omit for HQ/Admin. */
  storeIds?: readonly StoreId[];
  /** Atribución por BA — filtra a las compras registradas por este staff. */
  baId?: StaffId;
  query?: string;
}

export async function listPurchases(args: ListPurchasesArgs = {}): Promise<Purchase[]> {
  return purchaseRepository.list(args);
}
