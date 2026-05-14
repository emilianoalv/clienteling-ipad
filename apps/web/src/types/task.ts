import type { Branded } from "./branded";
import type { ClientId } from "./client";
import type { StaffId } from "./staff";

export type TaskId = Branded<string, "Task">;

export type TaskKind =
  | "sample-followup"
  | "replenishment"
  | "appointment-reminder"
  | "welcome"
  | "birthday-greeting"
  | "custom";

export type TaskPriority = "low" | "normal" | "high";

export interface Task {
  id: TaskId;
  clientId: ClientId;
  baId: StaffId;
  kind: TaskKind;
  due: string;
  priority: TaskPriority;
  doneAt?: string;
}
