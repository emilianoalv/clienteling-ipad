import "server-only";
import type { Integration, IntegrationKey } from "@/types/integration";

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

export interface IntegrationRepository {
  list(): Promise<Integration[]>;
}

export const integrationRepository: IntegrationRepository = {
  async list() {
    return [...SEED];
  },
};
