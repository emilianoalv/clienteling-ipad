"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { auditEventRepository } from "@/server/repositories/audit-event.repository";
import { productRepository } from "@/server/repositories/product.repository";
import type { Sku } from "@/types/product";
import { productSchema, type ProductInput } from "../schemas/product.schema";

export type UpdateProductResult =
  | { ok: true }
  | { ok: false; fieldErrors?: Record<string, string[]>; message?: string };

/**
 * Edita los campos "core" de un producto. SKU se valida que no
 * cambie (la identidad del producto no se renombra una vez creado;
 * si necesitas un SKU nuevo, crea producto nuevo y elimina el viejo).
 * Preserva `stock`, `attrs` no editables (concerns, piel, vegano,
 * etc.), `howTo`, `selling` y `sampleSku` del estado previo.
 */
export async function updateProductAction(
  sku: Sku,
  raw: ProductInput,
): Promise<UpdateProductResult> {
  const { staff } = await requireSession();
  if (!can(staff.role, "products:write")) {
    return { ok: false, message: "Sin permiso para editar productos" };
  }

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const input = parsed.data;

  if ((input.sku.toUpperCase() as Sku) !== sku) {
    return {
      ok: false,
      fieldErrors: { sku: ["El SKU no se puede cambiar al editar"] },
    };
  }

  const current = await productRepository.findBySku(sku);
  if (!current) return { ok: false, message: "Producto no encontrado" };

  const updated = await productRepository.update(sku, {
    brand: input.brand,
    line: input.line,
    name: input.name,
    size: input.size,
    price: input.price,
    lifecycleDays: input.lifecycleDays,
    // Merge `attrs.tipo` sin perder el resto de attrs (concerns, piel,
    // vegano, etc.) que vienen del seed y no se editan acá.
    attrs: { ...current.attrs, tipo: input.category },
  });

  if (!updated) return { ok: false, message: "Producto no encontrado" };

  await auditEventRepository.create({
    title: "Producto editado",
    subject: `${updated.sku} · ${updated.line}`,
    actor: `${staff.name} · ${staff.role}`,
  });

  revalidatePath("/admin/catalog");
  revalidatePath("/ba/catalog");
  return { ok: true };
}
