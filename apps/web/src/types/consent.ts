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
}
