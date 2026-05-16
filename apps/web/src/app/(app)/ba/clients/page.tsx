import { ClientList, listClients } from "@/features/clients";
import { requireSession } from "@/server/auth/session";
import { storeScopeFor } from "@/server/auth/scope";

export default async function ClientsPage() {
  const { staff } = await requireSession();
  const clients = await listClients({
    brands: staff.brands,
    storeIds: storeScopeFor(staff),
  });
  return <ClientList clients={clients} />;
}
