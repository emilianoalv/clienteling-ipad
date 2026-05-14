import "server-only";
import type { Store } from "@/types/store";
import { storeRepository } from "@/server/repositories/store.repository";

export async function listStores(): Promise<Store[]> {
  return storeRepository.list();
}
