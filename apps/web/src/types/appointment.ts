import type { BrandId } from "./brand";
import type { Branded } from "./branded";
import type { ClientId } from "./client";
import type { StaffId } from "./staff";
import type { StoreId } from "./store";

export type AppointmentId = Branded<string, "Appointment">;

export type AppointmentKind =
  | "ritual"
  | "makeup"
  | "diagnosis"
  | "consultation"
  | "vip-cabin"
  | "facial"
  | "anniversary-event"
  | "product-followup"
  | "fragrance-consult"
  | "other";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "rescheduled"
  | "cancelled"
  | "no-show";

export interface Appointment {
  id: AppointmentId;
  clientId: ClientId;
  baId: StaffId;
  brand: BrandId;
  /** Store where the appointment takes place (denormalized from the BA's home store at creation time). */
  storeId: StoreId;
  /** ISO 8601 date-time. */
  at: string;
  durationMin: number;
  kind: AppointmentKind;
  status: AppointmentStatus;
  notes?: string;
  cancelReason?: string;
  rescheduledAt?: string;
  cancelledAt?: string;
}
