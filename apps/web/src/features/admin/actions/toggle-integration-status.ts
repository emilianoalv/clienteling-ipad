"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { integrationRepository } from "@/server/repositories/integration.repository";
import type { IntegrationKey, IntegrationStatus } from "@/types/integration";

export type ToggleIntegrationStatusResult =
  | { ok: true; status: IntegrationStatus }
  | { ok: false; message: string };

/**
 * Cicla el status de una integración entre sandbox ↔ live. Los modos
 * `stub` (placeholder visual) se quedan como están — solo las que el
 * cliente puede genuinamente activar (POS, WhatsApp, e-Commerce con
 * adapter listo) se pueden flipear.
 *
 * Limitación honesta: este toggle es cosmético. NO conecta APIs reales
 * de Meta, Twilio, ni POS. Cuando Sprint 2 monte los adapters HTTP,
 * el toggle aquí iniciará el handshake real. Por ahora L'Oréal puede
 * mostrar en demo que la app *tiene* el control panel para activar
 * integraciones sin redeploy.
 */
export async function toggleIntegrationStatusAction(
  key: IntegrationKey,
): Promise<ToggleIntegrationStatusResult> {
  const { staff } = await requireSession();
  if (!can(staff.role, "integrations:write")) {
    return { ok: false, message: "Sin permiso para configurar integraciones" };
  }

  const current = (await integrationRepository.list()).find((i) => i.key === key);
  if (!current) return { ok: false, message: "Integración no encontrada" };

  // Integraciones "stub" (puro placeholder) no se pueden activar todavía.
  // Las "sandbox" y "live" sí se ciclan entre sí.
  if (current.status === "stub") {
    return { ok: false, message: "Esta integración aún no tiene adapter; F4." };
  }

  const next: IntegrationStatus = current.status === "live" ? "sandbox" : "live";
  const updated = await integrationRepository.setStatus(key, next);
  if (!updated) return { ok: false, message: "No se pudo actualizar" };

  revalidatePath("/admin/integrations");
  return { ok: true, status: next };
}
