"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { auditEventRepository } from "@/server/repositories/audit-event.repository";
import { sampleRepository } from "@/server/repositories/sample.repository";
import {
  sampleStockSchema,
  type SampleStockInput,
} from "../schemas/sample-stock.schema";

export type UpdateSampleStockResult =
  | { ok: true }
  | { ok: false; fieldErrors?: Record<string, string[]>; message?: string };

/**
 * Ajusta el inventario de un SKU sampleable. La Gerente lo usa para
 * registrar un lote recibido (suma al `have`), corregir tras conteo
 * físico (sobrescribe `have`) o cambiar la meta de capacidad.
 *
 * La UI ya no expone la operación "increment" — el caller calcula el
 * `have` final y lo pasa, manteniendo la API del repo simple.
 */
export async function updateSampleStockAction(
  sku: string,
  raw: SampleStockInput,
): Promise<UpdateSampleStockResult> {
  const { staff } = await requireSession();
  if (!can(staff.role, "samples:write")) {
    return { ok: false, message: "Sin permiso para ajustar inventario" };
  }

  const parsed = sampleStockSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const input = parsed.data;

  const updated = await sampleRepository.updateInventory(sku, {
    have: input.have,
    capacity: input.capacity,
  });
  if (!updated) return { ok: false, message: "SKU no encontrado" };

  await auditEventRepository.create({
    title: "Inventario de muestras ajustado",
    subject: `${updated.sku} · ${updated.have}/${updated.capacity}`,
    actor: `${staff.name} · ${staff.role}`,
  });

  revalidatePath("/gerente/sample-stock");
  revalidatePath("/ba/samples");
  return { ok: true };
}
