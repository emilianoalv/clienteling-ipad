"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/server/auth/session";
import { can } from "@/config/rbac";
import { auditEventRepository } from "@/server/repositories/audit-event.repository";
import { privacyNoticeRepository } from "@/server/repositories/privacy-notice.repository";
import {
  publishNoticeSchema,
  type PublishNoticeInput,
} from "../schemas/publish-notice.schema";

export type PublishNoticeResult =
  | { ok: true; version: string }
  | { ok: false; fieldErrors?: Record<string, string[]>; message?: string };

/**
 * Publica una nueva versión del aviso de privacidad. La versión nueva
 * se vuelve la activa para la captura de consents (RNF-07 / CA-02).
 *
 * Reuso `users:write` como permiso porque manejar el aviso de privacidad
 * es competencia del Admin Central (RF-55). En producción podría
 * justificarse una permission propia (`privacy:write`) si quisiéramos
 * delegar publicación a un rol de cumplimiento dedicado.
 */
export async function publishPrivacyNoticeAction(
  raw: PublishNoticeInput,
): Promise<PublishNoticeResult> {
  const { staff } = await requireSession();
  if (!can(staff.role, "users:write")) {
    return { ok: false, message: "Sin permiso para publicar avisos" };
  }

  const parsed = publishNoticeSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await privacyNoticeRepository.list();
  if (existing.some((n) => n.version === parsed.data.version)) {
    return {
      ok: false,
      fieldErrors: { version: ["Esta versión ya fue publicada"] },
    };
  }

  const published = await privacyNoticeRepository.publish({
    version: parsed.data.version,
    publishedBy: `${staff.name} · ${staff.role}`,
    ...(parsed.data.changeSummary
      ? { changeSummary: parsed.data.changeSummary }
      : {}),
  });

  await auditEventRepository.create({
    title: "Aviso de privacidad publicado",
    subject: published.version,
    actor: `${staff.name} · ${staff.role}`,
  });

  revalidatePath("/admin/privacy");
  revalidatePath("/admin");
  return { ok: true, version: published.version };
}
