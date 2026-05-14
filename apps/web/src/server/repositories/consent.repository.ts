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
  }): Promise<Consent>;
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
};
