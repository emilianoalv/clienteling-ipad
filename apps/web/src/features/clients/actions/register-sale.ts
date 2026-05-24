"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { homeStoreFor, isStoreInScope } from "@/server/auth/scope";
import { can } from "@/config/rbac";
import { clientRepository } from "@/server/repositories/client.repository";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { interactionRepository } from "@/server/repositories/interaction.repository";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";
import { sampleRepository } from "@/server/repositories/sample.repository";
import { productRepository } from "@/server/repositories/product.repository";
import { recommendationRepository } from "@/server/repositories/recommendation.repository";
import { applyPurchaseToStats } from "../services/update-client-stats";
import { registerSaleSchema, type RegisterSaleInput } from "../schemas/register-sale.schema";
import type { ClientId } from "@/types/client";
import type { Sku } from "@/types/product";

const DEFAULT_BRAND = "Lancôme" as const;

export interface RegisterSaleError {
  ok: false;
  fieldErrors?: Record<string, string[]>;
  message?: string;
}

export async function registerSale(raw: RegisterSaleInput): Promise<RegisterSaleError | void> {
  const { staff } = await requireSession();
  if (!can(staff.role, "purchases:write")) return { ok: false, message: "Sin permiso" };

  const storeId = homeStoreFor(staff);
  if (!storeId) return { ok: false, message: "Tu rol no tiene tienda asignada para registrar ventas." };

  const parsed = registerSaleSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const input = parsed.data;
  const clientId = input.clientId as ClientId;
  const client = await clientRepository.findById(clientId);
  // Out-of-scope returns the same error as not-found (no existence leak).
  if (!client || !isStoreInScope(staff, client.storeId)) {
    return { ok: false, message: "Cliente no encontrado" };
  }

  const total = input.items.reduce((acc, i) => acc + i.qty * i.unitPrice, 0);
  const at = new Date(`${input.purchaseDate}T${input.purchaseTime}:00`).toISOString();

  const purchase = await purchaseRepository.create({
    clientId,
    baId: staff.id,
    storeId,
    at,
    items: input.items.map((i) => ({ sku: i.sku as Sku, qty: i.qty, unitPrice: i.unitPrice })),
    total,
    payment: input.payment,
    manual: true,
    ...(input.ticketRef !== undefined && { ticketRef: input.ticketRef }),
    ...(input.paymentDetail !== undefined && { paymentDetail: input.paymentDetail }),
  });

  const interaction = await interactionRepository.create({
    clientId,
    baId: staff.id,
    brand: DEFAULT_BRAND,
    storeId,
    kind: "purchase",
    at,
    amount: total,
    motive: input.motive,
    ...(input.notes !== undefined && { notes: input.notes }),
  });

  if (input.followup) {
    // Followup manual desde el form de venta: por default es post-venta
    // (cierre cordial). Si la BA quiere otra categoría podrá elegirla
    // explícitamente en Commit 2 cuando exponga el picker.
    await followupTaskRepository.create({
      clientId,
      baId: staff.id,
      type: input.followup.type,
      category: "post-purchase",
      description: input.followup.description,
      dueAt: new Date(`${input.followup.dueAt}T12:00:00`).toISOString(),
      sourceInteractionId: interaction.id,
    });
  }

  // Auto-conversión sample → venta:
  // Por cada item del ticket buscamos su sampleSku (la mini que representa
  // a ese full-size, ej. LC-HZN-50 → LC-HZN-7). Si la clienta tiene una
  // muestra pendiente con ese sampleSku, la marcamos converted con la
  // purchaseId. Para evitar inflar tasas, solo cerramos la muestra MÁS
  // RECIENTE no convertida por SKU — el resto se mantienen pendientes.
  const clientSamples = await sampleRepository.listByClient(clientId);
  const pendingBySampleSku = new Map<string, typeof clientSamples[number]>();
  for (const s of clientSamples) {
    if (s.converted) continue;
    const key = s.sku as unknown as string;
    // listByClient devuelve sorted desc por givenAt — el primero que veamos
    // es el más reciente, lo guardamos y no lo sobreescribimos.
    if (!pendingBySampleSku.has(key)) pendingBySampleSku.set(key, s);
  }
  for (const item of input.items) {
    const product = await productRepository.findBySku(item.sku as Sku);
    if (!product?.sampleSku) continue;
    const sampleKey = product.sampleSku as unknown as string;
    const sample = pendingBySampleSku.get(sampleKey);
    if (!sample) continue;
    await sampleRepository.markConverted(sample.id, purchase.id);
    // No volvamos a cerrar la misma sample si el ticket tiene dos líneas
    // del mismo producto.
    pendingBySampleSku.delete(sampleKey);
  }

  // Auto-conversión recommendation → venta:
  // Si la BA recomendó productos previamente y la clienta compra alguno de
  // ellos, marcamos esa Recommendation como "converted" enlazándola al
  // purchase. Soporta el caso de bundles: una sola recomendación con N
  // SKUs se cierra al comprar AL MENOS UNO de los recomendados. Solo
  // procesamos las pending (no las dismissed por la BA).
  const purchasedSkus = new Set(input.items.map((i) => i.sku as unknown as string));
  const clientRecs = await recommendationRepository.listByClient(clientId);
  const closedRecs = new Set<string>();
  for (const rec of clientRecs) {
    if (rec.status !== "pending") continue;
    if (closedRecs.has(rec.id)) continue;
    const matches = rec.items.some((sku) => purchasedSkus.has(sku as unknown as string));
    if (!matches) continue;
    await recommendationRepository.patch(rec.id, {
      status: "converted",
      purchaseId: purchase.id,
    });
    closedRecs.add(rec.id);
  }

  // Auto-tasks de retención: toda compra genera 2 follow-ups futuros con
  // la categoría que corresponde a cada hito.
  //   · 3 meses → check-in temprano ("¿cómo te está yendo?")
  //   · 6 meses → reposición estimada ("¿necesitas un nuevo frasco?")
  // La BA puede borrar o adelantar cualquiera desde el inbox. Resolvemos
  // el nombre del primer producto del ticket para que la descripción se
  // sienta natural; si el SKU no está en catálogo, fallback al SKU.
  const firstItem = input.items[0];
  if (firstItem) {
    const firstProduct = await productRepository.findBySku(firstItem.sku as Sku);
    const productName = firstProduct?.line ?? firstItem.sku;
    const firstName = client.name.split(/\s+/)[0] ?? client.name;
    const purchaseDate = new Date(at);

    const threeMonthsAt = new Date(purchaseDate);
    threeMonthsAt.setMonth(threeMonthsAt.getMonth() + 3);
    await followupTaskRepository.create({
      clientId,
      baId: staff.id,
      type: "whatsapp",
      category: "3-month-check",
      description: `Check-in con ${firstName}: ¿cómo le está yendo con ${productName}?`,
      dueAt: threeMonthsAt.toISOString(),
      sourceInteractionId: interaction.id,
    });

    const sixMonthsAt = new Date(purchaseDate);
    sixMonthsAt.setMonth(sixMonthsAt.getMonth() + 6);
    await followupTaskRepository.create({
      clientId,
      baId: staff.id,
      type: "whatsapp",
      category: "replenishment",
      description: `Reposición estimada de ${productName} para ${firstName}`,
      dueAt: sixMonthsAt.toISOString(),
      sourceInteractionId: interaction.id,
    });
  }

  await clientRepository.patchStats(clientId, applyPurchaseToStats(client.stats, total, new Date(at)));

  revalidatePath(`/ba/clients/${clientId}`);
  redirect(`/ba/clients/${clientId}?sale=${purchase.id}`);
}
