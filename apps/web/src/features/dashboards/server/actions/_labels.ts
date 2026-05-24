import "server-only";

import type { FollowupType } from "@/types/followup-task";
import type { AppointmentKind, AppointmentStatus } from "@/types/appointment";

export function followupTypeLabel(type: FollowupType): string {
  switch (type) {
    case "call":
      return "Llamada";
    case "whatsapp":
      return "WhatsApp";
    case "email":
      return "Email";
    case "sample-feedback":
      return "Feedback de muestra";
    case "appointment":
      return "Cita";
    case "other":
      return "Otro";
  }
}

export function appointmentKindLabel(kind: AppointmentKind): string {
  switch (kind) {
    case "ritual":
      return "Servicio de Cabina";
    case "makeup":
      return "Maquillaje";
    case "diagnosis":
      return "Diagnóstico";
    case "consultation":
      return "Consulta";
    case "vip-cabin":
      return "Cabina VIP";
    case "facial":
      return "Facial";
    case "anniversary-event":
      return "Evento aniversario";
    case "product-followup":
      return "Seguimiento de producto";
    case "fragrance-consult":
      return "Consulta de fragancia";
    case "other":
      return "Otro";
  }
}

export function appointmentStatusLabel(status: AppointmentStatus): string {
  switch (status) {
    case "scheduled":
      return "Programada";
    case "confirmed":
      return "Confirmada";
    case "completed":
      return "Completada";
    case "rescheduled":
      return "Reagendada";
    case "cancelled":
      return "Cancelada";
    case "no-show":
      return "No asistió";
  }
}
