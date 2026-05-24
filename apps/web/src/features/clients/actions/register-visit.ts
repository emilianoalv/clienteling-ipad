"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { homeBrandFor, homeStoreFor, isStoreInScope } from "@/server/auth/scope";
import { can } from "@/config/rbac";
import { clientRepository } from "@/server/repositories/client.repository";
import { interactionRepository } from "@/server/repositories/interaction.repository";
import { sampleRepository } from "@/server/repositories/sample.repository";
import { recommendationRepository } from "@/server/repositories/recommendation.repository";
import { productRepository } from "@/server/repositories/product.repository";
import { followupTaskRepository } from "@/server/repositories/followup-task.repository";
import { applyVisitToStats } from "../services/update-client-stats";
import { registerVisitSchema, type RegisterVisitInput } from "../schemas/register-visit.schema";
import type { ClientId } from "@/types/client";
import type { InteractionKind } from "@/types/interaction";
import type { BrandId } from "@/types/brand";
import type { Sku } from "@/types/product";

const DEFAULT_BRAND = "Lancôme" as BrandId;

export interface RegisterVisitError {
  ok: false;
  fieldErrors?: Record<string, string[]>;
  message?: string;
}

export async function registerVisit(raw: RegisterVisitInput): Promise<RegisterVisitError | void> {
  const { staff } = await requireSession();
  if (!can(staff.role, "clients:write")) return { ok: false, message: "Sin permiso" };

  const parsed = registerVisitSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const input = parsed.data;
  const clientId = input.clientId as ClientId;
  const client = await clientRepository.findById(clientId);
  // Out-of-scope and not-found return the same error (no existence leak).
  if (!client || !isStoreInScope(staff, client.storeId)) {
    return { ok: false, message: "Cliente no encontrado" };
  }

  const storeId = homeStoreFor(staff);
  if (!storeId) return { ok: false, message: "Tu rol no tiene tienda asignada para registrar visitas." };

  const at = new Date().toISOString();

  // Derive interaction kind from outcomes — samples > recommendations > visit.
  const kind: InteractionKind =
    input.samples.length > 0
      ? "sample"
      : input.recommendations.length > 0
        ? "consultation"
        : "courtesy";

  // Pick the dominant brand for the interaction from sampled/recommended products,
  // falling back to the client's primary brand or the BA default.
  const brand =
    client.brands[0] ?? DEFAULT_BRAND;

  const interaction = await interactionRepository.create({
    clientId,
    baId: staff.id,
    brand,
    storeId,
    kind,
    at,
    motive: input.motive,
    ...(input.notes !== undefined && { notes: input.notes }),
    ...(input.durationMin !== undefined && { durationMin: input.durationMin }),
  });

  // Persist sample records (one per SKU). El wizard ofrece productos
  // COMPLETOS samplables (LC-HZN-50), pero la Sample debe guardarse con el
  // SKU de la mini correspondiente (LC-HZN-7) — de otro modo el matching
  // sample→venta nunca cierra el ciclo. También resolvemos el nombre real
  // del sample desde el inventario para que el log de muestras muestre
  // "Hydra Zen Gel Cream 7ml" en vez del nombre del frasco completo.
  if (input.samples.length > 0) {
    const inventory = await sampleRepository.listInventory();
    const invBySku = new Map(inventory.map((i) => [i.sku, i]));
    for (const sku of input.samples) {
      const product = await productRepository.findBySku(sku as Sku);
      const sampleSku = (product?.sampleSku ?? (sku as Sku)) as Sku;
      const inv = invBySku.get(sampleSku as unknown as string);
      await sampleRepository.create({
        clientId,
        baId: staff.id,
        storeId,
        brand: product?.brand ?? brand,
        sku: sampleSku,
        name: inv?.name ?? product?.line ?? sku,
        givenAt: at,
        converted: false,
      });
    }
  }

  // Persist a single recommendation record bundling all SKUs.
  if (input.recommendations.length > 0) {
    // Recommendation brand follows the BA's brand; fall back to the dominant
    // client brand for non-BA roles (Gerente/Admin demoing the flow).
    const recBrand = homeBrandFor(staff) ?? brand;
    await recommendationRepository.create({
      clientId,
      baId: staff.id,
      storeId,
      brand: recBrand,
      at,
      items: input.recommendations.map((s) => s as Sku),
      status: "pending",
    });
  }

  // Follow-up task:
  // 1. Si la BA llenó la sección manualmente, respetar exactamente lo que puso.
  // 2. Si NO programó nada PERO entregó muestras, auto-generar una task de
  //    feedback a 14 días — el ciclo de muestra siempre debe cerrarse en
  //    seguimiento, no podemos confiar en la memoria de la BA.
  if (input.followup) {
    // Si la BA dio muestras + programó followup manual, asumimos que el
    // motivo es feedback de muestra. En caso contrario lo dejamos como
    // general para no inventar categoría sin pedirla en el form (el
    // Commit 2 expone el picker).
    const manualCategory =
      input.samples.length > 0 ? ("sample-feedback" as const) : ("general" as const);
    await followupTaskRepository.create({
      clientId,
      baId: staff.id,
      type: input.followup.type,
      category: manualCategory,
      description: input.followup.description,
      dueAt: new Date(`${input.followup.dueAt}T12:00:00`).toISOString(),
      sourceInteractionId: interaction.id,
    });
  } else if (input.samples.length > 0) {
    const firstName = client.name.split(" ")[0] ?? client.name;
    // Resolver nombres reales de productos (con fallback a SKU) para que la
    // descripción se sienta natural en el inbox del BA.
    const sampleNames = await Promise.all(
      input.samples.map(async (sku) => {
        const product = await productRepository.findBySku(sku as Sku);
        return product?.line ?? sku;
      }),
    );
    const productList =
      sampleNames.length === 1
        ? sampleNames[0]
        : `${sampleNames.slice(0, -1).join(", ")} y ${sampleNames[sampleNames.length - 1]}`;
    await followupTaskRepository.create({
      clientId,
      baId: staff.id,
      type: "whatsapp",
      category: "sample-feedback",
      description: `Pedir feedback de ${productList} a ${firstName}`,
      dueAt: addDaysISO(14),
      sourceInteractionId: interaction.id,
    });
  }

  await clientRepository.patchStats(clientId, applyVisitToStats(client.stats));

  revalidatePath(`/ba/clients/${clientId}`);
  redirect(`/ba/clients/${clientId}`);
}

function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
