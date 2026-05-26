import { ClientProfile, fetchClientWithHistory } from "@/features/clients";
import { requireSession } from "@/server/auth/session";

/**
 * /gerente/clients/[clientId] — Gerente ve el perfil completo de cualquier
 * cliente de su tienda. Reusa el mismo componente ClientProfile que la BA
 * pero en modo readOnly: el strip de acciones (Registrar visita / venta /
 * Nueva cita), el card ARCO y los botones de edición / envío / crear
 * tarea quedan ocultos. Es vista de consulta para coaching y reportes.
 */
export default async function GerenteClientProfilePage({
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
      basePath="/gerente/clients"
      backHref="/gerente/team"
      backLabel="Equipo"
    />
  );
}
