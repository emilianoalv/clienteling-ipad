import "server-only";
import type { BrandId } from "@/types/brand";
import type { Purchase } from "@/types/purchase";
import { purchaseRepository } from "@/server/repositories/purchase.repository";

export interface ListPurchasesArgs {
  brands?: readonly BrandId[];
  query?: string;
}

export async function listPurchases(args: ListPurchasesArgs = {}): Promise<Purchase[]> {
  return purchaseRepository.list(args);
}
