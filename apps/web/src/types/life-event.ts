/**
 * Eventos relevantes en la vida de un cliente que justifican un
 * touchpoint proactivo de la BA.
 *
 * Las reposiciones se modelan via FollowupTask (category=replenishment)
 * y viven en el inbox de pendientes — no se duplican aquí. Esta lista
 * solo cubre fechas de calendario (cumpleaños, aniversario como clienta).
 */
export type LifeEventKind = "birthday" | "anniversary";

export interface LifeEvent {
  kind: LifeEventKind;
  /** ISO date the event occurs. */
  date: string;
  /** Negative = overdue, 0 = today, positive = future. */
  daysUntil: number;
  /** Free-form short label (e.g. "Cumpleaños"). */
  label: string;
}
