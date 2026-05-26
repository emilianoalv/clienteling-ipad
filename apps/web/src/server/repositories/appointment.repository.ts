import "server-only";
import type { Appointment, AppointmentId } from "@/types/appointment";
import type { BrandId } from "@/types/brand";
import type { ClientId } from "@/types/client";
import type { StaffId } from "@/types/staff";
import type { StoreId } from "@/types/store";
import { generateId } from "@/lib/id/generate-id";
import { persistent } from "./_persist";

// Match user.repository.ts and seed.ts IDs.
const BA_POL_LCM_1 = "us-ba-pol-lcm-1" as StaffId;
const BA_POL_LCM_2 = "us-ba-pol-lcm-2" as StaffId;
const BA_POL_YSL_1 = "us-ba-pol-ysl-1" as StaffId;
const BA_POL_YSL_2 = "us-ba-pol-ysl-2" as StaffId;
const BA_PER_LCM_1 = "us-ba-per-lcm-1" as StaffId;
const BA_PER_LCM_2 = "us-ba-per-lcm-2" as StaffId;
const BA_PER_YSL_1 = "us-ba-per-ysl-1" as StaffId;
const BA_PER_YSL_2 = "us-ba-per-ysl-2" as StaffId;
const BA_STF_LCM_1 = "us-ba-stf-lcm-1" as StaffId;
const BA_STF_LCM_2 = "us-ba-stf-lcm-2" as StaffId;
const BA_STF_YSL_1 = "us-ba-stf-ysl-1" as StaffId;
const BA_STF_YSL_2 = "us-ba-stf-ysl-2" as StaffId;
const ST_POL = "st-pol" as StoreId;
const ST_PER = "st-per" as StoreId;
const ST_STF = "st-stf" as StoreId;

const SEED: Appointment[] = [
  // ── Polanco ─────────────────────────────────────────────────────────────
  {
    id: "ap-1" as AppointmentId,
    clientId: "cl-constanza" as ClientId,
    baId: BA_POL_LCM_1,
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
    clientId: "cl-ofelia" as ClientId,
    baId: BA_POL_LCM_2,
    brand: "Lancôme",
    storeId: ST_POL,
    at: relativeISO(0, 14, 30),
    durationMin: 45,
    kind: "diagnosis",
    status: "scheduled",
  },
  {
    id: "ap-3" as AppointmentId,
    clientId: "cl-constanza" as ClientId,
    baId: BA_POL_YSL_1,
    brand: "YSL",
    storeId: ST_POL,
    at: relativeISO(1, 10, 0),
    durationMin: 60,
    kind: "fragrance-consult",
    status: "confirmed",
    notes: "Cita YSL (mismo cliente multi-brand, otro BA).",
  },
  {
    id: "ap-4" as AppointmentId,
    clientId: "cl-adriana" as ClientId,
    baId: BA_POL_YSL_2,
    brand: "YSL",
    storeId: ST_POL,
    at: relativeISO(2, 16, 0),
    durationMin: 45,
    kind: "makeup",
    status: "scheduled",
  },
  {
    id: "ap-5" as AppointmentId,
    clientId: "cl-lorena" as ClientId,
    baId: BA_POL_LCM_1,
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
    clientId: "cl-cristina" as ClientId,
    baId: BA_PER_LCM_1,
    brand: "Lancôme",
    storeId: ST_PER,
    at: relativeISO(0, 9, 30),
    durationMin: 60,
    kind: "consultation",
    status: "confirmed",
  },
  {
    id: "ap-7" as AppointmentId,
    clientId: "cl-gabriela" as ClientId,
    baId: BA_PER_YSL_1,
    brand: "YSL",
    storeId: ST_PER,
    at: relativeISO(1, 13, 0),
    durationMin: 60,
    kind: "fragrance-consult",
    status: "scheduled",
  },
  {
    id: "ap-8" as AppointmentId,
    clientId: "cl-julieta" as ClientId,
    baId: BA_PER_YSL_2,
    brand: "YSL",
    storeId: ST_PER,
    at: relativeISO(-3, 15, 0),
    durationMin: 45,
    kind: "diagnosis",
    status: "completed",
  },
  {
    id: "ap-9" as AppointmentId,
    clientId: "cl-ines" as ClientId,
    baId: BA_PER_YSL_2,
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
    clientId: "cl-karla" as ClientId,
    baId: BA_STF_LCM_1,
    brand: "Lancôme",
    storeId: ST_STF,
    at: relativeISO(0, 17, 0),
    durationMin: 90,
    kind: "vip-cabin",
    status: "confirmed",
  },
  {
    id: "ap-11" as AppointmentId,
    clientId: "cl-marina" as ClientId,
    baId: BA_STF_LCM_2,
    brand: "Lancôme",
    storeId: ST_STF,
    at: relativeISO(2, 11, 0),
    durationMin: 45,
    kind: "facial",
    status: "scheduled",
  },
  {
    id: "ap-12" as AppointmentId,
    clientId: "cl-nadia" as ClientId,
    baId: BA_STF_YSL_1,
    brand: "YSL",
    storeId: ST_STF,
    at: relativeISO(-5, 14, 0),
    durationMin: 30,
    kind: "product-followup",
    status: "completed",
  },
  // ── ABSOLUTE appointments for deterministic dashboard tests ───────────────
  // Concentrated in PER × LCM (Andrea) so a single baId filter exposes them
  // in isolation, without interference from the "live demo" relativeISO ones.
  {
    id: "ap-13" as AppointmentId,
    clientId: "cl-elena" as ClientId,
    baId: BA_PER_LCM_2, // Andrea
    brand: "Lancôme",
    storeId: ST_PER,
    at: "2026-04-15T10:00:00.000Z",
    durationMin: 45,
    kind: "diagnosis",
    status: "scheduled",
  },
  {
    id: "ap-14" as AppointmentId,
    clientId: "cl-cristina" as ClientId,
    baId: BA_PER_LCM_2, // Andrea
    brand: "Lancôme",
    storeId: ST_PER,
    at: "2026-04-15T15:00:00.000Z",
    durationMin: 60,
    kind: "consultation",
    status: "confirmed",
  },
  {
    id: "ap-15" as AppointmentId,
    clientId: "cl-elena" as ClientId,
    baId: BA_PER_LCM_2, // Andrea
    brand: "Lancôme",
    storeId: ST_PER,
    at: "2026-04-20T11:00:00.000Z",
    durationMin: 45,
    kind: "facial",
    status: "rescheduled",
    rescheduledAt: "2026-04-12T16:00:00.000Z",
  },
  {
    id: "ap-16" as AppointmentId,
    clientId: "cl-cristina" as ClientId,
    baId: BA_PER_LCM_2, // Andrea
    brand: "Lancôme",
    storeId: ST_PER,
    at: "2026-04-22T14:00:00.000Z",
    durationMin: 30,
    kind: "makeup",
    status: "cancelled",
    cancelReason: "Conflicto de agenda",
    cancelledAt: "2026-04-18T09:00:00.000Z",
  },
  // ── Citas YSL del catálogo expandido — variedad de tipos ────────────────
  {
    id: "ap-17" as AppointmentId,
    clientId: "cl-rocio" as ClientId,
    baId: BA_STF_YSL_2,
    brand: "YSL",
    storeId: ST_STF,
    at: relativeISO(1, 16, 30),
    durationMin: 60,
    kind: "fragrance-consult",
    status: "confirmed",
    notes: "Probar Y EDP y MYSLF — interés masculino (regalo).",
  },
  {
    id: "ap-18" as AppointmentId,
    clientId: "cl-gabriela" as ClientId,
    baId: BA_PER_YSL_2,
    brand: "YSL",
    storeId: ST_PER,
    at: relativeISO(2, 11, 0),
    durationMin: 90,
    kind: "vip-cabin",
    status: "confirmed",
    notes: "Sesión privada Or Rouge + Pure Shots — cliente Atelier.",
  },
  {
    id: "ap-19" as AppointmentId,
    clientId: "cl-julieta" as ClientId,
    baId: BA_PER_YSL_1,
    brand: "YSL",
    storeId: ST_PER,
    at: relativeISO(3, 13, 30),
    durationMin: 45,
    kind: "makeup",
    status: "scheduled",
    notes: "Look completo con Tatouage Couture + Lash Clash + Touche Éclat.",
  },

  // ── Citas para nuevos clientes — 1 por BA para llenar agenda ───────────
  {
    id: "ap-20" as AppointmentId,
    clientId: "cl-mariana-pol" as ClientId,
    baId: BA_POL_LCM_1,
    brand: "Lancôme",
    storeId: ST_POL,
    at: relativeISO(1, 13, 0),
    durationMin: 45,
    kind: "consultation",
    status: "confirmed",
    notes: "Primera consulta skincare completa.",
  },
  {
    id: "ap-21" as AppointmentId,
    clientId: "cl-monica-pol" as ClientId,
    baId: BA_POL_LCM_2,
    brand: "Lancôme",
    storeId: ST_POL,
    at: relativeISO(4, 16, 0),
    durationMin: 90,
    kind: "vip-cabin",
    status: "confirmed",
    notes: "Cabina VIP Atelier — sesión Absolue completa.",
  },
  {
    id: "ap-22" as AppointmentId,
    clientId: "cl-vanessa-pol" as ClientId,
    baId: BA_POL_YSL_1,
    brand: "YSL",
    storeId: ST_POL,
    at: relativeISO(2, 17, 30),
    durationMin: 60,
    kind: "fragrance-consult",
    status: "scheduled",
    notes: "Explorar Black Opium + Libre.",
  },
  {
    id: "ap-23" as AppointmentId,
    clientId: "cl-paloma-pol" as ClientId,
    baId: BA_POL_YSL_2,
    brand: "YSL",
    storeId: ST_POL,
    at: relativeISO(5, 15, 0),
    durationMin: 45,
    kind: "makeup",
    status: "confirmed",
    notes: "Probar Tatouage Couture nuevas tonalidades.",
  },
  {
    id: "ap-24" as AppointmentId,
    clientId: "cl-veronica-per" as ClientId,
    baId: BA_PER_LCM_1,
    brand: "Lancôme",
    storeId: ST_PER,
    at: relativeISO(3, 11, 30),
    durationMin: 60,
    kind: "facial",
    status: "confirmed",
    notes: "Facial Absolue + diagnóstico.",
  },
  {
    id: "ap-25" as AppointmentId,
    clientId: "cl-natalia-per" as ClientId,
    baId: BA_PER_LCM_2,
    brand: "Lancôme",
    storeId: ST_PER,
    at: relativeISO(6, 14, 0),
    durationMin: 90,
    kind: "vip-cabin",
    status: "confirmed",
    notes: "Sesión Atelier — rutina antiedad personalizada.",
  },
  {
    id: "ap-26" as AppointmentId,
    clientId: "cl-yolanda-per" as ClientId,
    baId: BA_PER_YSL_1,
    brand: "YSL",
    storeId: ST_PER,
    at: relativeISO(4, 16, 30),
    durationMin: 60,
    kind: "fragrance-consult",
    status: "confirmed",
    notes: "Repaso a Libre + presentar Y EDP edición limitada.",
  },
  {
    id: "ap-27" as AppointmentId,
    clientId: "cl-jessica-per" as ClientId,
    baId: BA_PER_YSL_2,
    brand: "YSL",
    storeId: ST_PER,
    at: relativeISO(2, 14, 30),
    durationMin: 45,
    kind: "makeup",
    status: "scheduled",
    notes: "Look con Lash Clash + Tatouage Couture.",
  },
  {
    id: "ap-28" as AppointmentId,
    clientId: "cl-tatiana-stf" as ClientId,
    baId: BA_STF_LCM_1,
    brand: "Lancôme",
    storeId: ST_STF,
    at: relativeISO(1, 16, 0),
    durationMin: 60,
    kind: "consultation",
    status: "confirmed",
    notes: "Ajustar rutina con Hydra Zen + recomendar Génifique.",
  },
  {
    id: "ap-29" as AppointmentId,
    clientId: "cl-laura-stf" as ClientId,
    baId: BA_STF_LCM_2,
    brand: "Lancôme",
    storeId: ST_STF,
    at: relativeISO(5, 13, 0),
    durationMin: 90,
    kind: "vip-cabin",
    status: "confirmed",
    notes: "Cabina VIP aniversario — selección completa Absolue.",
  },
  {
    id: "ap-30" as AppointmentId,
    clientId: "cl-luisa-stf" as ClientId,
    baId: BA_STF_YSL_1,
    brand: "YSL",
    storeId: ST_STF,
    at: relativeISO(3, 17, 0),
    durationMin: 45,
    kind: "makeup",
    status: "scheduled",
    notes: "Probar Tatouage en tonos nude.",
  },
  {
    id: "ap-31" as AppointmentId,
    clientId: "cl-bertha-stf" as ClientId,
    baId: BA_STF_YSL_2,
    brand: "YSL",
    storeId: ST_STF,
    at: relativeISO(7, 11, 0),
    durationMin: 90,
    kind: "vip-cabin",
    status: "confirmed",
    notes: "Cabina YSL VIP — exploración fragancia + cuidado completo.",
  },
];

const APPOINTMENTS: Appointment[] = persistent("__clienteling.appointments.v6", () => [...SEED]);

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
  /** ARCO cascade — borra todas las citas de un cliente. */
  deleteByClient(clientId: ClientId): Promise<number>;
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

  async deleteByClient(clientId) {
    let removed = 0;
    for (let i = APPOINTMENTS.length - 1; i >= 0; i--) {
      if (APPOINTMENTS[i]!.clientId === clientId) {
        APPOINTMENTS.splice(i, 1);
        removed++;
      }
    }
    return removed;
  },
};

function relativeISO(dayDelta: number, hours: number, minutes: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dayDelta);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}
