import { SegmentsScreen } from "@/features/admin";
import { listClients } from "@/features/clients";
import { requireSession } from "@/server/auth/session";

export default async function ManagerSegmentsPage() {
  const { staff } = await requireSession();
  // Manager segments are scoped to their store's clients via brand-lock.
  const clients = await listClients({ brands: staff.brands });
  return <SegmentsScreen clients={clients} />;
}
