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
    await followupTaskRepository.create({
      clientId,
      baId: staff.id,
      type: input.followup.type,
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

  await clientRepository.patchStats(clientId, applyPurchaseToStats(client.stats, total, new Date(at)));

  revalidatePath(`/ba/clients/${clientId}`);
  redirect(`/ba/clients/${clientId}?sale=${purchase.id}`);
}
