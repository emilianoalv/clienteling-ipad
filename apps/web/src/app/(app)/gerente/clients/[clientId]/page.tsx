import { ClientProfile, fetchClientWithHistory } from "@/features/clients";
import { requireSession } from "@/server/auth/session";

/**
 * /gerente/clients/[clientId] — Gerente ve el perfil completo de cualquier
 * cliente de su tienda. Reusa el mismo componente ClientProfile que la BA;
 * el fetchClientWithHistory ya valida el scope tienda+marca y el
 * isClientOwnedBy retorna true para roles distintos a BA (un Gerente ve
 * todos los clientes de su tienda sin importar a qué BA estén asignados).
 */
export default async function GerenteClientProfilePage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const { staff } = await requireSession();
  const data = await fetchClientWithHistory(clientId, staff);
  return <ClientProfile {...data} />;
}
