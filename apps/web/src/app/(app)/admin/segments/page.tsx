import { SegmentsScreen } from "@/features/admin";
import { listClients } from "@/features/clients";
import { requireSession } from "@/server/auth/session";
import { storeScopeFor } from "@/server/auth/scope";

export default async function AdminSegmentsPage() {
  const { staff } = await requireSession();
  // Admin returns undefined scope → no store filter (sees everything).
  const clients = await listClients({
    brands: staff.brands,
    storeIds: storeScopeFor(staff),
  });
  return <SegmentsScreen clients={clients} />;
}
