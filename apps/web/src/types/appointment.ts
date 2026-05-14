import type { BrandId } from "./brand";
import type { Branded } from "./branded";
import type { ClientId } from "./client";
import type { StaffId } from "./staff";

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
