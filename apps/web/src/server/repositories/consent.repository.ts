import "server-only";
import type { ClientId } from "@/types/client";
import type { Consent, ConsentId } from "@/types/consent";
import type { Channel } from "@/types/communication";
import type { ConsentStatus, ConsentSource } from "@/types/consent";
import { generateId } from "@/lib/id/generate-id";
import { SEED_CONSENTS } from "./seed";
import { persistent } from "./_persist";

export interface ConsentRepository {
  listByClient(clientId: ClientId): Promise<Consent[]>;
  upsert(input: {
    clientId: ClientId;
    channel: Channel;
    status: ConsentStatus;
    source: ConsentSource;
    version: string;
    /**
     * Firma manuscrita del cliente (dataURL PNG). Se respalda el acto
     * único de aceptar el aviso de privacidad — los 3 consents del
     * wizard (WA/Email/SMS) comparten la misma firma.
     */
    signature?: string;
  }): Promise<Consent>;
  /** ARCO cascade — borra todos los consents de un cliente. */
  deleteByClient(clientId: ClientId): Promise<number>;
}

const CONSENTS: Consent[] = persistent("__clienteling.consents", () => [...SEED_CONSENTS]);

export const consentRepository: ConsentRepository = {
  async listByClient(clientId) {
    return CONSENTS.filter((c) => c.clientId === clientId);
  },

  async upsert(input) {
    const consent: Consent = {
      id: generateId("co") as ConsentId,
      at: new Date().toISOString(),
      ...input,
    };
    const idx = CONSENTS.findIndex((c) => c.clientId === input.clientId && c.channel === input.channel);
    if (idx >= 0) CONSENTS[idx] = consent;
    else CONSENTS.push(consent);
    return consent;
  },

  async deleteByClient(clientId) {
    let removed = 0;
    for (let i = CONSENTS.length - 1; i >= 0; i--) {
      if (CONSENTS[i]!.clientId === clientId) {
        CONSENTS.splice(i, 1);
        removed++;
      }
    }
    return removed;
  },
};
