import "server-only";
import type { BrandId } from "@/types/brand";
import { sampleRepository, type SampleInventoryItem } from "@/server/repositories/sample.repository";

export async function listSampleInventory(args: { brands?: readonly BrandId[] } = {}): Promise<
  SampleInventoryItem[]
> {
  return sampleRepository.listInventory(args);
}
