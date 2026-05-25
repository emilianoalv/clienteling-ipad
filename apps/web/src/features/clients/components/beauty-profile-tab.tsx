"use client";

import { useMemo, useState, useTransition } from "react";
import type { Client, RoutineStep, RoutineTiming, SkinType, Subtone } from "@/types/client";
import { Button, Chip, Icon } from "@/components/primitives";
import { updateBeautyProfile } from "../actions/update-beauty-profile";
import {
  COMMON_CONCERNS,
  INGREDIENT_TAGS,
  INTEREST_GROUPS,
  ROUTINE_LEVELS,
  ROUTINE_STEPS,
  ROUTINE_TIMINGS,
  SKIN_TYPES,
  SUBTONES,
  TONE_SWATCHES,
} from "../schemas/new-client.schema";
import { ChipButton } from "./new-client/_parts/chip-button";

const MAX_CONCERNS = 3;

const TONE_HEX: Record<(typeof TONE_SWATCHES)[number], string> = {
  "Muy claro": "#F5E0CE",
  Claro: "#EFCEB4",
  Medio: "#D9AE8B",
  "Medio cálido": "#C69978",
  Oscuro: "#8F5E3D",
  "Muy oscuro": "#5E3A22",
};

const SUBTONE_LABELS: Record<Subtone, string> = {
  frío: "Frío",
  cálido: "Cálido",
  neutro: "Neutro",
};

const ROUTINE_STEP_LABELS: Record<RoutineStep, string> = {
  cleanser: "Limpiador",
  toner: "Tónico",
  serum: "Sérum",
  moisturizer: "Hidratante",
  "eye-cream": "Contorno de ojos",
  spf: "SPF",
  "night-treatment": "Tratamiento noche",
  mask: "Mascarilla",
};

const TIMING_LABELS: Record<RoutineTiming, string> = {
  morning: "Mañana",
  evening: "Noche",
  event: "Eventos",
};

export interface BeautyProfileTabProps {
  client: Client;
}

interface Draft {
  skinType: SkinType;
  tone: string;
  subtone?: Subtone;
  concerns: string[];
  allergies: string[];
  allergiesText: string;
  routineLevel: (typeof ROUTINE_LEVELS)[number];
  routineTiming: RoutineTiming[];
  routineSteps: RoutineStep[];
  interests: string[];
  preferredIngredients: string[];
  avoidedIngredients: string[];
}

function buildDraft(client: Client): Draft {
  return {
    skinType: client.skin.type,
    tone: client.skin.tone === "—" ? "" : client.skin.tone,
    subtone: client.skin.subtone,
    concerns: [...client.skin.concerns],
    allergies: [...client.allergies],
    allergiesText: client.allergies.join(", "),
    routineLevel: client.routine,
    routineTiming: [...(client.routineTiming ?? [])],
    routineSteps: [...(client.routineSteps ?? [])],
    interests: [...client.interests],
    preferredIngredients: [...(client.preferredIngredients ?? [])],
    avoidedIngredients: [...(client.avoidedIngredients ?? [])],
  };
}

export function BeautyProfileTab({ client }: BeautyProfileTabProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => buildDraft(client));
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const tonePalette = useMemo(
    () => TONE_SWATCHES as readonly (typeof TONE_SWATCHES)[number][],
    [],
  );

  function enterEdit() {
    setDraft(buildDraft(client));
    setErrors({});
    setNotice(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setErrors({});
    setDraft(buildDraft(client));
  }

  function onSave() {
    setErrors({});
    const allergies = draft.allergiesText
      .split(",")
      .map((x) => x.trim())
      .filter((x) => x.length > 0 && !/^ningun[ao]s?$/i.test(x));

    const isValidTone = (tonePalette as readonly string[]).includes(draft.tone);
    if (!isValidTone) {
      setErrors({ "skin.tone": ["Selecciona el tono de piel"] });
      return;
    }

    startTransition(async () => {
      const result = await updateBeautyProfile({
        clientId: client.id,
        skin: {
          type: draft.skinType,
          tone: draft.tone as (typeof TONE_SWATCHES)[number],
          ...(draft.subtone ? { subtone: draft.subtone } : {}),
          concerns: draft.concerns as (typeof COMMON_CONCERNS)[number][],
        },
        allergies,
        routine: draft.routineLevel,
        routineTiming: draft.routineTiming,
        ...(draft.routineSteps.length > 0 ? { routineSteps: draft.routineSteps } : {}),
        interests: draft.interests,
        ...(draft.preferredIngredients.length > 0
          ? { preferredIngredients: draft.preferredIngredients }
          : {}),
        ...(draft.avoidedIngredients.length > 0
          ? { avoidedIngredients: draft.avoidedIngredients }
          : {}),
      });
      if (!result.ok) {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        else if (result.message) setNotice(result.message);
        return;
      }
      setEditing(false);
      setNotice("Perfil actualizado");
      setTimeout(() => setNotice(null), 1600);
    });
  }

  // ── Toggle helpers ──────────────────────────────────────────────────────
  function toggleArr<T>(prev: T[], value: T): T[] {
    return prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value];
  }

  function toggleConcern(c: string) {
    setDraft((d) => {
      if (d.concerns.includes(c)) return { ...d, concerns: d.concerns.filter((x) => x !== c) };
      if (d.concerns.length >= MAX_CONCERNS) return d;
      return { ...d, concerns: [...d.concerns, c] };
    });
  }

  if (editing) {
    return (
      <EditMode
        draft={draft}
        setDraft={setDraft}
        toggleArr={toggleArr}
        toggleConcern={toggleConcern}
        errors={errors}
        notice={notice}
        isPending={isPending}
        onSave={onSave}
        onCancel={cancelEdit}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            Perfil de belleza
          </div>
          <p className="m-0 mt-1 text-[14.5px] text-ink/60 leading-snug">
            Captura del tipo de piel, tono, rutina e ingredientes que el cliente prefiere o evita.
            Estos datos alimentan el ranking de productos recomendados.
          </p>
        </div>
        <Button variant="outline" onClick={enterEdit} leading={<Icon name="check" />}>
          Editar perfil
        </Button>
      </header>

      {notice ? (
        <div className="inline-flex items-center gap-2 px-4 py-3 bg-ok/[0.1] text-ok rounded-md text-[15px] font-semibold leading-none border border-ok/25 self-start">
          <Icon name="check" /> {notice}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ── Piel ─────────────────────────────────────────────────────── */}
        <SectionCard title="Piel">
          <Field label="Tipo de piel">
            <Chip variant="neutral">{client.skin.type}</Chip>
          </Field>
          <Field label="Tono">
            {client.skin.tone && client.skin.tone !== "—" ? (
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block w-5 h-5 rounded-full border border-line"
                  style={{
                    background:
                      TONE_HEX[client.skin.tone as keyof typeof TONE_HEX] ?? "transparent",
                  }}
                />
                <span className="text-[15px] font-medium">{client.skin.tone}</span>
              </span>
            ) : (
              <PendingChip />
            )}
          </Field>
          <Field label="Subtono">
            {client.skin.subtone ? (
              <Chip variant="neutral">{SUBTONE_LABELS[client.skin.subtone]}</Chip>
            ) : (
              <PendingChip />
            )}
          </Field>
          <Field label="Preocupaciones prioritarias">
            {client.skin.concerns.length === 0 ? (
              <PendingChip />
            ) : (
              <ChipList items={client.skin.concerns} />
            )}
          </Field>
          <Field label="Alergias">
            {client.allergies.length === 0 ? (
              <span className="text-[14.5px] text-ink/50 italic">Ninguna registrada</span>
            ) : (
              <ChipList items={client.allergies} tone="danger" />
            )}
          </Field>
        </SectionCard>

        {/* ── Rutina ──────────────────────────────────────────────────── */}
        <SectionCard title="Rutina">
          <Field label="Cuándo aplica">
            {client.routineTiming && client.routineTiming.length > 0 ? (
              <ChipList items={client.routineTiming.map((t) => TIMING_LABELS[t])} />
            ) : (
              <PendingChip />
            )}
          </Field>
          <Field label="Nivel">
            <Chip variant="neutral">{client.routine}</Chip>
          </Field>
          <Field label="Pasos que ya hace">
            {client.routineSteps && client.routineSteps.length > 0 ? (
              <ChipList items={client.routineSteps.map((s) => ROUTINE_STEP_LABELS[s])} />
            ) : (
              <PendingChip hint="Captura qué pasos hace hoy (de cualquier marca) para detectar huecos." />
            )}
          </Field>
        </SectionCard>

        {/* ── Intereses ───────────────────────────────────────────────── */}
        <SectionCard title="Intereses">
          {client.interests.length === 0 ? (
            <PendingChip />
          ) : (
            <ChipList items={client.interests} />
          )}
        </SectionCard>

        {/* ── Ingredientes ────────────────────────────────────────────── */}
        <SectionCard title="Ingredientes">
          <Field label="Preferidos">
            {client.preferredIngredients && client.preferredIngredients.length > 0 ? (
              <ChipList items={client.preferredIngredients} tone="ok" />
            ) : (
              <PendingChip hint="Vitamina C, retinol, hialurónico…" />
            )}
          </Field>
          <Field label="A evitar">
            {client.avoidedIngredients && client.avoidedIngredients.length > 0 ? (
              <ChipList items={client.avoidedIngredients} tone="warn" />
            ) : (
              <PendingChip hint="Fragancia, parabenos, alcohol…" />
            )}
          </Field>
        </SectionCard>
      </div>
    </div>
  );
}

// ── Vista ──────────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="bg-white border border-line rounded-xl p-5 flex flex-col gap-3">
      <h3 className="m-0 text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/55">
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12.5px] font-semibold tracking-[0.08em] uppercase text-ink/50">
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}

function ChipList({
  items,
  tone = "neutral",
}: {
  items: readonly string[];
  tone?: "neutral" | "ok" | "warn" | "danger";
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <Chip key={i} variant={tone} size="sm">
          {i}
        </Chip>
      ))}
    </div>
  );
}

function PendingChip({ hint }: { hint?: string }) {
  return (
    <div className="inline-flex items-start gap-2 px-3 py-2 rounded-md bg-warn/[0.08] border border-warn/25">
      <Icon name="warning" size={13} />
      <div className="flex flex-col gap-0.5">
        <span className="text-[13.5px] font-semibold text-warn leading-none">
          Pendiente de capturar
        </span>
        {hint ? (
          <span className="text-[12.5px] text-ink/60 leading-snug">{hint}</span>
        ) : null}
      </div>
    </div>
  );
}

// ── Edit mode ──────────────────────────────────────────────────────────────

interface EditModeProps {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  toggleArr: <T>(prev: T[], value: T) => T[];
  toggleConcern: (c: string) => void;
  errors: Record<string, string[]>;
  notice: string | null;
  isPending: boolean;
  onSave: () => void;
  onCancel: () => void;
}

function EditMode({
  draft,
  setDraft,
  toggleArr,
  toggleConcern,
  errors,
  notice,
  isPending,
  onSave,
  onCancel,
}: EditModeProps) {
  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            Editar perfil de belleza
          </div>
          <p className="m-0 mt-1 text-[14.5px] text-ink/60 leading-snug">
            Cambia lo que sea necesario y guarda. Los datos opcionales pueden quedar vacíos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={onSave} loading={isPending} leading={<Icon name="check" />}>
            Guardar cambios
          </Button>
        </div>
      </header>

      {notice ? (
        <div className="inline-flex items-center gap-2 px-4 py-3 bg-err/[0.1] text-err rounded-md text-[15px] font-semibold leading-none border border-err/25 self-start">
          <Icon name="warning" /> {notice}
        </div>
      ) : null}

      {/* Piel */}
      <EditSection title="Piel">
        <SubLabel>Tipo de piel *</SubLabel>
        <div className="flex flex-wrap gap-1.5">
          {SKIN_TYPES.map((s) => (
            <ChipButton
              key={s}
              size="sm"
              active={draft.skinType === s}
              onClick={() => setDraft((d) => ({ ...d, skinType: s }))}
            >
              {s}
            </ChipButton>
          ))}
        </div>

        <SubLabel>Tono *</SubLabel>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {TONE_SWATCHES.map((label) => {
            const active = draft.tone === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, tone: label }))}
                aria-pressed={active}
                className={`flex flex-col items-stretch gap-1.5 p-2 rounded-md cursor-pointer bg-white text-left transition-colors ${
                  active ? "border-2 border-ink" : "border border-line hover:border-ink/40"
                }`}
              >
                <span
                  aria-hidden
                  className="w-full h-8 rounded"
                  style={{ background: TONE_HEX[label] }}
                />
                <span className="text-[12.5px] font-medium leading-tight">{label}</span>
              </button>
            );
          })}
        </div>
        {errors["skin.tone"]?.[0] ? (
          <span className="text-xs text-err">{errors["skin.tone"][0]}</span>
        ) : null}

        <SubLabel>
          Subtono <span className="text-ink/45 font-normal">· opcional</span>
        </SubLabel>
        <div className="flex flex-wrap gap-1.5">
          {SUBTONES.map((s) => (
            <ChipButton
              key={s}
              size="sm"
              active={draft.subtone === s}
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  subtone: d.subtone === s ? undefined : s,
                }))
              }
            >
              {SUBTONE_LABELS[s]}
            </ChipButton>
          ))}
        </div>

        <SubLabel>
          Preocupaciones prioritarias{" "}
          <span className="text-ink/45 font-normal">
            · opcional · máx {MAX_CONCERNS} ({draft.concerns.length}/{MAX_CONCERNS})
          </span>
        </SubLabel>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_CONCERNS.map((c) => {
            const active = draft.concerns.includes(c);
            const muted = !active && draft.concerns.length >= MAX_CONCERNS;
            return (
              <ChipButton
                key={c}
                size="sm"
                active={active}
                onClick={() => toggleConcern(c)}
                className={muted ? "opacity-40" : undefined}
              >
                {c}
              </ChipButton>
            );
          })}
        </div>

        <SubLabel>Alergias</SubLabel>
        <input
          value={draft.allergiesText}
          onChange={(e) => setDraft((d) => ({ ...d, allergiesText: e.target.value }))}
          placeholder='p.ej. fragancia, parabenos… o "ninguna"'
          className="h-10 w-full rounded-[10px] border border-line bg-white px-[14px] text-[15px] text-ink outline-none placeholder:text-ink/40 focus-visible:border-ink"
        />
      </EditSection>

      {/* Rutina */}
      <EditSection title="Rutina">
        <SubLabel>Cuándo aplica *</SubLabel>
        <div className="flex flex-wrap gap-1.5">
          {ROUTINE_TIMINGS.map((id) => (
            <ChipButton
              key={id}
              size="sm"
              active={draft.routineTiming.includes(id)}
              onClick={() =>
                setDraft((d) => ({ ...d, routineTiming: toggleArr(d.routineTiming, id) }))
              }
            >
              {TIMING_LABELS[id]}
            </ChipButton>
          ))}
        </div>

        <SubLabel>Nivel</SubLabel>
        <div className="flex flex-wrap gap-1.5">
          {ROUTINE_LEVELS.map((id) => (
            <ChipButton
              key={id}
              size="sm"
              active={draft.routineLevel === id}
              onClick={() => setDraft((d) => ({ ...d, routineLevel: id }))}
            >
              {id}
            </ChipButton>
          ))}
        </div>

        <SubLabel>
          Pasos que ya hace{" "}
          <span className="text-ink/45 font-normal">· opcional · cualquier marca</span>
        </SubLabel>
        <div className="flex flex-wrap gap-1.5">
          {ROUTINE_STEPS.map((step) => (
            <ChipButton
              key={step}
              size="sm"
              active={draft.routineSteps.includes(step)}
              onClick={() =>
                setDraft((d) => ({ ...d, routineSteps: toggleArr(d.routineSteps, step) }))
              }
            >
              {ROUTINE_STEP_LABELS[step]}
            </ChipButton>
          ))}
        </div>
      </EditSection>

      {/* Intereses */}
      <EditSection title="Intereses">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(INTEREST_GROUPS).map(([group, items]) => (
            <article key={group} className="bg-bone rounded-[10px] p-3">
              <div className="text-[13px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
                {group}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {items.map((it) => (
                  <ChipButton
                    key={it}
                    size="sm"
                    active={draft.interests.includes(it)}
                    onClick={() =>
                      setDraft((d) => ({ ...d, interests: toggleArr(d.interests, it) }))
                    }
                  >
                    {it}
                  </ChipButton>
                ))}
              </div>
            </article>
          ))}
        </div>
      </EditSection>

      {/* Ingredientes */}
      <EditSection title="Ingredientes">
        <SubLabel>
          Preferidos <span className="text-ink/45 font-normal">· soft positive</span>
        </SubLabel>
        <div className="flex flex-wrap gap-1.5">
          {INGREDIENT_TAGS.map((tag) => (
            <ChipButton
              key={`pref-${tag}`}
              size="sm"
              active={draft.preferredIngredients.includes(tag)}
              onClick={() =>
                setDraft((d) => {
                  const has = d.preferredIngredients.includes(tag);
                  return {
                    ...d,
                    preferredIngredients: has
                      ? d.preferredIngredients.filter((x) => x !== tag)
                      : [...d.preferredIngredients, tag],
                    // Si se agrega como preferido, quitar de "a evitar".
                    // Marcar el mismo ingrediente en ambos lados no tiene
                    // sentido para el scorer ni para el cliente.
                    avoidedIngredients: !has
                      ? d.avoidedIngredients.filter((x) => x !== tag)
                      : d.avoidedIngredients,
                  };
                })
              }
            >
              {tag}
            </ChipButton>
          ))}
        </div>

        <SubLabel>
          A evitar <span className="text-ink/45 font-normal">· soft negative</span>
        </SubLabel>
        <div className="flex flex-wrap gap-1.5">
          {INGREDIENT_TAGS.map((tag) => (
            <ChipButton
              key={`avoid-${tag}`}
              size="sm"
              active={draft.avoidedIngredients.includes(tag)}
              onClick={() =>
                setDraft((d) => {
                  const has = d.avoidedIngredients.includes(tag);
                  return {
                    ...d,
                    avoidedIngredients: has
                      ? d.avoidedIngredients.filter((x) => x !== tag)
                      : [...d.avoidedIngredients, tag],
                    preferredIngredients: !has
                      ? d.preferredIngredients.filter((x) => x !== tag)
                      : d.preferredIngredients,
                  };
                })
              }
            >
              {tag}
            </ChipButton>
          ))}
        </div>
      </EditSection>

      <footer className="flex justify-end gap-2 border-t border-line pt-4">
        <Button variant="ghost" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={onSave} loading={isPending} leading={<Icon name="check" />}>
          Guardar cambios
        </Button>
      </footer>
    </div>
  );
}

function EditSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="bg-white border border-line rounded-xl p-5 flex flex-col gap-3">
      <h3 className="m-0 text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/55">
        {title}
      </h3>
      {children}
    </article>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[12.5px] font-semibold tracking-[0.08em] uppercase text-ink/55">
      {children}
    </span>
  );
}
