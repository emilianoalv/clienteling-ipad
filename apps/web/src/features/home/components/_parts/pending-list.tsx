import Link from "next/link";
import type {
  FollowupTask,
  FollowupType,
} from "@/types/followup-task";
import type { IconName } from "@/types/icon";
import { Icon } from "@/components/primitives";
import { cn } from "@/lib/cn";

const TYPE_ICON: Record<FollowupType, IconName> = {
  call: "device",
  whatsapp: "whatsapp",
  email: "email",
  "sample-feedback": "gift",
  appointment: "calendar",
  other: "more",
};

const TYPE_CTA: Record<FollowupType, string> = {
  call: "Llamar",
  whatsapp: "Enviar WA",
  email: "Mandar mail",
  "sample-feedback": "Pedir feedback",
  appointment: "Confirmar",
  other: "Atender",
};

const PREVIEW_COUNT = 5;

type Urgency = "overdue" | "today" | "week" | "later";

interface DerivedTask {
  task: FollowupTask;
  urgency: Urgency;
  hint: string;
}

function classify(task: FollowupTask, now: number): DerivedTask {
  const due = new Date(task.dueAt).setHours(0, 0, 0, 0);
  const diffDays = Math.round((due - now) / 86_400_000);
  if (diffDays < 0) return { task, urgency: "overdue", hint: `${-diffDays}d vencida` };
  if (diffDays === 0) return { task, urgency: "today", hint: "Hoy" };
  if (diffDays === 1) return { task, urgency: "week", hint: "Mañana" };
  if (diffDays < 7) return { task, urgency: "week", hint: `+${diffDays}d` };
  return { task, urgency: "later", hint: `+${diffDays}d` };
}

const TONE_DOT: Record<Urgency, string> = {
  overdue: "bg-err",
  today: "bg-warn",
  week: "bg-warn",
  later: "bg-ok",
};

export interface PendingListProps {
  tasks: readonly FollowupTask[];
  clientLookup: Readonly<Record<string, string>>;
}

/**
 * Real follow-up tasks. Replaces the previous prototype-hardcoded list. Top
 * priority tasks (overdue + today + this-week) shown first; click goes to
 * the client's Seguimientos tab.
 */
export function PendingList({ tasks, clientLookup }: PendingListProps) {
  const today = new Date().setHours(0, 0, 0, 0);
  const sorted = tasks
    .map((t) => classify(t, today))
    .sort((a, b) => a.task.dueAt.localeCompare(b.task.dueAt));
  const preview = sorted.slice(0, PREVIEW_COUNT);
  const urgentCount = sorted.filter(
    (t) => t.urgency === "overdue" || t.urgency === "today",
  ).length;

  return (
    <article className="bg-white border border-line rounded-xl shadow-[0_1px_2px_rgba(14,14,15,0.03)]">
      <header className="flex items-baseline justify-between px-6 pt-5 pb-2">
        <div>
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            Por atender
          </div>
          <div className="font-display text-[24px] mt-1">
            Pendientes · <span className="tabular">{tasks.length}</span>
          </div>
        </div>
        {urgentCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full bg-warn/10 text-warn text-[15px] font-semibold">
            {urgentCount} {urgentCount === 1 ? "urgente" : "urgentes"}
          </span>
        ) : null}
      </header>

      {preview.length === 0 ? (
        <div className="px-6 pb-5 pt-1">
          <p className="m-0 text-[15px] text-ink/60">
            Sin tareas pendientes. Crea una desde el form de visita o venta.
          </p>
        </div>
      ) : (
        <ul className="list-none m-0 px-2 pb-3 pt-0 flex flex-col">
          {preview.map(({ task, urgency, hint }) => {
            const clientName = clientLookup[task.clientId] ?? "Cliente";
            return (
              <li key={task.id}>
                <Link
                  href={`/ba/clients/${task.clientId}?tab=followup#profile-tabs`}
                  className="flex items-center gap-3 px-3 py-3 rounded-md transition-colors hover:bg-bone text-ink no-underline"
                >
                  <span
                    aria-hidden
                    className={cn("w-1.5 h-1.5 rounded-full shrink-0", TONE_DOT[urgency])}
                  />
                  <span
                    aria-hidden
                    className="inline-flex w-7 h-7 items-center justify-center rounded-md bg-bone text-ink/70 shrink-0"
                  >
                    <Icon name={TYPE_ICON[task.type]} size={13} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[16.5px] font-semibold leading-tight line-clamp-1">
                      {task.description}
                    </div>
                    <div className="text-xs text-ink/60 leading-snug mt-0.5">
                      {clientName}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs tabular ${
                        urgency === "overdue" ? "text-err font-semibold" : "text-ink/60"
                      }`}
                    >
                      {hint}
                    </span>
                    <span className="h-[30px] inline-flex items-center px-3 rounded-md border border-line bg-white text-[16.5px] font-semibold">
                      {TYPE_CTA[task.type]}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {tasks.length > PREVIEW_COUNT ? (
        <div className="px-6 pb-4 pt-1">
          <Link
            href="/ba/followup"
            className="inline-flex items-center gap-1 text-[14.5px] font-semibold text-ink hover:text-ink/80 no-underline"
          >
            Ver todas en Seguim. ({tasks.length})
            <Icon name="arrow-right" size={12} />
          </Link>
        </div>
      ) : null}
    </article>
  );
}
