import type { Branded } from "./branded";
import type { ClientId } from "./client";
import type { Channel } from "./communication";

export type ConsentId = Branded<string, "Consent">;

export type ConsentStatus = "granted" | "revoked";
export type ConsentSource = "in-store" | "client-web" | "import" | "phone";

export interface Consent {
  id: ConsentId;
  clientId: ClientId;
  channel: Channel;
  status: ConsentStatus;
  at: string;
  version: string;
  source: ConsentSource;
  /**
   * Firma manuscrita del cliente capturada en iPad (dataURL PNG base64).
   * Solo se rellena en el primer Consent de cada cliente (cuando firma
   * el aviso de privacidad en el wizard de alta). Los Consent posteriores
   * — revocaciones, re-opt-in por canal — no requieren firma.
   */
  signature?: string;
}
