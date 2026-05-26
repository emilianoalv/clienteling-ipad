"use client";

import type { ClientId } from "@/types/client";
import type { FollowupTask } from "@/types/followup-task";
import { TaskInbox } from "../task-inbox";

export interface FollowupTabProps {
  clientId: ClientId;
  tasks: readonly FollowupTask[];
  readOnly?: boolean;
}

/**
 * Tab Seguimientos del perfil del cliente. Es una vista filtrada del
 * mismo TaskInbox que vive en /ba/followup, sólo que en modo
 * "client-scoped": oculta el avatar del cliente en cada row (porque ya
 * estás en su perfil) y muestra un botón "Nueva tarea" para crear
 * directamente desde aquí. Misma UI en ambos lados — cero duplicación.
 *
 * En modo readOnly el inbox se vuelve consulta pura — sin botón de
 * crear tarea ni acciones por fila (Responder / Marcar hecha /
 * Cancelar / Agendar cita). Esto se usa cuando Gerente / Supervisor /
 * Admin abren el perfil para coaching.
 */
export function FollowupTab({ clientId, tasks, readOnly }: FollowupTabProps) {
  return (
    <TaskInbox
      tasks={tasks}
      clientLookup={{}}
      mode="client-scoped"
      clientId={clientId}
      readOnly={readOnly}
    />
  );
}
