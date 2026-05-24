import type { Branded } from "./branded";
import type { ClientId } from "./client";
import type { InteractionId } from "./interaction";
import type { StaffId } from "./staff";

export type FollowupTaskId = Branded<string, "FollowupTask">;

/**
 * How the BA plans to follow up — drives the icon shown in lists and the
 * default copy when pre-filling tasks. Orthogonal to FollowupCategory:
 * `type` = canal/medio, `category` = motivo del seguimiento.
 */
export type FollowupType =
  | "call"
  | "whatsapp"
  | "email"
  | "sample-feedback"
  | "appointment"
  | "other";

/**
 * Por qué se hace el seguimiento. Requisito de negocio: toda tarea debe
 * estar clasificada para que la BA y el Gerente puedan analizar patrones
 * (cuántos seguimientos de cumpleaños cierran, qué % de check-in a 3
 * meses se convierte en venta, etc.).
 */
export type FollowupCategory =
  | "3-month-check"
  | "6-month-check"
  | "birthday"
  | "replenishment"
  | "special-event"
  | "sample-feedback"
  | "post-purchase"
  | "general";

export type FollowupStatus = "pending" | "done" | "cancelled";

export interface FollowupTypeOption {
  id: FollowupType;
  label: string;
}

export interface FollowupCategoryOption {
  id: FollowupCategory;
  label: string;
  /** Hint corto que se muestra en pickers y headers de inbox. */
  hint?: string;
}

export const FOLLOWUP_TYPES: ReadonlyArray<FollowupTypeOption> = [
  { id: "call", label: "Llamada" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "Correo" },
  { id: "sample-feedback", label: "Feedback muestra" },
  { id: "appointment", label: "Cita" },
  { id: "other", label: "Otro" },
];

export const FOLLOWUP_CATEGORIES: ReadonlyArray<FollowupCategoryOption> = [
  { id: "sample-feedback", label: "Feedback de muestra", hint: "Cierra ciclo de prueba en casa" },
  { id: "post-purchase", label: "Post-venta", hint: "Cierre cordial después de una compra" },
  { id: "3-month-check", label: "Check-in 3 meses", hint: "Re-engagement temprano" },
  { id: "6-month-check", label: "Check-in 6 meses", hint: "Mantener relación" },
  { id: "replenishment", label: "Reposición", hint: "Producto que está por acabarse" },
  { id: "birthday", label: "Cumpleaños", hint: "Saludo + promo aniversario" },
  { id: "special-event", label: "Evento especial", hint: "Lanzamiento, anniversary VIP, etc." },
  { id: "general", label: "General", hint: "Otro tipo de seguimiento" },
];

/**
 * Helper para inferir la categoría más probable desde el FollowupType.
 * Útil para auto-llenar el campo cuando el creador no lo especifica.
 */
export function inferCategoryFromType(type: FollowupType): FollowupCategory {
  if (type === "sample-feedback") return "sample-feedback";
  if (type === "appointment") return "special-event";
  return "general";
}

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
  /** Por qué se hace este seguimiento — requerido por negocio. */
  category: FollowupCategory;
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
