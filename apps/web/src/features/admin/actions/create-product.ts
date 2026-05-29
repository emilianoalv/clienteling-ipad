"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { auditEventRepository } from "@/server/repositories/audit-event.repository";
import { productRepository } from "@/server/repositories/product.repository";
import type { Product, Sku } from "@/types/product";
import { productSchema, type ProductInput } from "../schemas/product.schema";

export type CreateProductResult =
  | { ok: true; sku: Sku }
  | { ok: false; fieldErrors?: Record<string, string[]>; message?: string };

/**
 * Alta de producto. RF-17 + RF-55: el equipo de Marketing CRM mantiene
 * el catálogo nacional desde la UI sin redeploy. Stock por tienda y
 * atributos finos (concerns, ingredientes activos, ficha técnica) NO
 * se gestionan aquí — stock viene del POS (RF-22).
 */
export async function createProductAction(
  raw: ProductInput,
): Promise<CreateProductResult> {
  const { staff } = await requireSession();
  if (!can(staff.role, "products:write")) {
    return { ok: false, message: "Sin permiso para crear productos" };
  }

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const input = parsed.data;

  const sku = input.sku.toUpperCase() as Sku;
  const existing = await productRepository.findBySku(sku);
  if (existing) {
    return { ok: false, fieldErrors: { sku: ["Ya existe un producto con ese SKU"] } };
  }

  const product: Product = {
    sku,
    brand: input.brand,
    line: input.line,
    name: input.name,
    size: input.size,
    price: input.price,
    stock: {},
    attrs: { tipo: input.category },
    howTo: "",
    selling: [],
    lifecycleDays: input.lifecycleDays,
  };

  await productRepository.create(product);

  await auditEventRepository.create({
    title: "Producto creado",
    subject: `${product.sku} · ${product.line}`,
    actor: `${staff.name} · ${staff.role}`,
  });

  revalidatePath("/admin/catalog");
  revalidatePath("/ba/catalog");
  return { ok: true, sku };
}
