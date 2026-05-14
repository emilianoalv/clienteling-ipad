import type { Sku } from "./product";

export type LifeEventKind = "birthday" | "anniversary" | "replenishment";

export interface LifeEvent {
  kind: LifeEventKind;
  /** ISO date the event occurs. */
  date: string;
  /** Negative = overdue, 0 = today, positive = future. */
  daysUntil: number;
  /** Free-form short label (e.g. "Cumpleaños", "Posible reposición · Or Rouge"). */
  label: string;
  /** Optional metadata depending on `kind`. */
  meta?: { sku?: Sku; productName?: string };
}
