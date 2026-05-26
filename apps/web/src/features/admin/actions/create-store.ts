"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { auditEventRepository } from "@/server/repositories/audit-event.repository";
import { storeRepository } from "@/server/repositories/store.repository";
import { generateId } from "@/lib/id/generate-id";
import type { StoreId } from "@/types/store";
import { storeSchema, type StoreInput } from "../schemas/store.schema";

export type CreateStoreResult =
  | { ok: true; storeId: StoreId }
  | { ok: false; fieldErrors?: Record<string, string[]>; message?: string };

/**
 * Alta de tienda. RF-55 + RNF-14/16: el Admin gestiona tiendas a nivel
 * nacional desde la UI, no dependiendo del proveedor para tocar seed.
 *
 * Persistente en memoria (mismo modelo que createUser). Emite un evento
 * de auditoría — la pantalla `/admin/audit` se vuelve realmente útil
 * porque cada acción de configuración deja huella.
 */
export async function createStoreAction(raw: StoreInput): Promise<CreateStoreResult> {
  const { staff } = await requireSession();
  if (!can(staff.role, "stores:write")) {
    return { ok: false, message: "Sin permiso para crear tiendas" };
  }

  const parsed = storeSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const input = parsed.data;

  const id = generateId("st") as StoreId;
  const created = await storeRepository.create({
    id,
    name: input.name,
    chain: input.chain,
    city: input.city,
    address: input.address,
    ...(input.monthlyTarget !== undefined ? { monthlyTarget: input.monthlyTarget } : {}),
  });

  await auditEventRepository.create({
    title: "Tienda creada",
    subject: created.name,
    actor: `${staff.name} · ${staff.role}`,
  });

  revalidatePath("/admin/stores");
  revalidatePath("/admin");
  return { ok: true, storeId: id };
}
