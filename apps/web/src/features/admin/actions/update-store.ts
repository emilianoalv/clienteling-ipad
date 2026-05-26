"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { auditEventRepository } from "@/server/repositories/audit-event.repository";
import { storeRepository } from "@/server/repositories/store.repository";
import type { StoreId } from "@/types/store";
import { storeSchema, type StoreInput } from "../schemas/store.schema";

export type UpdateStoreResult =
  | { ok: true }
  | { ok: false; fieldErrors?: Record<string, string[]>; message?: string };

export async function updateStoreAction(
  id: StoreId,
  raw: StoreInput,
): Promise<UpdateStoreResult> {
  const { staff } = await requireSession();
  if (!can(staff.role, "stores:write")) {
    return { ok: false, message: "Sin permiso para editar tiendas" };
  }

  const parsed = storeSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const input = parsed.data;

  const next = await storeRepository.update(id, {
    name: input.name,
    chain: input.chain,
    city: input.city,
    address: input.address,
    // monthlyTarget puede ser undefined (no se incluye); el repo hace merge
    // y deja el valor previo. Para "quitar" el objetivo el caller pasaría
    // explícitamente 0; para "no cambiarlo" omite la prop.
    ...(input.monthlyTarget !== undefined ? { monthlyTarget: input.monthlyTarget } : {}),
  });

  if (!next) return { ok: false, message: "Tienda no encontrada" };

  await auditEventRepository.create({
    title: "Tienda editada",
    subject: next.name,
    actor: `${staff.name} · ${staff.role}`,
  });

  revalidatePath("/admin/stores");
  revalidatePath("/admin");
  return { ok: true };
}
