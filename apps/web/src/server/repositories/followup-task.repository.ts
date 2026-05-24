import "server-only";
import type {
  FollowupStatus,
  FollowupTask,
  FollowupTaskId,
  FollowupType,
} from "@/types/followup-task";
import type { ClientId } from "@/types/client";
import type { StaffId } from "@/types/staff";
import { generateId } from "@/lib/id/generate-id";
import { persistent } from "./_persist";

// BAs reales del seed post-refactor (ver user.repository.ts).
const BA_POL_LCM_1 = "us-ba-pol-lcm-1" as StaffId; // Valentina Ríos
const BA_POL_LCM_2 = "us-ba-pol-lcm-2" as StaffId; // Fernanda Oliveros
const BA_PER_YSL_1 = "us-ba-per-ysl-1" as StaffId; // Lucía Cabrera
const BA_STF_LCM_1 = "us-ba-stf-lcm-1" as StaffId; // Renata Salazar
const BA_STF_LCM_2 = "us-ba-stf-lcm-2" as StaffId; // Ximena Pereda

function relativeISO(dayDelta: number, hours = 10, minutes = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + dayDelta);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

/**
 * Seed five tasks covering every state the inbox needs to render: overdue,
 * due today, upcoming, and one already completed (with a result).
 */
const SEED: FollowupTask[] = [
  {
    id: "ft-01" as FollowupTaskId,
    clientId: "cl-ofelia" as ClientId, // Polanco · Lancôme
    baId: BA_POL_LCM_2,
    type: "call",
    category: "birthday",
    description: "Llamar por cumpleaños (saludo + ofrecer promo Absolue)",
    dueAt: relativeISO(-1, 11, 0),
    status: "pending",
    createdAt: relativeISO(-3, 9, 0),
  },
  {
    id: "ft-02" as FollowupTaskId,
    clientId: "cl-constanza" as ClientId, // Polanco · multi-brand
    baId: BA_POL_LCM_1,
    type: "call",
    category: "sample-feedback",
    description: "Pedir feedback de muestra Génifique entregada en visita",
    dueAt: relativeISO(0, 12, 0),
    status: "pending",
    createdAt: relativeISO(-7, 14, 30),
  },
  {
    id: "ft-03" as FollowupTaskId,
    clientId: "cl-gabriela" as ClientId, // Perisur · YSL
    baId: BA_PER_YSL_1,
    type: "sample-feedback",
    category: "sample-feedback",
    description: "Mensaje WA: ¿cómo le va con la muestra de Libre Eau de Parfum?",
    dueAt: relativeISO(1, 15, 0),
    status: "pending",
    createdAt: relativeISO(-4, 16, 0),
  },
  {
    id: "ft-04" as FollowupTaskId,
    clientId: "cl-karla" as ClientId, // Santa Fe · multi-brand
    baId: BA_STF_LCM_1,
    type: "whatsapp",
    category: "special-event",
    description: "Mandar info de Rénergie H.C.F. y disponibilidad en tienda",
    dueAt: relativeISO(3, 10, 30),
    status: "pending",
    createdAt: relativeISO(0, 8, 0),
  },
  {
    id: "ft-05" as FollowupTaskId,
    clientId: "cl-marina" as ClientId, // Santa Fe · Lancôme
    baId: BA_STF_LCM_2,
    type: "whatsapp",
    category: "post-purchase",
    description: "Felicitar por compra de Absolue (cierre post-venta)",
    dueAt: relativeISO(-3, 11, 0),
    status: "done",
    result: "Respondió con 5★ y agendó cita facial para la próxima semana.",
    completedAt: relativeISO(-3, 12, 15),
    createdAt: relativeISO(-5, 17, 0),
  },
  // Two completed tasks with ABSOLUTE timestamps so dashboard queries can be
  // tested deterministically against fixed periods (e.g. April 2026). The
  // tasks above use relativeISO so the "inbox demo" feels live.
  {
    id: "ft-06" as FollowupTaskId,
    clientId: "cl-constanza" as ClientId, // Polanco · multi-brand
    baId: BA_POL_LCM_1,
    type: "call",
    category: "replenishment",
    description: "Confirmar disponibilidad de Absolue para reposición",
    dueAt: "2026-04-15T11:00:00.000Z",
    status: "done",
    result: "Confirmó compra para próxima semana.",
    completedAt: "2026-04-15T13:30:00.000Z",
    createdAt: "2026-04-10T09:00:00.000Z",
  },
  {
    id: "ft-07" as FollowupTaskId,
    clientId: "cl-gabriela" as ClientId, // Perisur · YSL
    baId: BA_PER_YSL_1,
    type: "whatsapp",
    category: "sample-feedback",
    description: "Feedback de muestra Libre Le Parfum",
    dueAt: "2026-04-22T15:00:00.000Z",
    status: "done",
    result: "Le encantó; pidió travel size.",
    completedAt: "2026-04-22T16:45:00.000Z",
    createdAt: "2026-04-15T10:00:00.000Z",
  },
  // ft-08: completed by Ximena (BA_STF_LCM_2). The matching revisita
  // is int-20 — by RENATA, the OTHER LCM BA in Santa Fe. Exercises
  // "any BA in the same counter counts as revisita".
  {
    id: "ft-08" as FollowupTaskId,
    clientId: "cl-marina" as ClientId, // Santa Fe · Lancôme
    baId: BA_STF_LCM_2,
    type: "call",
    category: "special-event",
    description: "Confirmar siguiente cita facial",
    dueAt: "2026-04-30T09:00:00.000Z",
    status: "done",
    result: "Reagendó para la próxima semana.",
    completedAt: "2026-04-30T10:00:00.000Z",
    createdAt: "2026-04-25T18:00:00.000Z",
  },
  // ── PENDING tasks with ABSOLUTE dueAt for deterministic tests of
  //    getPendingFollowups (overdue vs upcoming grouping). All in PER × LCM
  //    counter so a single BA-scope filter exposes them in isolation
  //    (avoids interference from the four pending tasks above that use
  //    relativeISO for the "live inbox" demo).
  {
    id: "ft-09" as FollowupTaskId,
    clientId: "cl-elena" as ClientId,
    baId: "us-ba-per-lcm-2" as StaffId, // Andrea
    type: "call",
    category: "birthday",
    description: "Confirmar cumpleaños (re-engagement)",
    dueAt: "2026-04-15T11:00:00.000Z", // overdue against May 1 anchor
    status: "pending",
    createdAt: "2026-04-10T09:00:00.000Z",
  },
  {
    id: "ft-10" as FollowupTaskId,
    clientId: "cl-elena" as ClientId,
    baId: "us-ba-per-lcm-1" as StaffId, // Regina
    type: "whatsapp",
    category: "sample-feedback",
    description: "Pedir feedback de muestra Hydrating",
    dueAt: "2026-04-22T14:00:00.000Z", // overdue, later than ft-09
    status: "pending",
    createdAt: "2026-04-15T10:00:00.000Z",
  },
  {
    id: "ft-11" as FollowupTaskId,
    clientId: "cl-cristina" as ClientId,
    baId: "us-ba-per-lcm-1" as StaffId, // Regina
    type: "call",
    category: "special-event",
    description: "Llamar para invitar a evento Absolue",
    dueAt: "2026-05-10T16:00:00.000Z", // upcoming
    status: "pending",
    createdAt: "2026-04-28T12:00:00.000Z",
  },
];

export interface FollowupTaskListFilter {
  status?: FollowupStatus;
  /** Tasks due strictly before this ISO datetime. */
  dueBefore?: string;
  type?: FollowupType;
}

export interface FollowupTaskRepository {
  list(filter?: FollowupTaskListFilter): Promise<FollowupTask[]>;
  listByClient(clientId: ClientId): Promise<FollowupTask[]>;
  listByBA(baId: StaffId, filter?: FollowupTaskListFilter): Promise<FollowupTask[]>;
  findById(id: FollowupTaskId): Promise<FollowupTask | null>;
  create(
    input: Omit<FollowupTask, "id" | "status" | "createdAt">,
  ): Promise<FollowupTask>;
  complete(id: FollowupTaskId, result: string): Promise<FollowupTask | null>;
  cancel(id: FollowupTaskId): Promise<FollowupTask | null>;
}

const TASKS: FollowupTask[] = persistent("__clienteling.followupTasks.v3", () => [...SEED]);

function matches(t: FollowupTask, f: FollowupTaskListFilter): boolean {
  if (f.status && t.status !== f.status) return false;
  if (f.type && t.type !== f.type) return false;
  if (f.dueBefore && t.dueAt >= f.dueBefore) return false;
  return true;
}

function sortByDue(a: FollowupTask, b: FollowupTask): number {
  return a.dueAt.localeCompare(b.dueAt);
}

export const followupTaskRepository: FollowupTaskRepository = {
  async list(filter = {}) {
    return TASKS.filter((t) => matches(t, filter)).sort(sortByDue);
  },

  async listByClient(clientId) {
    return TASKS.filter((t) => t.clientId === clientId).sort(sortByDue);
  },

  async listByBA(baId, filter = {}) {
    return TASKS.filter((t) => t.baId === baId && matches(t, filter)).sort(sortByDue);
  },

  async findById(id) {
    return TASKS.find((t) => t.id === id) ?? null;
  },

  async create(input) {
    const id = generateId("ft") as FollowupTaskId;
    const task: FollowupTask = {
      ...input,
      id,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    TASKS.unshift(task);
    return task;
  },

  async complete(id, result) {
    const idx = TASKS.findIndex((t) => t.id === id);
    if (idx < 0) return null;
    const current = TASKS[idx]!;
    const next: FollowupTask = {
      ...current,
      status: "done",
      result,
      completedAt: new Date().toISOString(),
    };
    TASKS[idx] = next;
    return next;
  },

  async cancel(id) {
    const idx = TASKS.findIndex((t) => t.id === id);
    if (idx < 0) return null;
    const current = TASKS[idx]!;
    const next: FollowupTask = {
      ...current,
      status: "cancelled",
      completedAt: new Date().toISOString(),
    };
    TASKS[idx] = next;
    return next;
  },
};
