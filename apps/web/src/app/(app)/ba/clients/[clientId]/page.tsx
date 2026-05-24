import { ClientProfile, fetchClientWithHistory } from "@/features/clients";
import { requireSession } from "@/server/auth/session";

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { staff } = await requireSession();
  const data = await fetchClientWithHistory(clientId, staff);
  return <ClientProfile {...data} />;
}
