"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { isStoreInScope } from "@/server/auth/scope";
import { can } from "@/config/rbac";
import { clientRepository } from "@/server/repositories/client.repository";
import type { ClientId } from "@/types/client";
import {
  updateBeautyProfileSchema,
  type UpdateBeautyProfileInput,
} from "../schemas/update-beauty-profile.schema";

export interface ActionResult {
  ok: boolean;
  fieldErrors?: Record<string, string[]>;
  message?: string;
}

/**
 * Updates the beauty profile (skin + routine + interests + ingredient
 * preferences) of an existing client. Used by the "Perfil de belleza" tab
 * in the client profile.
 */
export async function updateBeautyProfile(
  raw: UpdateBeautyProfileInput,
): Promise<ActionResult> {
  const { staff } = await requireSession();
  if (!can(staff.role, "clients:write")) {
    return { ok: false, message: "Sin permiso para modificar perfiles" };
  }

  const parsed = updateBeautyProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const input = parsed.data;
  const existing = await clientRepository.findById(input.clientId as ClientId);
  if (!existing) return { ok: false, message: "Cliente no encontrado" };
  if (!isStoreInScope(staff, existing.storeId)) {
    // Mirror the silent 404 pattern used elsewhere.
    return { ok: false, message: "Sin acceso a este cliente" };
  }

  await clientRepository.patchProfile(input.clientId as ClientId, {
    skin: {
      type: input.skin.type,
      tone: input.skin.tone,
      concerns: input.skin.concerns,
      ...(input.skin.subtone ? { subtone: input.skin.subtone } : {}),
    },
    allergies: input.allergies,
    routine: input.routine,
    routineTiming: input.routineTiming,
    ...(input.routineSteps && input.routineSteps.length > 0
      ? { routineSteps: input.routineSteps }
      : { routineSteps: undefined }),
    interests: input.interests,
    ...(input.preferredIngredients && input.preferredIngredients.length > 0
      ? { preferredIngredients: input.preferredIngredients }
      : { preferredIngredients: undefined }),
    ...(input.avoidedIngredients && input.avoidedIngredients.length > 0
      ? { avoidedIngredients: input.avoidedIngredients }
      : { avoidedIngredients: undefined }),
  });

  revalidatePath(`/ba/clients/${input.clientId}`);
  return { ok: true };
}
