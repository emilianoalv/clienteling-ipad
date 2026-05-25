import Link from "next/link";
import { Icon } from "@/components/primitives";
import { fetchClient } from "@/features/clients";
import { resolveTaskContext } from "@/features/communications/services/resolve-task-context";
import { Composer } from "@/features/followup/components/composer";
import { requireSession } from "@/server/auth/session";
import { brandScopeFor, homeStoreFor } from "@/server/auth/scope";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";
import { storeRepository } from "@/server/repositories/store.repository";
import { templateRepository } from "@/server/repositories/template.repository";
import type { FollowupTaskId } from "@/types/followup-task";

/**
 * Pantalla completa de composer. Reemplaza al modal que vivía en la tab
 * Mensajes del perfil — la BA pidió "una nueva pantalla, no una mini
 * pantalla flotante" para tener espacio y traer de vuelta el preview de
 * WhatsApp tipo teléfono.
 *
 * Se usa para:
 *  - "Nuevo mensaje" desde la tab Mensajes del perfil.
 *  - "Responder" desde el inbox de tareas (con ?taskId=…). Si la task
 *    es del BA y matchea el cliente, se preselecciona plantilla y se
 *    fija canal; al confirmar envío la task se marca como hecha.
 */
export default async function NewMessagePage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ taskId?: string }>;
}) {
  const { clientId } = await params;
  const { staff } = await requireSession();
  const sp = await searchParams;
  const brands = brandScopeFor(staff);
  const homeStore = homeStoreFor(staff);

  const [client, templates, store, task] = await Promise.all([
    fetchClient(clientId, staff),
    templateRepository.list({ brands }),
    homeStore ? storeRepository.findById(homeStore) : Promise.resolve(null),
    sp.taskId
      ? followupTaskRepository.findById(sp.taskId as FollowupTaskId)
      : Promise.resolve(null),
  ]);
  // Guard: la task debe pertenecer a este cliente y al BA actual.
  const initialTask =
    task && task.clientId === clientId && task.baId === staff.id ? task : null;
  // Resolvemos el contexto enriquecido solo si la task es válida — sin
  // task no hay categoría desde la cual inferir qué buscar.
  const taskContext = initialTask ? await resolveTaskContext(initialTask) : undefined;

  return (
    <section className="flex flex-col gap-4">
      <nav
        aria-label="Breadcrumb"
        className="inline-flex items-center gap-2 text-[14.5px] font-medium"
      >
        <Link
          href={`/ba/clients/${clientId}`}
          className="inline-flex items-center gap-1.5 text-ink hover:text-ink/80"
        >
          <Icon name="arrow-left" size={14} />
          Volver al perfil
        </Link>
      </nav>

      <header>
        <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          Nuevo mensaje
        </div>
        <h1 className="m-0 mt-1 font-display text-[32px] leading-tight tracking-[-0.01em]">
          Mensaje a {client.name.split(/\s+/)[0] ?? client.name}
        </h1>
        <p className="m-0 mt-1.5 text-[15px] text-ink/60 leading-snug">
          Elige una plantilla o escribe desde cero. Al darle &ldquo;Abrir en…&rdquo; tu iPad
          cambia a la app y vuelves aquí a confirmar el envío.
        </p>
      </header>

      <Composer
        client={client}
        templates={templates}
        staffName={staff.name}
        storeName={store?.name ?? "—"}
        layout="full"
        task={initialTask}
        taskContext={taskContext}
      />
    </section>
  );
}
