import { SegmentsScreen } from "@/features/admin";
import { listClients } from "@/features/clients";
import { requireSession } from "@/server/auth/session";

export default async function AdminSegmentsPage() {
  await requireSession();
  const clients = await listClients();
  return <SegmentsScreen clients={clients} />;
}
