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
    description: "Felicitar por compra de Absolue (cierre post-venta)",
    dueAt: relativeISO(-3, 11, 0),
    status: "done",
    result: "Respondió con 5★ y agendó cita facial para la próxima semana.",
    completedAt: relativeISO(-3, 12, 15),
    createdAt: relativeISO(-5, 17, 0),
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

const TASKS: FollowupTask[] = persistent("__clienteling.followupTasks.v2", () => [...SEED]);

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
