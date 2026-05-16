import type { BrandId } from "./brand";
import type { Branded } from "./branded";
import type { ClientId } from "./client";
import type { StaffId } from "./staff";
import type { StoreId } from "./store";

export type CommunicationId = Branded<string, "Communication">;

export type Channel = "WhatsApp" | "Email" | "SMS";
export type CommunicationDirection = "outbound" | "inbound";
export type CommunicationStatus = "sent" | "delivered" | "read" | "responded" | "failed";

export interface Communication {
  id: CommunicationId;
  clientId: ClientId;
  baId: StaffId;
  brand: BrandId;
  /** Store the BA was working from when the message was sent (denormalized from BA at send time). */
  storeId: StoreId;
  channel: Channel;
  direction: CommunicationDirection;
  at: string;
  templateId?: string;
  body: string;
  status: CommunicationStatus;
}
