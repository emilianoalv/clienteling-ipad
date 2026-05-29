import Link from "next/link";
import { Icon } from "@/components/primitives";
import { fetchClient } from "@/features/clients";
import { type TemplateContext } from "@/features/communications";
import {
  resolveSampleContext,
  resolveTaskContext,
} from "@/features/communications/services/resolve-task-context";
import { Composer } from "@/features/followup/components/composer";
import { requireSession } from "@/server/auth/session";
import { brandScopeFor, homeStoreFor } from "@/server/auth/scope";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";
import { storeRepository } from "@/server/repositories/store.repository";
import { templateRepository } from "@/server/repositories/template.repository";
import type { ClientId } from "@/types/client";
import type { FollowupTaskId } from "@/types/followup-task";
import type { LifeEventKind } from "@/types/life-event";
import type { TemplateCategory } from "@/types/template";

/**
 * Pantalla completa de composer. Reemplaza al modal que vivía en la tab
 * Mensajes del perfil — la BA pidió "una nueva pantalla, no una mini
 * pantalla flotante" para tener espacio y traer de vuelta el preview de
 * WhatsApp tipo teléfono.
 *
 * Se usa para:
 *  - "Nuevo mensaje" desde la tab Mensajes del perfil — sin task ni
 *    intent, abre en modo blank.
 *  - "Responder" desde el inbox de tareas (?taskId=…). Pre-selecciona
 *    plantilla por categoría y al confirmar envío marca la task hecha.
 *  - "Felicitar" desde Eventos en /ba/home (?intent=birthday|anniversary).
 *    Pre-selecciona plantilla y, en aniversario, calcula los años
 *    cumplidos desde client.since para meterlos en el mensaje.
 */
const INTENT_TO_CATEGORY: Record<LifeEventKind, TemplateCategory> = {
  birthday: "Cumpleaños",
  anniversary: "Aniversario",
};

function isLifeEventKind(value: string | undefined): value is LifeEventKind {
  return value === "birthday" || value === "anniversary";
}

/** Años cumplidos desde `iso` hasta `now`. 0 si la fecha es inválida o futura. */
function yearsSince(iso: string | undefined, now: Date): number {
  if (!iso) return 0;
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) return 0;
  let years = now.getFullYear() - start.getFullYear();
  const beforeAnniv =
    now.getMonth() < start.getMonth() ||
    (now.getMonth() === start.getMonth() && now.getDate() < start.getDate());
  if (beforeAnniv) years -= 1;
  return Math.max(0, years);
}

export default async function NewMessagePage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ taskId?: string; intent?: string; sampleId?: string }>;
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
  // Task context (último purchase/sample con fecha relativa) — solo aplica
  // a tasks con categoría que necesita hidratación.
  const taskContextFromTask = initialTask ? await resolveTaskContext(initialTask) : undefined;

  // Intent de evento → categoría de plantilla + contexto extra (años
  // cumplidos para Aniversario). Solo se aplica si NO viene task.
  const intent = !initialTask && isLifeEventKind(sp.intent) ? sp.intent : null;

  // Intent de muestra → la BA hizo clic en "Seguir" desde la lista de
  // muestras del Home. Pre-selecciona la plantilla "Muestra" y resuelve
  // el contexto anclado al sampleId clickeado (no la heurística "última
  // muestra del cliente", que podría apuntar a otra distinta).
  const sampleIntent =
    !initialTask && !intent && sp.intent === "sample" && Boolean(sp.sampleId)
      ? sp.sampleId
      : null;
  const sampleContext: TemplateContext | undefined = sampleIntent
    ? await resolveSampleContext(clientId as ClientId, sampleIntent)
    : undefined;

  const initialCategory: TemplateCategory | undefined = intent
    ? INTENT_TO_CATEGORY[intent]
    : sampleIntent
      ? "Muestra"
      : undefined;
  const intentContext: TemplateContext | undefined = (() => {
    if (intent === "anniversary") {
      const years = yearsSince(client.since, new Date());
      return years > 0 ? { "evento.anos": String(years) } : {};
    }
    return undefined;
  })();

  const taskContext = taskContextFromTask ?? sampleContext ?? intentContext;

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
        initialCategory={initialCategory}
      />
    </section>
  );
}
