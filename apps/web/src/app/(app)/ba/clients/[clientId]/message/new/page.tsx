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
import type { FollowupCategory, FollowupTaskId } from "@/types/followup-task";
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
 *  - "Felicitar" desde Eventos en /ba (?intent=birthday|anniversary).
 *    Pre-selecciona plantilla y, en aniversario, calcula los años
 *    cumplidos desde client.since para meterlos en el mensaje.
 */
const INTENT_TO_CATEGORY: Record<LifeEventKind, TemplateCategory> = {
  birthday: "Cumpleaños",
  anniversary: "Aniversario",
};

/**
 * Mapping de FollowupCategory de la tarea → TemplateCategory para
 * pre-seleccionar la plantilla correcta cuando la BA hace click en
 * "Responder" desde el inbox. Pasarlo explícito desde la page lo
 * hace determinista (antes el composer caía a la primera plantilla
 * cualquiera).
 *
 * Decisiones clave:
 * - "post-purchase" → "Seguimiento" (no "Post-visita"). Post-visita es
 *   un saludo del MISMO día ("fue un placer atenderte hoy"); para
 *   pedir feedback días después la plantilla correcta es Seguimiento
 *   que usa {compra.productos} y {compra.dia}.
 * - "3-month-check" también va a Seguimiento — semánticamente es lo
 *   mismo (checar cómo le va con el producto), solo difiere en tiempo.
 * - "6-month-check" y "replenishment" → Reposición (asume "ya casi se
 *   acaba" y ofrece reservar).
 */
const TASK_CATEGORY_TO_TEMPLATE: Partial<Record<FollowupCategory, TemplateCategory>> = {
  birthday: "Cumpleaños",
  "sample-feedback": "Muestra",
  "post-purchase": "Seguimiento",
  "3-month-check": "Seguimiento",
  "6-month-check": "Reposición",
  replenishment: "Reposición",
  // "special-event" intencionalmente sin mapeo: en seed se usa para
  // varios casos (lanzamiento, info producto). El composer cae al
  // mapping interno (Promoción) que es el matching por defecto.
};

/**
 * Heurística por descripción — toma prioridad sobre el mapping de
 * categoría. Cubre dos casos:
 *
 * 1. Tareas mal-etiquetadas (special-event/general) que claramente son
 *    saludos de evento (cumpleaños / aniversario).
 * 2. Tareas con categoría genérica donde la intención específica está
 *    en la descripción ("pedir feedback de muestra" → Muestra aunque
 *    la categoría sea general).
 *
 * Lo importante es que la BA reciba el body que mejor encaja con LO
 * QUE DICE LA TAREA, no con la categoría técnica.
 */
function categoryFromTaskDescription(description: string): TemplateCategory | undefined {
  const d = description.toLowerCase();

  // Eventos personales — máxima prioridad porque tienen mensajes muy
  // específicos (felicitación) que no se confunden con otros casos.
  if (
    d.includes("aniversario") ||
    d.includes("años contigo") ||
    d.includes("años como cliente")
  ) {
    return "Aniversario";
  }
  if (d.includes("cumpleaños") || d.includes("cumple ")) {
    return "Cumpleaños";
  }

  // Muestra: la descripción menciona el ciclo de sampling.
  if (d.includes("muestra") || d.includes("sample") || d.includes("mini ")) {
    return "Muestra";
  }

  // Reposición: explícitamente sugiere "ya casi se acaba" o "comprar más".
  if (
    d.includes("reposici") ||
    d.includes("rellenar") ||
    d.includes("se acaba") ||
    d.includes("acabar") ||
    d.includes("reservar uno nuevo")
  ) {
    return "Reposición";
  }

  // Promoción / lanzamiento.
  if (d.includes("promoci") || d.includes("promo ")) {
    return "Promoción";
  }
  if (d.includes("lanzamiento") || d.includes("nueva línea") || d.includes("nuevo producto")) {
    return "Lanzamiento";
  }

  // Feedback / seguimiento post-compra — la categoría más amplia para
  // "checar cómo le va con lo que se llevó". Cubre "pedir feedback de
  // primera compra", "ver cómo le fue", "follow up", etc.
  if (
    d.includes("feedback") ||
    d.includes("cómo le fue") ||
    d.includes("cómo te fue") ||
    d.includes("cómo le ha ido") ||
    d.includes("cómo te ha ido") ||
    d.includes("follow up") ||
    d.includes("check-in") ||
    d.includes("checar") ||
    d.includes("ver cómo va") ||
    d.includes("primera compra")
  ) {
    return "Seguimiento";
  }

  return undefined;
}

function isLifeEventKind(value: string | undefined): value is LifeEventKind {
  return value === "birthday" || value === "anniversary";
}

/**
 * Devuelve la TemplateCategory más adecuada para una tarea.
 *
 * Para categorías altamente específicas (sample-feedback, birthday,
 * replenishment, 3/6-month-check) la categoría manda directo — la
 * descripción no se inspecciona. Razón: una tarea "Pedir feedback de
 * Hydra Zen a Constanza" (category sample-feedback) tiene "feedback"
 * en el texto, lo cual antes la mapeaba a Seguimiento. Pero la
 * tarea es claramente de muestra, así que debe ir a Muestra.
 *
 * Para categorías genéricas (post-purchase, special-event, general)
 * la descripción tiene prioridad porque la categoría es muy amplia
 * y la intención real (cumpleaños, aniversario, promo, etc.) suele
 * estar escrita en el texto.
 */
function categoryForTask(task: { category: FollowupCategory; description: string }):
  | TemplateCategory
  | undefined {
  switch (task.category) {
    case "sample-feedback":
      return "Muestra";
    case "birthday":
      return "Cumpleaños";
    case "replenishment":
    case "6-month-check":
      return "Reposición";
    case "3-month-check":
      return "Seguimiento";
    case "post-purchase":
    case "special-event":
    case "general":
      return (
        categoryFromTaskDescription(task.description) ??
        TASK_CATEGORY_TO_TEMPLATE[task.category]
      );
  }
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

  // Orden de prioridad para pre-seleccionar plantilla:
  //   1. Intent de evento (cumple / aniversario)
  //   2. Intent de muestra (sample)
  //   3. Task: si la categoría es ALTAMENTE ESPECÍFICA (sample-feedback,
  //      birthday, replenishment, 3/6-month-check) usamos la categoría
  //      directo — no la descripción. Antes la heurística por descripción
  //      tenía prioridad, lo cual causaba que una tarea sample-feedback
  //      con descripción "Pedir FEEDBACK de X" se mapeara a Seguimiento
  //      (porque "feedback") en vez de Muestra. La descripción solo
  //      manda para categorías genéricas donde la intención está oculta.
  const initialCategory: TemplateCategory | undefined = (() => {
    if (intent) return INTENT_TO_CATEGORY[intent];
    if (sampleIntent) return "Muestra";
    if (initialTask) return categoryForTask(initialTask);
    return undefined;
  })();
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
