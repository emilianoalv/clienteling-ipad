import { SegmentsScreen } from "@/features/admin";
import { listClients } from "@/features/clients";
import { requireSession } from "@/server/auth/session";
import { brandScopeFor, storeScopeFor } from "@/server/auth/scope";

export default async function GerenteSegmentsPage() {
  const { staff } = await requireSession();
  // Gerente sees only their own store's clients (all brands of that store).
  const clients = await listClients({
    brands: brandScopeFor(staff),
    storeIds: storeScopeFor(staff),
  });
  return <SegmentsScreen clients={clients} />;
}
