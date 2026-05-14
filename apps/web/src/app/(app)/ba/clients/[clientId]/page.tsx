import { ClientProfile, fetchClientWithHistory } from "@/features/clients";

export default async function ClientProfilePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const data = await fetchClientWithHistory(clientId);
  return <ClientProfile {...data} />;
}
