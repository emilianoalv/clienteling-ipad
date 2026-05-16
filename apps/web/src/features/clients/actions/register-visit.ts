"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { homeStoreFor, isStoreInScope } from "@/server/auth/scope";
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
    kind,
    at,
    motive: input.motive,
    ...(input.notes !== undefined && { notes: input.notes }),
    ...(input.durationMin !== undefined && { durationMin: input.durationMin }),
  });

  // Persist sample records (one per SKU).
  for (const sku of input.samples) {
    const product = await productRepository.findBySku(sku as Sku);
    await sampleRepository.create({
      clientId,
      baId: staff.id,
      sku: sku as Sku,
      name: product?.line ?? sku,
      givenAt: at,
      converted: false,
    });
  }

  // Persist a single recommendation record bundling all SKUs.
  if (input.recommendations.length > 0) {
    await recommendationRepository.create({
      clientId,
      baId: staff.id,
      storeId,
      at,
      items: input.recommendations.map((s) => s as Sku),
      status: "pending",
    });
  }

  // Optional follow-up task — fired only if the BA filled the section.
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

  await clientRepository.patchStats(clientId, applyVisitToStats(client.stats));

  revalidatePath(`/ba/clients/${clientId}`);
  redirect(`/ba/clients/${clientId}`);
}
