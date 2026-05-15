"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { clientRepository } from "@/server/repositories/client.repository";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import { interactionRepository } from "@/server/repositories/interaction.repository";
import { applyPurchaseToStats } from "../services/update-client-stats";
import { registerSaleSchema, type RegisterSaleInput } from "../schemas/register-sale.schema";
import type { ClientId } from "@/types/client";
import type { StoreId } from "@/types/store";
import type { Sku } from "@/types/product";

const DEFAULT_STORE = "st-polanco" as StoreId;
const DEFAULT_BRAND = "Lancôme" as const;

export interface RegisterSaleError {
  ok: false;
  fieldErrors?: Record<string, string[]>;
  message?: string;
}

export async function registerSale(raw: RegisterSaleInput): Promise<RegisterSaleError | void> {
  const { staff } = await requireSession();
  if (!can(staff.role, "purchases:write")) return { ok: false, message: "Sin permiso" };

  const parsed = registerSaleSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const input = parsed.data;
  const clientId = input.clientId as ClientId;
  const client = await clientRepository.findById(clientId);
  if (!client) return { ok: false, message: "Cliente no encontrado" };

  const total = input.items.reduce((acc, i) => acc + i.qty * i.unitPrice, 0);
  const at = new Date(`${input.purchaseDate}T${input.purchaseTime}:00`).toISOString();

  const purchase = await purchaseRepository.create({
    clientId,
    baId: staff.id,
    storeId: "storeId" in staff && staff.storeId ? (staff.storeId as StoreId) : DEFAULT_STORE,
    at,
    items: input.items.map((i) => ({ sku: i.sku as Sku, qty: i.qty, unitPrice: i.unitPrice })),
    total,
    payment: input.payment,
    manual: true,
    ...(input.ticketRef !== undefined && { ticketRef: input.ticketRef }),
    ...(input.paymentDetail !== undefined && { paymentDetail: input.paymentDetail }),
  });

  await interactionRepository.create({
    clientId,
    baId: staff.id,
    brand: DEFAULT_BRAND,
    kind: "purchase",
    at,
    amount: total,
    motive: input.motive,
    ...(input.notes !== undefined && { notes: input.notes }),
  });

  await clientRepository.patchStats(clientId, applyPurchaseToStats(client.stats, total, new Date(at)));

  revalidatePath(`/ba/clients/${clientId}`);
  redirect(`/ba/clients/${clientId}?sale=${purchase.id}`);
}
