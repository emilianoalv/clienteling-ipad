import type { BrandId } from "./brand";
import type { Branded } from "./branded";
import type { ClientId } from "./client";
import type { StaffId } from "./staff";
import type { StoreId } from "./store";
import type { VisitMotive } from "./visit-motive";

export type InteractionId = Branded<string, "Interaction">;

export type InteractionKind =
  | "consultation"
  | "purchase"
  | "discovery"
  | "whatsapp"
  | "appointment"
  | "sample"
  | "return"
  | "courtesy"
  | "followup";

export interface Interaction {
  id: InteractionId;
  clientId: ClientId;
  baId: StaffId;
  brand: BrandId;
  storeId: StoreId;
  kind: InteractionKind;
  at: string;
  notes?: string;
  amount?: number;
  durationMin?: number;
  reasonId?: string;
  reasonLabel?: string;
  /**
   * Why the client came in. Captured in visit/sale forms. Independent of
   * outcome — orthogonal to `kind`.
   */
  motive?: VisitMotive;
}
