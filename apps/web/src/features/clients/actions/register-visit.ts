"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { clientRepository } from "@/server/repositories/client.repository";
import { interactionRepository } from "@/server/repositories/interaction.repository";
import { applyPurchaseToStats, applyVisitToStats } from "../services/update-client-stats";
import { registerVisitSchema, type RegisterVisitInput } from "../schemas/register-visit.schema";
import type { ClientId } from "@/types/client";
import type { InteractionKind } from "@/types/interaction";

const VISIT_KIND_TO_INTERACTION: Record<RegisterVisitInput["kind"], InteractionKind> = {
  consultation: "consultation",
  purchase: "purchase",
  sample: "sample",
  courtesy: "courtesy",
  return: "return",
  followup: "followup",
};

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
  if (!client) return { ok: false, message: "Cliente no encontrado" };

  await interactionRepository.create({
    clientId,
    baId: staff.id,
    brand: input.brand,
    kind: VISIT_KIND_TO_INTERACTION[input.kind],
    at: new Date().toISOString(),
    ...(input.notes !== undefined && { notes: input.notes }),
    ...(input.amount !== undefined && { amount: input.amount }),
    ...(input.durationMin !== undefined && { durationMin: input.durationMin }),
    reasonId: input.reason,
  });

  const nextStats =
    input.kind === "purchase" && input.amount
      ? applyPurchaseToStats(client.stats, input.amount)
      : applyVisitToStats(client.stats);
  await clientRepository.patchStats(clientId, nextStats);

  revalidatePath(`/ba/clients/${clientId}`);
  redirect(`/ba/clients/${clientId}`);
}
