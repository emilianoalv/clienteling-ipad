import "server-only";
import type { ClientId } from "@/types/client";
import type { Interaction, InteractionId } from "@/types/interaction";
import { generateId } from "@/lib/id/generate-id";
import { SEED_INTERACTIONS } from "./seed";
import { persistent } from "./_persist";

export interface InteractionRepository {
  listByClient(clientId: ClientId): Promise<Interaction[]>;
  create(input: Omit<Interaction, "id">): Promise<Interaction>;
}

const INTERACTIONS: Interaction[] = persistent("__clienteling.interactions", () => [...SEED_INTERACTIONS]);

export const interactionRepository: InteractionRepository = {
  async listByClient(clientId) {
    return INTERACTIONS.filter((i) => i.clientId === clientId).sort((a, b) =>
      b.at.localeCompare(a.at),
    );
  },

  async create(input) {
    const id = generateId("int") as InteractionId;
    const interaction: Interaction = { ...input, id };
    INTERACTIONS.unshift(interaction);
    return interaction;
  },
};
