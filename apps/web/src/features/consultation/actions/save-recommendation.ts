"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { recommendationRepository } from "@/server/repositories/recommendation.repository";
import {
  saveRecommendationSchema,
  type SaveRecommendationInput,
} from "../schemas/save-recommendation.schema";
import type { ClientId } from "@/types/client";
import type { Sku } from "@/types/product";

export interface SaveRecommendationError {
  ok: false;
  fieldErrors?: Record<string, string[]>;
  message?: string;
}

export async function saveRecommendation(
  raw: SaveRecommendationInput,
): Promise<SaveRecommendationError | void> {
  const { staff } = await requireSession();
  if (!can(staff.role, "recommendations:write"))
    return { ok: false, message: "Sin permiso" };

  const parsed = saveRecommendationSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };

  const input = parsed.data;
  const created = await recommendationRepository.create({
    clientId: input.clientId as ClientId,
    baId: staff.id,
    at: new Date().toISOString(),
    items: input.items as Sku[],
    status: "pending",
  });

  revalidatePath(`/ba/clients/${input.clientId}`);
  redirect(`/ba/clients/${input.clientId}/basket/${created.id}`);
}
