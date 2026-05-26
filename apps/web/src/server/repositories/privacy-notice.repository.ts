import "server-only";
import type { PrivacyNotice, PrivacyNoticeId } from "@/types/privacy-notice";
import { generateId } from "@/lib/id/generate-id";
import { persistent } from "./_persist";

/**
 * Seed con la versión actual del aviso de privacidad. Cuando el Admin
 * publique una nueva versión, el array crece y la primera (índice 0)
 * pasa a ser la activa.
 */
const SEED: PrivacyNotice[] = [
  {
    id: "pn-2026-03" as PrivacyNoticeId,
    version: "v2026.03",
    publishedAt: "2026-03-01T10:00:00.000Z",
    publishedBy: "Ana Lucía Ferrer · Admin",
    changeSummary:
      "Versión inicial. Cumple LFPDPPP México: finalidades, datos personales recolectados, derechos ARCO, mecanismos de revocación y transferencias.",
  },
];

// Más reciente primero — facilita `getActive` y el render del listado.
const NOTICES: PrivacyNotice[] = persistent(
  "__clienteling.privacyNotices.v1",
  () => [...SEED],
);

export interface PrivacyNoticeRepository {
  list(): Promise<PrivacyNotice[]>;
  getActive(): Promise<PrivacyNotice | null>;
  publish(
    input: Omit<PrivacyNotice, "id" | "publishedAt">,
  ): Promise<PrivacyNotice>;
}

export const privacyNoticeRepository: PrivacyNoticeRepository = {
  async list() {
    return [...NOTICES];
  },
  async getActive() {
    return NOTICES[0] ?? null;
  },
  async publish(input) {
    const notice: PrivacyNotice = {
      id: generateId("pn") as PrivacyNoticeId,
      version: input.version,
      publishedAt: new Date().toISOString(),
      publishedBy: input.publishedBy,
      ...(input.changeSummary ? { changeSummary: input.changeSummary } : {}),
    };
    NOTICES.unshift(notice);
    return notice;
  },
};
