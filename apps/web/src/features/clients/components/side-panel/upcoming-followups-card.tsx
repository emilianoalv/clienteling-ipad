import Link from "next/link";
import type { FollowupTask, FollowupType } from "@/types/followup-task";
import type { ClientId } from "@/types/client";
import { Card } from "@/components/patterns";
import { Icon } from "@/components/primitives";
import type { IconName } from "@/types/icon";
import { CategoryChip } from "../_parts/category-chip";

const TYPE_ICON: Record<FollowupType, IconName> = {
  call: "device",
  whatsapp: "whatsapp",
  email: "email",
  "sample-feedback": "gift",
  appointment: "calendar",
  other: "more",
};

const PREVIEW_COUNT = 3;

export interface UpcomingFollowupsCardProps {
  clientId: ClientId;
  tasks: readonly FollowupTask[];
}

/**
 * Side panel card on the client profile. Shows the next 3 pending tasks
 * for this client, ordered by due date. Links to the full Seguimientos
 * tab when there's more.
 */
export function UpcomingFollowupsCard({ clientId, tasks }: UpcomingFollowupsCardProps) {
  const pending = tasks
    .filter((t) => t.status === "pending")
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const preview = pending.slice(0, PREVIEW_COUNT);

  return (
    <Card>
      <div className="flex items-baseline justify-between gap-2 mb-2.5">
        <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          Próximos seguimientos
        </span>
        {pending.length > 0 ? (
          <span className="text-[13.5px] text-ink/60 tabular">{pending.length}</span>
        ) : null}
      </div>

      {preview.length === 0 ? (
        <p className="m-0 text-[14.5px] text-ink/60 leading-snug">
          Sin tareas pendientes para este cliente.
        </p>
      ) : (
        <ul className="list-none m-0 p-0 flex flex-col gap-2">
          {preview.map((task) => (
            <li
              key={task.id}
              className="grid grid-cols-[32px_minmax(0,1fr)_auto] gap-2.5 items-start px-2.5 py-2 rounded-md bg-bone"
            >
              <span
                aria-hidden
                className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-white text-ink/70 mt-0.5"
              >
                <Icon name={TYPE_ICON[task.type]} size={14} />
              </span>
              <div className="min-w-0 flex flex-col gap-1">
                <CategoryChip category={task.category} size="sm" />
                <span className="text-[14px] font-semibold leading-tight line-clamp-2">
                  {task.description}
                </span>
              </div>
              <span
                className={`text-[12.5px] tabular mt-1 ${
                  isOverdue(task.dueAt) ? "text-err font-semibold" : "text-ink/60"
                }`}
              >
                {relativeDue(task.dueAt)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {pending.length > PREVIEW_COUNT ? (
        <div className="mt-2.5">
          <Link
            href={`/ba/clients/${clientId}?tab=followup`}
            className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-ink hover:text-ink/80 no-underline"
          >
            Ver todos
            <Icon name="arrow-right" size={12} />
          </Link>
        </div>
      ) : null}
    </Card>
  );
}

function isOverdue(iso: string): boolean {
  return new Date(iso).getTime() < new Date().setHours(0, 0, 0, 0);
}

function relativeDue(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diffDays === 0) return "hoy";
  if (diffDays === 1) return "mañana";
  if (diffDays === -1) return "ayer";
  if (diffDays < 0) return `${-diffDays}d vencido`;
  if (diffDays < 7) return `en ${diffDays}d`;
  if (diffDays < 30) return `en ${Math.round(diffDays / 7)} sem`;
  return `en ${Math.round(diffDays / 30)} meses`;
}
