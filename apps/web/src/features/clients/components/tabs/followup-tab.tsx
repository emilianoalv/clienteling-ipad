"use client";

import type { ClientId } from "@/types/client";
import type { FollowupTask } from "@/types/followup-task";
import { TaskInbox } from "../task-inbox";

export interface FollowupTabProps {
  clientId: ClientId;
  tasks: readonly FollowupTask[];
}

/**
 * Tab Seguimientos del perfil del cliente. Es una vista filtrada del
 * mismo TaskInbox que vive en /ba/followup, sólo que en modo
 * "client-scoped": oculta el avatar del cliente en cada row (porque ya
 * estás en su perfil) y muestra un botón "Nueva tarea" para crear
 * directamente desde aquí. Misma UI en ambos lados — cero duplicación.
 */
export function FollowupTab({ clientId, tasks }: FollowupTabProps) {
  return (
    <TaskInbox
      tasks={tasks}
      clientLookup={{}}
      mode="client-scoped"
      clientId={clientId}
    />
  );
}
