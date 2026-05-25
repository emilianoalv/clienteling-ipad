import "server-only";
import type { ClientId } from "@/types/client";
import type { FollowupTask } from "@/types/followup-task";
import type { Product, Sku } from "@/types/product";
import type { Purchase } from "@/types/purchase";
import type { Sample } from "@/types/sample";
import { formatConversationalDate } from "@/lib/format/conversational-date";
import { formatDateShort } from "@/lib/format/date";
import { sampleRepository } from "@/server/repositories/sample.repository";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { productRepository } from "@/server/repositories/product.repository";
import { formatBulletList, formatNameList, type TemplateContext } from "./render-template";

/**
 * Dependencias inyectables para testing. En producción cada función
 * default golpea su repository real. El test pasa stubs in-memory.
 */
export interface ResolveTaskContextDeps {
  listSamplesByClient: (clientId: ClientId) => Promise<readonly Sample[]>;
  listPurchasesByClient: (clientId: ClientId) => Promise<readonly Purchase[]>;
  findProductBySku: (sku: Sku) => Promise<Product | null>;
}

const DEFAULT_DEPS: ResolveTaskContextDeps = {
  listSamplesByClient: (id) => sampleRepository.listByClient(id),
  listPurchasesByClient: (id) => purchaseRepository.listByClient(id),
  findProductBySku: (sku) => productRepository.findBySku(sku),
};

/**
 * Resuelve el contexto enriquecido para una tarea de seguimiento.
 *
 * Cada `FollowupCategory` define qué evento del historial es relevante
 * (la última muestra, la última compra, etc.) y este servicio busca ese
 * evento, lo materializa con datos derivados (nombre real del producto,
 * fecha en tono conversacional) y devuelve las keys que matchean los
 * tokens dot-notation de `renderTemplate`.
 *
 * Decisiones:
 *  - Heurística "última X del cliente" (Sample / Purchase) en vez de
 *    referencia explícita: la FollowupTask no guarda sampleId/purchaseId
 *    hoy, y la última suele ser la correcta porque la BA crea la task
 *    justo después de la interacción.
 *  - Si la categoría no necesita contexto (birthday, general, special-event)
 *    devuelve {} — el caller combina con nombre/tienda/ba aparte.
 *  - Si la categoría sí necesita contexto pero no hay datos (cliente
 *    nuevo, sin compras todavía), también devuelve {} y la plantilla
 *    cae al fallback literal del token. Opción A acordada con el cliente.
 *
 * `now` y `deps` son inyectables para testing.
 */
export async function resolveTaskContext(
  task: FollowupTask,
  now: Date = new Date(),
  deps: ResolveTaskContextDeps = DEFAULT_DEPS,
): Promise<TemplateContext> {
  switch (task.category) {
    case "sample-feedback":
      return resolveLastSample(task.clientId, now, deps);

    case "post-purchase":
    case "3-month-check":
    case "6-month-check":
    case "replenishment":
      return resolveLastPurchase(task.clientId, now, deps);

    case "birthday":
    case "special-event":
    case "general":
      return {};
  }
}

async function resolveLastSample(
  clientId: ClientId,
  now: Date,
  deps: ResolveTaskContextDeps,
): Promise<TemplateContext> {
  const samples = await deps.listSamplesByClient(clientId);
  const last = samples[0];
  if (!last) return {};

  // Agrupar las muestras de la "misma sesión": las que comparten día con
  // la última. Una visita típica entrega 2-3 muestras a la vez y la BA
  // necesita mencionarlas todas en el mensaje. Día = los primeros 10
  // chars del ISO (YYYY-MM-DD) — local a la zona horaria del servidor,
  // suficiente para demo y para producción con tiendas en una sola TZ.
  const lastDay = last.givenAt.slice(0, 10);
  const sameDay = samples.filter((s) => s.givenAt.slice(0, 10) === lastDay);
  const names = sameDay.map((s) => s.name);

  return {
    "muestra.producto": last.name,
    "muestra.productos": formatNameList(names),
    "muestra.productos.lista": formatBulletList(names),
    "muestra.dia": formatConversationalDate(last.givenAt, now),
  };
}

async function resolveLastPurchase(
  clientId: ClientId,
  now: Date,
  deps: ResolveTaskContextDeps,
): Promise<TemplateContext> {
  const purchases = await deps.listPurchasesByClient(clientId);
  const last = purchases[0];
  if (!last) return {};

  // Resolver TODOS los items de la última compra. La BA quería evitar
  // tener que reescribir el mensaje cuando el cliente se lleva varios
  // productos: ahora `{compra.productos}` los lista en frase natural
  // ("X y Y", "X, Y y Z") y `{compra.productos.lista}` los pone con
  // bullets verticales para Email. `{compra.producto}` se mantiene
  // (siempre el primero) para que las plantillas que aún lo usan
  // sigan funcionando.
  const names: string[] = [];
  for (const item of last.items) {
    const p = await deps.findProductBySku(item.sku);
    if (p) names.push(p.name);
  }

  const ctx: TemplateContext = {
    "compra.dia": formatConversationalDate(last.at, now),
    "compra.fecha": formatDateShort(new Date(last.at)),
  };
  if (names.length > 0) {
    ctx["compra.producto"] = names[0];
    ctx["compra.productos"] = formatNameList(names);
    ctx["compra.productos.lista"] = formatBulletList(names);
  }
  return ctx;
}
