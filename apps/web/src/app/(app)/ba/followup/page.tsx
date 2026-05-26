import { notFound } from "next/navigation";
import { listClients } from "@/features/clients";
import { TaskInbox } from "@/features/clients/components/task-inbox";
import { requireSession } from "@/server/auth/session";
import { assignedBaScopeFor, brandScopeFor, storeScopeFor } from "@/server/auth/scope";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";

/**
 * `/ba/followup` simplificado a una sola vista: el inbox global de tareas.
 *
 * Decisión de Commit CO4: la sub-tab "Comunicaciones" del inbox se eliminó.
 * La mensajería ahora vive 100% en el perfil del cliente (tab Mensajes) —
 * ya no se manda un mensaje sin contexto del cliente. El botón "Responder"
 * de cada task redirige al perfil correspondiente con la task pre-cargada.
 */
export default async function FollowupPage() {
  const { staff } = await requireSession();
  const storeIds = storeScopeFor(staff);
  const brands = brandScopeFor(staff);

  const clients = await listClients({
    brands,
    storeIds,
    assignedBaId: assignedBaScopeFor(staff),
  });
  if (clients.length === 0) notFound();

  const clientLookup = Object.fromEntries(clients.map((c) => [c.id, c.name])) as Record<
    string,
    string
  >;

  const tasks = await followupTaskRepository.listByBA(staff.id);

  return (
    <section className="flex flex-col gap-4">
      <TaskInbox tasks={tasks} clientLookup={clientLookup} />
    </section>
  );
}
