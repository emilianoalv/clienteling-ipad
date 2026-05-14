import { ClientList, listClients } from "@/features/clients";
import { requireSession } from "@/server/auth/session";

export default async function ClientsPage() {
  const { staff } = await requireSession();
  const clients = await listClients({ brands: staff.brands });
  return <ClientList clients={clients} />;
}
