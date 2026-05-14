import { BaTodayScreen, getBaDaySnapshot } from "@/features/home";
import { requireSession } from "@/server/auth/session";
import { storeRepository } from "@/server/repositories/store.repository";
import type { StoreId } from "@/types/store";

export default async function BaHome() {
  const { staff } = await requireSession();
  const storeId = "storeId" in staff ? (staff.storeId as StoreId) : null;
  const [store, snapshot] = await Promise.all([
    storeId ? storeRepository.findById(storeId) : Promise.resolve(null),
    getBaDaySnapshot(staff),
  ]);
  return (
    <BaTodayScreen
      baName={staff.name}
      storeName={store?.name ?? "—"}
      snapshot={snapshot}
    />
  );
}
