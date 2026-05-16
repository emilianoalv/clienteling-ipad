"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { isStoreInScope } from "@/server/auth/scope";
import { can } from "@/config/rbac";
import { recommendationRepository } from "@/server/repositories/recommendation.repository";
import type { RecommendationId } from "@/types/recommendation";

const schema = z.object({
  recommendationId: z.string().min(1),
});

export interface HandoffResult {
  ok: boolean;
  message?: string;
}

export async function handoffRecommendation(raw: z.infer<typeof schema>): Promise<HandoffResult> {
  const { staff } = await requireSession();
  if (!can(staff.role, "recommendations:write"))
    return { ok: false, message: "Sin permiso" };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Datos inválidos" };

  const current = await recommendationRepository.findById(parsed.data.recommendationId as RecommendationId);
  if (!current || !isStoreInScope(staff, current.storeId)) {
    return { ok: false, message: "Recomendación no encontrada" };
  }

  const updated = await recommendationRepository.patch(parsed.data.recommendationId as RecommendationId, {
    status: "converted",
  });
  if (!updated) return { ok: false, message: "Recomendación no encontrada" };

  revalidatePath(`/ba/clients/${updated.clientId}`);
  revalidatePath(`/ba/clients/${updated.clientId}/basket/${updated.id}`);
  return { ok: true };
}
