import { ClientProfile, fetchClientWithHistory } from "@/features/clients";
import { requireSession } from "@/server/auth/session";

/**
 * /supervisor/clients/[clientId] — Supervisor consulta el perfil
 * completo de un cliente de su zona en modo read-only, igual que el
 * Gerente. Se llega aquí desde drill-downs del dashboard (Top clients,
 * At-risk clients, BA → cliente) — por eso el back navega al
 * dashboard.
 */
export default async function SupervisorClientProfilePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { staff } = await requireSession();
  const data = await fetchClientWithHistory(clientId, staff);
  return (
    <ClientProfile
      {...data}
      readOnly
      basePath="/supervisor/clients"
      backHref="/supervisor"
      backLabel="Dashboard"
    />
  );
}
