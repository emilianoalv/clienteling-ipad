"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { ClientId } from "@/types/client";
import {
  FOLLOWUP_CATEGORIES,
  FOLLOWUP_TYPES,
  type FollowupCategory,
  type FollowupTask,
  type FollowupType,
} from "@/types/followup-task";
import type { IconName } from "@/types/icon";
import { Avatar, Button, Icon, Input } from "@/components/primitives";
import { Card } from "@/components/patterns";
import { createFollowupTask } from "../actions/create-followup-task";
import { completeFollowupTask } from "../actions/complete-followup-task";
import { cancelFollowupTask } from "../actions/cancel-followup-task";
import { CategoryChip } from "./_parts/category-chip";

const TYPE_ICON: Record<FollowupType, IconName> = {
  call: "device",
  whatsapp: "whatsapp",
  email: "email",
  "sample-feedback": "gift",
  appointment: "calendar",
  other: "more",
};

type Bucket = "today" | "week" | "pending" | "done";

const BUCKETS: ReadonlyArray<{ id: Bucket; label: string }> = [
  { id: "today", label: "Hoy y vencidas" },
  { id: "week", label: "Esta semana" },
  { id: "pending", label: "Todas pendientes" },
  { id: "done", label: "Hechas" },
];

function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfTodayMs(): number {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function endOfNDaysMs(n: number): number {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

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

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
}

function relativeDue(iso: string): string {
  const today = startOfTodayMs();
  const dueMs = new Date(iso).setHours(0, 0, 0, 0);
  const diffDays = Math.round((dueMs - today) / 86_400_000);
  if (diffDays === 0) return "hoy";
  if (diffDays === 1) return "mañana";
  if (diffDays === -1) return "ayer";
  if (diffDays < 0) return `${-diffDays}d vencida`;
  if (diffDays < 7) return `en ${diffDays}d`;
  if (diffDays < 30) return `en ${Math.round(diffDays / 7)} sem`;
  return `en ${Math.round(diffDays / 30)} meses`;
}

function labelType(t: FollowupType): string {
  return FOLLOWUP_TYPES.find((ft) => ft.id === t)?.label ?? t;
}

/**
 * Para qué tipos de task ofrecemos el atajo "Responder con plantilla":
 * canales de mensajería digital. Llamadas / citas / sample-feedback
 * suelen tener un componente WhatsApp también (de hecho sample-feedback
 * generalmente es WhatsApp), pero el flujo de composer aplica a las que
 * el BA puede ejecutar con un mensaje desde la app.
 */
function canReplyWithTemplate(type: FollowupType): boolean {
  return type === "whatsapp" || type === "email" || type === "sample-feedback";
}

export interface TaskInboxProps {
  tasks: readonly FollowupTask[];
  /** Map ClientId → display name. Vacío en modo client-scoped (no se usa). */
  clientLookup: Readonly<Record<string, string>>;
  /**
   * "global" — vista cross-cliente con avatar del cliente en cada row,
   *   link al perfil y header genérico. Default.
   * "client-scoped" — vista filtrada a un solo cliente con form de
   *   creación inline. No muestra avatar del cliente (ya estás en su
   *   perfil) y oculta el header genérico para integrarse en la tab.
   */
  mode?: "global" | "client-scoped";
  /** Required en modo client-scoped — necesario para el form de crear. */
  clientId?: ClientId;
}

export function TaskInbox({
  tasks,
  clientLookup,
  mode = "global",
  clientId,
}: TaskInboxProps) {
  const [bucket, setBucket] = useState<Bucket>("today");

  const counts = useMemo(() => {
    const today = endOfTodayMs();
    const week = endOfNDaysMs(7);
    const c: Record<Bucket, number> = { today: 0, week: 0, pending: 0, done: 0 };
    for (const t of tasks) {
      if (t.status === "pending") {
        c.pending++;
        const dueMs = new Date(t.dueAt).getTime();
        if (dueMs <= today) c.today++;
        if (dueMs <= week) c.week++;
      } else if (t.status === "done") {
        c.done++;
      }
    }
    return c;
  }, [tasks]);

  const filtered = useMemo(() => {
    if (bucket === "done") {
      return tasks
        .filter((t) => t.status === "done")
        .sort((a, b) =>
          (b.completedAt ?? b.dueAt).localeCompare(a.completedAt ?? a.dueAt),
        );
    }
    const pending = tasks
      .filter((t) => t.status === "pending")
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    if (bucket === "pending") return pending;
    if (bucket === "today") {
      const cutoff = endOfTodayMs();
      return pending.filter((t) => new Date(t.dueAt).getTime() <= cutoff);
    }
    // "week"
    const cutoff = endOfNDaysMs(7);
    return pending.filter((t) => new Date(t.dueAt).getTime() <= cutoff);
  }, [tasks, bucket]);

  return (
    <div className="flex flex-col gap-5">
      {mode === "global" ? (
        <header>
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            Inbox de tareas
          </div>
          <h2 className="m-0 mt-1 font-display text-[28px] leading-tight tracking-[-0.01em]">
            Tus seguimientos
          </h2>
          <p className="m-0 mt-1.5 text-[15px] text-ink/60 leading-snug">
            Lista cross-cliente de tareas pendientes y completadas. Las creas desde el form de visita,
            venta o desde el perfil de cada cliente.
          </p>
        </header>
      ) : null}

      {/* Create row (solo en modo client-scoped) */}
      {mode === "client-scoped" && clientId ? (
        <CreateTaskRow clientId={clientId} />
      ) : null}

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {BUCKETS.map((b) => {
          const active = bucket === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setBucket(b.id)}
              aria-pressed={active}
              className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-full border text-[14px] font-semibold cursor-pointer transition-colors ${
                active
                  ? "bg-ink text-paper border-ink"
                  : "bg-white text-ink border-line hover:bg-bone"
              }`}
            >
              <span>{b.label}</span>
              <span className="opacity-70 font-medium tabular">· {counts[b.id]}</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card variant="flat" className="text-center py-10">
          <p className="m-0 text-[15px] text-ink/60">
            {bucket === "done"
              ? "No hay tareas completadas todavía."
              : "Sin tareas en este filtro. ¡Buen trabajo!"}
          </p>
        </Card>
      ) : (
        <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
          {filtered.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              clientName={clientLookup[task.clientId] ?? "Cliente"}
              mode={mode}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function TaskRow({
  task,
  clientName,
  mode,
}: {
  task: FollowupTask;
  clientName: string;
  mode: "global" | "client-scoped";
}) {
  const isDone = task.status === "done";
  const isCancelled = task.status === "cancelled";
  const overdue =
    task.status === "pending" && new Date(task.dueAt).getTime() < startOfTodayMs();

  const [marking, setMarking] = useState(false);
  const [result, setResult] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

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

  // En client-scoped omitimos la columna del avatar del cliente (ya
  // estamos en su perfil, sería redundante).
  const showClientCol = mode === "global";

  return (
    <li
      className={`bg-white border border-line rounded-lg p-3.5 ${
        isDone ? "bg-ok/[0.04]" : isCancelled ? "opacity-70" : ""
      }`}
    >
      <div
        className={`grid gap-3.5 items-center ${
          showClientCol
            ? "grid-cols-[40px_minmax(0,1fr)_auto]"
            : "grid-cols-[minmax(0,1fr)_auto]"
        }`}
      >
        {showClientCol ? <Avatar initials={initials(clientName)} size={40} /> : null}
        <div className="min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            {showClientCol ? (
              <>
                <Link
                  href={`/ba/clients/${task.clientId}`}
                  className="text-[13.5px] font-semibold text-ink hover:text-ink/80 no-underline"
                >
                  {clientName}
                </Link>
                <span aria-hidden className="text-ink/30">·</span>
              </>
            ) : null}
            <span className="inline-flex items-center gap-1 text-[12.5px] text-ink/60">
              <Icon name={TYPE_ICON[task.type]} size={12} />
              {labelType(task.type)}
            </span>
            <CategoryChip category={task.category} size="sm" />
            {overdue ? (
              <span className="inline-flex items-center h-5 px-2 rounded-full bg-err/10 text-err text-[11.5px] font-semibold">
                Vencida
              </span>
            ) : null}
          </div>
          <div className="text-[15px] font-semibold leading-tight">{task.description}</div>
          {task.result ? (
            <div className="text-[13.5px] text-ink/70 leading-snug mt-0.5">
              Resultado: <span className="text-ink">{task.result}</span>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-[13px] tabular ${
              overdue ? "text-err font-semibold" : "text-ink/60"
            }`}
          >
            {isDone || isCancelled ? "" : relativeDue(task.dueAt)}
          </span>
          {task.status === "pending" && !marking ? (
            <>
              {canReplyWithTemplate(task.type) ? (
                <Link
                  href={`/ba/followup?view=messages&clientId=${task.clientId}&taskId=${task.id}`}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-ink bg-ink text-paper text-[13px] font-semibold no-underline hover:opacity-90 transition-opacity"
                >
                  <Icon name={TYPE_ICON[task.type]} size={12} />
                  Responder
                </Link>
              ) : null}
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
            placeholder='ej. "Llamada hecha, le interesó Or Rouge, agendó cita"'
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

// ── Create form (solo client-scoped) ──────────────────────────────────────

function CreateTaskRow({ clientId }: { clientId: ClientId }) {
  const [creating, setCreating] = useState(false);
  const [type, setType] = useState<FollowupType>("call");
  const [category, setCategory] = useState<FollowupCategory>("general");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState(addDaysISO(7));
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  function reset() {
    setType("call");
    setCategory("general");
    setDescription("");
    setDueAt(addDaysISO(7));
    setErrors({});
  }

  function onCreate() {
    startTransition(async () => {
      const result = await createFollowupTask({
        clientId,
        type,
        category,
        description,
        dueAt,
      });
      if (result && !result.ok) setErrors(result.fieldErrors ?? {});
      else {
        setCreating(false);
        reset();
      }
    });
  }

  if (!creating) {
    return (
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 text-[14.5px] text-ink/60 leading-snug">
          Acciones que prometiste hacer después de una visita. Una vez ejecutadas, registra el
          resultado para mantener el historial.
        </p>
        <Button
          variant="primary"
          size="sm"
          leading={<Icon name="plus" size={12} />}
          onClick={() => setCreating(true)}
        >
          Nueva tarea
        </Button>
      </div>
    );
  }

  return (
    <article className="bg-bone border border-line rounded-lg p-4 flex flex-col gap-3">
      <div>
        <div className="text-[12.5px] font-semibold text-ink/70 mb-1.5">
          Categoría *
          <span className="font-normal text-ink/50"> · por qué se hace</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FOLLOWUP_CATEGORIES.map((fc) => {
            const active = category === fc.id;
            return (
              <button
                key={fc.id}
                type="button"
                onClick={() => setCategory(fc.id)}
                aria-pressed={active}
                title={fc.hint}
                className={`inline-flex items-center h-8 px-3 rounded-full border text-[12.5px] font-semibold cursor-pointer transition-colors ${
                  active
                    ? "bg-ink text-paper border-ink"
                    : "bg-white text-ink border-line hover:bg-bone"
                }`}
              >
                {fc.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="text-[12.5px] font-semibold text-ink/70 mb-1.5">
          Canal *
          <span className="font-normal text-ink/50"> · cómo lo vas a hacer</span>
        </div>
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
          {...(errors.description?.[0] ? { error: errors.description[0] } : {})}
        />
        <Input
          label="Vence *"
          type="date"
          value={dueAt}
          min={todayISO()}
          onChange={(e) => setDueAt(e.target.value)}
          {...(errors.dueAt?.[0] ? { error: errors.dueAt[0] } : {})}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            setCreating(false);
            reset();
          }}
        >
          Cancelar
        </Button>
        <Button variant="primary" onClick={onCreate} loading={isPending}>
          Crear tarea
        </Button>
      </div>
    </article>
  );
}
