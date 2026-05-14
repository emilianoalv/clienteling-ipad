import type { BrandId } from "./brand";
import type { Branded } from "./branded";
import type { ClientId } from "./client";
import type { StaffId } from "./staff";

export type CommunicationId = Branded<string, "Communication">;

export type Channel = "WhatsApp" | "Email" | "SMS";
export type CommunicationDirection = "outbound" | "inbound";
export type CommunicationStatus = "sent" | "delivered" | "read" | "responded" | "failed";

export interface Communication {
  id: CommunicationId;
  clientId: ClientId;
  baId: StaffId;
  brand: BrandId;
  channel: Channel;
  direction: CommunicationDirection;
  at: string;
  templateId?: string;
  body: string;
  status: CommunicationStatus;
}
