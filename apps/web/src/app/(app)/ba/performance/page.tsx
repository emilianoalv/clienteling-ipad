import { BaDashboard } from "@/features/dashboards";
import { requireSession } from "@/server/auth/session";
import { storeRepository } from "@/server/repositories/store.repository";
import type { StoreId } from "@/types/store";

export default async function BaPerformancePage() {
  const { staff } = await requireSession();
  const storeId = "storeId" in staff ? (staff.storeId as StoreId) : null;
  const store = storeId ? await storeRepository.findById(storeId) : null;
  return <BaDashboard baName={staff.name} storeName={store?.name ?? "—"} />;
}
