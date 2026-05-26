import type { Branded } from "./branded";

export type PrivacyNoticeId = Branded<string, "PrivacyNotice">;

/**
 * Versión publicada del aviso de privacidad (LFPDPPP / RNF-07 /
 * CA-02). Cada nueva publicación se acumula en el repo y la versión
 * activa es la más reciente. Los consents firmados quedan ligados
 * a la versión vigente cuando el cliente aceptó — así queda rastro
 * para auditoría regulatoria.
 */
export interface PrivacyNotice {
  id: PrivacyNoticeId;
  /** Tag versionado tipo "v2026.03" — el Admin la define al publicar. */
  version: string;
  /** ISO date-time de publicación. */
  publishedAt: string;
  /** Display name del Admin que publicó (para audit + UI). */
  publishedBy: string;
  /** Resumen humano de los cambios. Opcional pero recomendado. */
  changeSummary?: string;
}
