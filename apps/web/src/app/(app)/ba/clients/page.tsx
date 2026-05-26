import { ClientList, listClients } from "@/features/clients";
import { requireSession } from "@/server/auth/session";
import { assignedBaScopeFor, brandScopeFor, storeScopeFor } from "@/server/auth/scope";

export default async function ClientsPage() {
  const { staff } = await requireSession();
  const clients = await listClients({
    brands: brandScopeFor(staff),
    storeIds: storeScopeFor(staff),
    assignedBaId: assignedBaScopeFor(staff),
  });
  return <ClientList clients={clients} />;
}
