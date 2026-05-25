import "server-only";
import type { Integration, IntegrationKey, IntegrationStatus } from "@/types/integration";
import { persistent } from "./_persist";

const SEED: Integration[] = [
  {
    key: "POS" as IntegrationKey,
    label: "POS Liverpool / Palacio",
    status: "sandbox",
    lastEvent: "Handoff ticket #pu-221",
    mode: "Stub · QR",
  },
  {
    key: "ECOM" as IntegrationKey,
    label: "e-Commerce L'Oréal Luxe MX",
    status: "stub",
    lastEvent: "—",
    mode: "Preparado",
  },
  {
    key: "DIAGNOSIS" as IntegrationKey,
    label: "Skin Diagnostics (ModiFace)",
    status: "sandbox",
    lastEvent: "Análisis demo",
    mode: "SDK simulado",
  },
  {
    key: "WHATSAPP" as IntegrationKey,
    label: "WhatsApp Business API",
    status: "sandbox",
    lastEvent: "Mensaje msg-1 entregado",
    mode: "Simulador",
  },
];

const INTEGRATIONS = persistent(
  "__clienteling.integrations.v1",
  () => new Map<IntegrationKey, Integration>(SEED.map((i) => [i.key, i])),
);

export interface IntegrationRepository {
  list(): Promise<Integration[]>;
  setStatus(key: IntegrationKey, status: IntegrationStatus): Promise<Integration | null>;
}

export const integrationRepository: IntegrationRepository = {
  async list() {
    return Array.from(INTEGRATIONS.values());
  },
  async setStatus(key, status) {
    const existing = INTEGRATIONS.get(key);
    if (!existing) return null;
    const updated: Integration = {
      ...existing,
      status,
      lastEvent: `Status → ${status} · ${new Date().toISOString().slice(0, 10)}`,
    };
    INTEGRATIONS.set(key, updated);
    return updated;
  },
};
