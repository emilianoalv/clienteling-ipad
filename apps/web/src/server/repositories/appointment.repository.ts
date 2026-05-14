import "server-only";
import type { Appointment, AppointmentId } from "@/types/appointment";
import type { BrandId } from "@/types/brand";
import type { ClientId } from "@/types/client";
import type { StaffId } from "@/types/staff";
import { generateId } from "@/lib/id/generate-id";
import { persistent } from "./_persist";

const BA_ID = "ba-demo-ba" as StaffId;

const SEED: Appointment[] = [
  {
    id: "ap-1" as AppointmentId,
    clientId: "cl-valentina" as ClientId,
    baId: BA_ID,
    brand: "Lancôme",
    at: relativeISO(0, 11, 0),
    durationMin: 60,
    kind: "consultation",
    status: "confirmed",
    notes: "Renovación ritual antiedad",
  },
  {
    id: "ap-2" as AppointmentId,
    clientId: "cl-renata" as ClientId,
    baId: BA_ID,
    brand: "Lancôme",
    at: relativeISO(0, 14, 30),
    durationMin: 45,
    kind: "diagnosis",
    status: "scheduled",
  },
  {
    id: "ap-3" as AppointmentId,
    clientId: "cl-camila" as ClientId,
    baId: BA_ID,
    brand: "YSL",
    at: relativeISO(1, 10, 0),
    durationMin: 60,
    kind: "fragrance-consult",
    status: "confirmed",
  },
  {
    id: "ap-4" as AppointmentId,
    clientId: "cl-paola" as ClientId,
    baId: BA_ID,
    brand: "YSL",
    at: relativeISO(2, 16, 0),
    durationMin: 45,
    kind: "makeup",
    status: "scheduled",
  },
  {
    id: "ap-5" as AppointmentId,
    clientId: "cl-andrea" as ClientId,
    baId: BA_ID,
    brand: "Lancôme",
    at: relativeISO(-1, 12, 0),
    durationMin: 30,
    kind: "product-followup",
    status: "completed",
  },
  {
    id: "ap-6" as AppointmentId,
    clientId: "cl-valentina" as ClientId,
    baId: BA_ID,
    brand: "Lancôme",
    at: relativeISO(-10, 11, 0),
    durationMin: 45,
    kind: "diagnosis",
    status: "rescheduled",
    notes: "Cliente solicitó otra fecha",
    rescheduledAt: relativeISO(-3, 12, 30),
  },
  {
    id: "ap-7" as AppointmentId,
    clientId: "cl-paola" as ClientId,
    baId: BA_ID,
    brand: "YSL",
    at: relativeISO(-14, 13, 0),
    durationMin: 60,
    kind: "fragrance-consult",
    status: "cancelled",
    cancelReason: "Compromiso laboral imprevisto",
    cancelledAt: relativeISO(-15, 9, 0),
  },
  {
    id: "ap-8" as AppointmentId,
    clientId: "cl-camila" as ClientId,
    baId: BA_ID,
    brand: "YSL",
    at: relativeISO(-18, 16, 0),
    durationMin: 90,
    kind: "vip-cabin",
    status: "rescheduled",
    notes: "Cabina ocupada por evento",
    rescheduledAt: relativeISO(-11, 16, 0),
  },
  {
    id: "ap-9" as AppointmentId,
    clientId: "cl-renata" as ClientId,
    baId: BA_ID,
    brand: "Lancôme",
    at: relativeISO(-22, 10, 30),
    durationMin: 45,
    kind: "facial",
    status: "cancelled",
    cancelReason: "Clienta enferma",
    cancelledAt: relativeISO(-22, 8, 0),
  },
  {
    id: "ap-10" as AppointmentId,
    clientId: "cl-andrea" as ClientId,
    baId: BA_ID,
    brand: "Lancôme",
    at: relativeISO(-25, 14, 0),
    durationMin: 30,
    kind: "facial",
    status: "no-show",
  },
];

const APPOINTMENTS: Appointment[] = persistent("__clienteling.appointments", () => [...SEED]);

export interface AppointmentListFilter {
  baId?: StaffId;
  from?: Date;
  to?: Date;
  /**
   * Brand scope of the requesting staff. Mirrors the prototype's `useBrandLock`.
   * Omit to disable scoping (Admin/HQ).
   */
  brands?: readonly BrandId[];
}

export interface AppointmentRepository {
  list(filter?: AppointmentListFilter): Promise<Appointment[]>;
  listByClient(clientId: ClientId): Promise<Appointment[]>;
  findById(id: AppointmentId): Promise<Appointment | null>;
  create(input: Omit<Appointment, "id">): Promise<Appointment>;
  patch(id: AppointmentId, patch: Partial<Omit<Appointment, "id">>): Promise<Appointment | null>;
}

export const appointmentRepository: AppointmentRepository = {
  async list(filter = {}) {
    const scope = filter.brands;
    return APPOINTMENTS.filter((a) => {
      if (filter.baId && a.baId !== filter.baId) return false;
      if (scope && scope.length && !scope.includes(a.brand)) return false;
      const at = new Date(a.at);
      if (filter.from && at < filter.from) return false;
      if (filter.to && at > filter.to) return false;
      return true;
    }).sort((a, b) => a.at.localeCompare(b.at));
  },

  async listByClient(clientId) {
    return APPOINTMENTS.filter((a) => a.clientId === clientId).sort((a, b) =>
      b.at.localeCompare(a.at),
    );
  },

  async findById(id) {
    return APPOINTMENTS.find((a) => a.id === id) ?? null;
  },

  async create(input) {
    const id = generateId("ap") as AppointmentId;
    const appointment: Appointment = { ...input, id };
    APPOINTMENTS.push(appointment);
    return appointment;
  },

  async patch(id, patch) {
    const idx = APPOINTMENTS.findIndex((a) => a.id === id);
    if (idx < 0) return null;
    const current = APPOINTMENTS[idx]!;
    const next: Appointment = { ...current, ...patch };
    APPOINTMENTS[idx] = next;
    return next;
  },
};

function relativeISO(dayDelta: number, hours: number, minutes: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dayDelta);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}
