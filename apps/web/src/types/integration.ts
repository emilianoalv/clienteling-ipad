import type { Branded } from "./branded";

export type IntegrationKey = Branded<string, "Integration">;

export type IntegrationStatus = "live" | "sandbox" | "stub";

export interface Integration {
  key: IntegrationKey;
  label: string;
  status: IntegrationStatus;
  lastEvent: string;
  mode: string;
}
