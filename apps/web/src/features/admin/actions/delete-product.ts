"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { auditEventRepository } from "@/server/repositories/audit-event.repository";
import { productRepository } from "@/server/repositories/product.repository";
import { purchaseRepository } from "@/server/repositories/purchase.repository";
import type { Sku } from "@/types/product";

export type DeleteProductResult = { ok: true } | { ok: false; message: string };

/**
 * Eliminar un producto del catálogo. Bloqueado si tiene tickets
 * históricos que lo referencian — borrarlo dejaría los Purchase
 * apuntando a un SKU fantasma y rompería los totales del Tab Compras
 * en perfiles de cliente. La alternativa correcta sería "descontinuar"
 * (soft-delete con flag `active`) pero eso es Sprint 2.
 */
export async function deleteProductAction(
  sku: Sku,
): Promise<DeleteProductResult> {
  const { staff } = await requireSession();
  if (!can(staff.role, "products:write")) {
    return { ok: false, message: "Sin permiso para eliminar productos" };
  }

  const product = await productRepository.findBySku(sku);
  if (!product) return { ok: false, message: "Producto no encontrado" };

  const purchases = await purchaseRepository.list({});
  const referenced = purchases.some((p) =>
    p.items.some((i) => i.sku === sku),
  );
  if (referenced) {
    return {
      ok: false,
      message:
        "No se puede eliminar: el SKU aparece en tickets históricos. Considera descontinuar en lugar de borrar.",
    };
  }

  await productRepository.delete(sku);

  await auditEventRepository.create({
    title: "Producto eliminado",
    subject: `${product.sku} · ${product.line}`,
    actor: `${staff.name} · ${staff.role}`,
  });

  revalidatePath("/admin/catalog");
  revalidatePath("/ba/catalog");
  return { ok: true };
}
