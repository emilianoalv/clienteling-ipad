import { SegmentsScreen } from "@/features/admin";
import { listClients } from "@/features/clients";
import { requireSession } from "@/server/auth/session";
import { storeScopeFor } from "@/server/auth/scope";

export default async function ManagerSegmentsPage() {
  const { staff } = await requireSession();
  // Manager sees only their own store's clients.
  const clients = await listClients({
    brands: staff.brands,
    storeIds: storeScopeFor(staff),
  });
  return <SegmentsScreen clients={clients} />;
}
