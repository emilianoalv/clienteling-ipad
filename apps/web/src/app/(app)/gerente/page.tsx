import { ManagerDashboard } from "@/features/dashboards";
import { requireSession } from "@/server/auth/session";
import { homeStoreFor } from "@/server/auth/scope";
import { storeRepository } from "@/server/repositories/store.repository";

export default async function GerenteHome() {
  const { staff } = await requireSession();
  const storeId = homeStoreFor(staff);
  const store = storeId ? await storeRepository.findById(storeId) : null;
  return <ManagerDashboard storeName={store?.name ?? "—"} />;
}
