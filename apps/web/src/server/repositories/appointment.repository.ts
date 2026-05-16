import "server-only";
import type { Appointment, AppointmentId } from "@/types/appointment";
import type { BrandId } from "@/types/brand";
import type { ClientId } from "@/types/client";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import { generateId } from "@/lib/id/generate-id";
import { persistent } from "./_persist";

// Match user.repository.ts and seed.ts IDs.
const BA_POL_1 = "us-ba-pol-1" as StaffId;
const BA_POL_2 = "us-ba-pol-2" as StaffId;
const BA_PER_1 = "us-ba-per-1" as StaffId;
const BA_PER_2 = "us-ba-per-2" as StaffId;
const BA_STF_1 = "us-ba-stf-1" as StaffId;
const BA_STF_2 = "us-ba-stf-2" as StaffId;
const ST_POL = "st-pol" as StoreId;
const ST_PER = "st-per" as StoreId;
const ST_STF = "st-stf" as StoreId;

const SEED: Appointment[] = [
  // ── Polanco ─────────────────────────────────────────────────────────────
  {
    id: "ap-1" as AppointmentId,
    clientId: "cl-valentina" as ClientId,
    baId: BA_POL_1,
    brand: "Lancôme",
    storeId: ST_POL,
    at: relativeISO(0, 11, 0),
    durationMin: 60,
    kind: "consultation",
    status: "confirmed",
    notes: "Renovación ritual antiedad",
  },
  {
    id: "ap-2" as AppointmentId,
    clientId: "cl-renata" as ClientId,
    baId: BA_POL_1,
    brand: "Lancôme",
    storeId: ST_POL,
    at: relativeISO(0, 14, 30),
    durationMin: 45,
    kind: "diagnosis",
    status: "scheduled",
  },
  {
    id: "ap-3" as AppointmentId,
    clientId: "cl-camila" as ClientId,
    baId: BA_POL_2,
    brand: "YSL",
    storeId: ST_POL,
    at: relativeISO(1, 10, 0),
    durationMin: 60,
    kind: "fragrance-consult",
    status: "confirmed",
  },
  {
    id: "ap-4" as AppointmentId,
    clientId: "cl-emilia" as ClientId,
    baId: BA_POL_2,
    brand: "YSL",
    storeId: ST_POL,
    at: relativeISO(2, 16, 0),
    durationMin: 45,
    kind: "makeup",
    status: "scheduled",
  },
  {
    id: "ap-5" as AppointmentId,
    clientId: "cl-andrea" as ClientId,
    baId: BA_POL_1,
    brand: "Lancôme",
    storeId: ST_POL,
    at: relativeISO(-1, 12, 0),
    durationMin: 30,
    kind: "product-followup",
    status: "completed",
  },

  // ── Perisur ─────────────────────────────────────────────────────────────
  {
    id: "ap-6" as AppointmentId,
    clientId: "cl-natalia" as ClientId,
    baId: BA_PER_1,
    brand: "Lancôme",
    storeId: ST_PER,
    at: relativeISO(0, 9, 30),
    durationMin: 60,
    kind: "consultation",
    status: "confirmed",
  },
  {
    id: "ap-7" as AppointmentId,
    clientId: "cl-paola" as ClientId,
    baId: BA_PER_1,
    brand: "YSL",
    storeId: ST_PER,
    at: relativeISO(1, 13, 0),
    durationMin: 60,
    kind: "fragrance-consult",
    status: "scheduled",
  },
  {
    id: "ap-8" as AppointmentId,
    clientId: "cl-isabella" as ClientId,
    baId: BA_PER_2,
    brand: "Lancôme",
    storeId: ST_PER,
    at: relativeISO(-3, 15, 0),
    durationMin: 45,
    kind: "diagnosis",
    status: "completed",
  },
  {
    id: "ap-9" as AppointmentId,
    clientId: "cl-mariana" as ClientId,
    baId: BA_PER_2,
    brand: "YSL",
    storeId: ST_PER,
    at: relativeISO(-7, 12, 30),
    durationMin: 30,
    kind: "makeup",
    status: "cancelled",
    cancelReason: "Cliente sin disponibilidad",
    cancelledAt: relativeISO(-8, 18, 0),
  },

  // ── Santa Fe ────────────────────────────────────────────────────────────
  {
    id: "ap-10" as AppointmentId,
    clientId: "cl-sofia" as ClientId,
    baId: BA_STF_1,
    brand: "Lancôme",
    storeId: ST_STF,
    at: relativeISO(0, 17, 0),
    durationMin: 90,
    kind: "vip-cabin",
    status: "confirmed",
  },
  {
    id: "ap-11" as AppointmentId,
    clientId: "cl-fernanda" as ClientId,
    baId: BA_STF_1,
    brand: "Lancôme",
    storeId: ST_STF,
    at: relativeISO(2, 11, 0),
    durationMin: 45,
    kind: "facial",
    status: "scheduled",
  },
  {
    id: "ap-12" as AppointmentId,
    clientId: "cl-victoria" as ClientId,
    baId: BA_STF_2,
    brand: "YSL",
    storeId: ST_STF,
    at: relativeISO(-5, 14, 0),
    durationMin: 30,
    kind: "product-followup",
    status: "completed",
  },
];

const APPOINTMENTS: Appointment[] = persistent("__clienteling.appointments.v2", () => [...SEED]);

export interface AppointmentListFilter {
  baId?: StaffId;
  from?: Date;
  to?: Date;
  /**
   * Brand scope of the requesting staff. Mirrors the prototype's `useBrandLock`.
   * Omit to disable scoping (Admin/HQ).
   */
  brands?: readonly BrandId[];
  /**
   * Store scope of the requesting staff. Use `visibleStoreIds(staff, allStoreIds)`
   * to compute. Omit to disable scoping (Admin/HQ).
   */
  storeIds?: readonly StoreId[];
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
    const brandScope = filter.brands;
    const storeScope = filter.storeIds;
    return APPOINTMENTS.filter((a) => {
      if (filter.baId && a.baId !== filter.baId) return false;
      if (brandScope && brandScope.length && !brandScope.includes(a.brand)) return false;
      if (storeScope && storeScope.length && !storeScope.includes(a.storeId)) return false;
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
