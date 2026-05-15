import type { Branded } from "./branded";
import type { ClientId } from "./client";
import type { InteractionId } from "./interaction";
import type { StaffId } from "./staff";

export type FollowupTaskId = Branded<string, "FollowupTask">;

/**
 * How the BA plans to follow up — drives the icon shown in lists and the
 * default copy when pre-filling tasks.
 */
export type FollowupType =
  | "call"
  | "whatsapp"
  | "email"
  | "sample-feedback"
  | "appointment"
  | "other";

export type FollowupStatus = "pending" | "done" | "cancelled";

export interface FollowupTypeOption {
  id: FollowupType;
  label: string;
}

export const FOLLOWUP_TYPES: ReadonlyArray<FollowupTypeOption> = [
  { id: "call", label: "Llamada" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "Correo" },
  { id: "sample-feedback", label: "Feedback muestra" },
  { id: "appointment", label: "Cita" },
  { id: "other", label: "Otro" },
];

/**
 * Action the BA committed to take with a client after a visit/sale.
 *
 * Created from any of: visit form, sale form, or manually. Has a single
 * lifecycle: pending → done (with `result`) or cancelled.
 */
export interface FollowupTask {
  id: FollowupTaskId;
  clientId: ClientId;
  baId: StaffId;
  type: FollowupType;
  /** Free-form text — what the BA needs to do. */
  description: string;
  /** ISO datetime when the task is due. */
  dueAt: string;
  status: FollowupStatus;
  /** Filled when status flips to "done". Free text describing the outcome. */
  result?: string;
  /** ISO datetime when the task was completed or cancelled. */
  completedAt?: string;
  /** Visit/sale interaction that originated this task, if any. */
  sourceInteractionId?: InteractionId;
  /** ISO datetime when the task was created. */
  createdAt: string;
}
