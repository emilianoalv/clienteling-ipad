import type { FollowupType } from "@/types/followup-task";

export type FollowupContextKind = "purchase" | "sample";

export interface FollowupContext {
  kind: FollowupContextKind;
  /** Nombres de líneas/productos involucrados, en el orden a mostrar. */
  productNames: readonly string[];
}

export interface BuildFollowupDescriptionInput {
  type: FollowupType;
  firstName: string;
  /** Productos comprados (sale) o dados como muestra (visit). Opcional. */
  context?: FollowupContext;
}

/**
 * Arma la descripción sugerida de una tarea de seguimiento adaptándose
 * al tipo elegido (Llamada / WhatsApp / Correo / Feedback muestra /
 * Cita / Otro) y al contexto (¿venta o muestra?, ¿qué productos?).
 *
 * Pura — testable en isolación. El caller decide cuándo recomputar:
 * típicamente cada vez que cambia el tipo y siempre que el usuario no
 * haya editado manualmente la descripción.
 */
export function buildFollowupDescription(input: BuildFollowupDescriptionInput): string {
  const { type, firstName, context } = input;
  const list =
    context && context.productNames.length > 0 ? formatNameList(context.productNames) : null;
  const kind = context?.kind ?? null;

  switch (type) {
    case "call":
      if (list && kind === "purchase")
        return `Llamar a ${firstName} para pedir feedback de su compra: ${list}`;
      if (list && kind === "sample")
        return `Llamar a ${firstName} para pedir feedback de la muestra de ${list}`;
      return `Llamar a ${firstName}`;
    case "whatsapp":
      if (list && kind === "purchase")
        return `Mensaje WhatsApp a ${firstName} sobre su compra de ${list}`;
      if (list && kind === "sample")
        return `Mensaje WhatsApp a ${firstName} pidiendo feedback de la muestra de ${list}`;
      return `Mensaje WhatsApp a ${firstName}`;
    case "email":
      if (list && kind === "purchase") return `Correo a ${firstName} sobre su compra de ${list}`;
      if (list && kind === "sample")
        return `Correo a ${firstName} pidiendo feedback de la muestra de ${list}`;
      return `Correo a ${firstName}`;
    case "sample-feedback":
      if (list && kind === "sample") return `Pedir feedback de la muestra de ${list} a ${firstName}`;
      if (list) return `Pedir feedback de ${list} a ${firstName}`;
      return `Pedir feedback de muestra a ${firstName}`;
    case "appointment":
      if (list && kind === "purchase")
        return `Agendar próxima cita con ${firstName} para evaluar ${list}`;
      if (list && kind === "sample")
        return `Agendar cita con ${firstName} para revisar su experiencia con ${list}`;
      return `Agendar cita con ${firstName}`;
    case "other":
      if (list && kind === "purchase")
        return `Seguimiento con ${firstName} sobre su compra de ${list}`;
      if (list && kind === "sample")
        return `Seguimiento con ${firstName} sobre la muestra de ${list}`;
      return `Seguimiento con ${firstName}`;
  }
}

function formatNameList(names: readonly string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}
