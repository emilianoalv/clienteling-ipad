"use client";

import { useState, useTransition } from "react";
import type { ClientId } from "@/types/client";
import {
  FOLLOWUP_TYPES,
  type FollowupStatus,
  type FollowupTask,
  type FollowupType,
} from "@/types/followup-task";
import type { IconName } from "@/types/icon";
import { Button, Icon, Input } from "@/components/primitives";
import { createFollowupTask } from "../../actions/create-followup-task";
import { completeFollowupTask } from "../../actions/complete-followup-task";
import { cancelFollowupTask } from "../../actions/cancel-followup-task";

const TYPE_ICON: Record<FollowupType, IconName> = {
  call: "device",
  whatsapp: "whatsapp",
  email: "email",
  "sample-feedback": "gift",
  appointment: "calendar",
  other: "more",
};

const STATUS_LABEL: Record<FollowupStatus, string> = {
  pending: "Pendiente",
  done: "Hecha",
  cancelled: "Cancelada",
};

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export interface FollowupTabProps {
  clientId: ClientId;
  tasks: readonly FollowupTask[];
}

export function FollowupTab({ clientId, tasks }: FollowupTabProps) {
  const [creating, setCreating] = useState(false);
  const [type, setType] = useState<FollowupType>("call");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState(addDaysISO(7));
  const [createErrors, setCreateErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  const pending = tasks
    .filter((t) => t.status === "pending")
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const past = tasks
    .filter((t) => t.status !== "pending")
    .sort((a, b) =>
      (b.completedAt ?? b.dueAt).localeCompare(a.completedAt ?? a.dueAt),
    );

  function resetForm() {
    setType("call");
    setDescription("");
    setDueAt(addDaysISO(7));
    setCreateErrors({});
  }

  function onCreate() {
    startTransition(async () => {
      const result = await createFollowupTask({
        clientId,
        type,
        description,
        dueAt,
      });
      if (result && !result.ok) {
        setCreateErrors(result.fieldErrors ?? {});
      } else {
        setCreating(false);
        resetForm();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Create row */}
      <div className="flex items-center justify-between">
        <p className="m-0 text-[14.5px] text-ink/60 leading-snug">
          Acciones que prometiste hacer después de una visita. Una vez ejecutadas, registra el
          resultado para mantener el historial.
        </p>
        {!creating ? (
          <Button
            variant="primary"
            size="sm"
            leading={<Icon name="plus" size={12} />}
            onClick={() => setCreating(true)}
          >
            Nueva tarea
          </Button>
        ) : null}
      </div>

      {creating ? (
        <article className="bg-bone border border-line rounded-lg p-4 flex flex-col gap-3">
          <div>
            <div className="text-[12.5px] font-semibold text-ink/70 mb-1.5">Tipo</div>
            <div className="flex flex-wrap gap-1.5">
              {FOLLOWUP_TYPES.map((ft) => {
                const active = type === ft.id;
                return (
                  <button
                    key={ft.id}
                    type="button"
                    onClick={() => setType(ft.id)}
                    aria-pressed={active}
                    className={`inline-flex items-center h-8 px-3 rounded-full border text-[12.5px] font-semibold cursor-pointer transition-colors ${
                      active
                        ? "bg-ink text-paper border-ink"
                        : "bg-white text-ink border-line hover:bg-bone"
                    }`}
                  >
                    {ft.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3 items-start">
            <Input
              label="Descripción *"
              placeholder='ej. "Llamar para feedback de muestra Or Rouge"'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              {...(createErrors.description?.[0]
                ? { error: createErrors.description[0] }
                : {})}
            />
            <Input
              label="Vence *"
              type="date"
              value={dueAt}
              min={todayISO()}
              onChange={(e) => setDueAt(e.target.value)}
              {...(createErrors.dueAt?.[0] ? { error: createErrors.dueAt[0] } : {})}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setCreating(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button variant="primary" onClick={onCreate} loading={isPending}>
              Crear tarea
            </Button>
          </div>
        </article>
      ) : null}

      {/* Pending list */}
      <section>
        <h3 className="m-0 mb-2.5 text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          Pendientes · {pending.length}
        </h3>
        {pending.length === 0 ? (
          <p className="m-0 text-[14.5px] text-ink/60">
            Sin tareas pendientes. Crea una con el botón de arriba o desde el flujo de visita/venta.
          </p>
        ) : (
          <ul className="list-none m-0 p-0 flex flex-col gap-2">
            {pending.map((task) => (
              <PendingRow key={task.id} task={task} />
            ))}
          </ul>
        )}
      </section>

      {/* Done / cancelled */}
      {past.length > 0 ? (
        <section>
          <h3 className="m-0 mb-2.5 text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            Historial · {past.length}
          </h3>
          <ul className="list-none m-0 p-0 flex flex-col gap-2">
            {past.map((task) => (
              <PastRow key={task.id} task={task} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function PendingRow({ task }: { task: FollowupTask }) {
  const [marking, setMarking] = useState(false);
  const [result, setResult] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  const overdue = new Date(task.dueAt).getTime() < new Date().setHours(0, 0, 0, 0);

  function onComplete() {
    startTransition(async () => {
      const r = await completeFollowupTask({ taskId: task.id, result });
      if (r && !r.ok) setErrors(r.fieldErrors ?? {});
      else setMarking(false);
    });
  }

  function onCancel() {
    startTransition(async () => {
      await cancelFollowupTask(task.id);
    });
  }

  return (
    <li className="bg-white border border-line rounded-lg p-3.5">
      <div className="grid grid-cols-[36px_minmax(0,1fr)_auto] gap-3 items-center">
        <span
          aria-hidden
          className="inline-flex w-9 h-9 items-center justify-center rounded-md bg-bone text-ink/70"
        >
          <Icon name={TYPE_ICON[task.type]} size={16} />
        </span>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold leading-tight">{task.description}</div>
          <div className="text-[13px] text-ink/60 leading-tight mt-0.5">
            {labelType(task.type)} · vence {formatDue(task.dueAt)}
            {overdue ? <span className="text-err font-semibold"> · vencida</span> : null}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!marking ? (
            <>
              <Button size="sm" variant="ghost" onClick={onCancel} disabled={isPending}>
                Cancelar
              </Button>
              <Button size="sm" variant="primary" onClick={() => setMarking(true)}>
                Marcar hecha
              </Button>
            </>
          ) : null}
        </div>
      </div>
      {marking ? (
        <div className="mt-3 pt-3 border-t border-line flex flex-col gap-2">
          <Input
            label="Resultado *"
            placeholder='ej. "Respondió con 5★, agendó cita para el viernes"'
            value={result}
            onChange={(e) => setResult(e.target.value)}
            {...(errors.result?.[0] ? { error: errors.result[0] } : {})}
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setMarking(false);
                setResult("");
                setErrors({});
              }}
            >
              Cancelar
            </Button>
            <Button size="sm" variant="primary" onClick={onComplete} loading={isPending}>
              Confirmar
            </Button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function PastRow({ task }: { task: FollowupTask }) {
  const cancelled = task.status === "cancelled";
  return (
    <li
      className={`border border-line rounded-lg p-3.5 ${
        cancelled ? "bg-ink/[0.02] opacity-70" : "bg-ok/[0.04]"
      }`}
    >
      <div className="grid grid-cols-[36px_minmax(0,1fr)_auto] gap-3 items-center">
        <span
          aria-hidden
          className="inline-flex w-9 h-9 items-center justify-center rounded-md bg-white text-ink/60"
        >
          <Icon name={cancelled ? "x" : "check"} size={16} />
        </span>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold leading-tight">{task.description}</div>
          <div className="text-[13px] text-ink/60 leading-tight mt-0.5">
            {labelType(task.type)} · {STATUS_LABEL[task.status]}
            {task.completedAt ? ` · ${formatDate(task.completedAt)}` : ""}
          </div>
        </div>
      </div>
      {task.result ? (
        <p className="m-0 mt-2.5 pl-12 text-[14px] text-ink/80 leading-snug">
          {task.result}
        </p>
      ) : null}
    </li>
  );
}

function labelType(t: FollowupType): string {
  return FOLLOWUP_TYPES.find((ft) => ft.id === t)?.label ?? t;
}

function formatDue(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" }).format(new Date(iso));
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", { day: "2-digit", month: "short" }).format(new Date(iso));
}
