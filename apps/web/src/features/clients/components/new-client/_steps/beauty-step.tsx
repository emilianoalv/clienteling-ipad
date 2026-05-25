"use client";

import { Icon, Input } from "@/components/primitives";
import {
  COMMON_CONCERNS,
  INGREDIENT_TAGS,
  INTEREST_GROUPS,
  ROUTINE_LEVELS,
  ROUTINE_TIMINGS,
  SKIN_TYPES,
  SUBTONES,
  TONE_SWATCHES,
} from "../../../schemas/new-client.schema";
import type { Subtone } from "@/types/client";
import { ChipButton } from "../_parts/chip-button";
import { StepHeader } from "../_parts/step-header";
import type { Draft, FieldErrors } from "../types";

const TIMING_LABELS: Record<(typeof ROUTINE_TIMINGS)[number], string> = {
  morning: "🌅 Mañana",
  evening: "🌙 Noche",
  event: "✨ Solo en eventos",
};

const LEVEL_LABELS: Record<(typeof ROUTINE_LEVELS)[number], string> = {
  Ninguna: "Sin rutina",
  Básica: "Básica · 2-3 pasos",
  Intermedia: "Intermedia · 4-5",
  Avanzada: "Avanzada · 6+",
  Profesional: "Profesional",
};

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

const MAX_CONCERNS = 3;

export interface BeautyStepProps {
  draft: Draft;
  errors: FieldErrors;
  update<K extends keyof Draft>(key: K, value: Draft[K]): void;
  toggleInterest: (value: string) => void;
  toggleTiming: (value: (typeof ROUTINE_TIMINGS)[number]) => void;
}

export function BeautyStep({
  draft,
  errors,
  update,
  toggleInterest,
  toggleTiming,
}: BeautyStepProps) {
  function toggleConcern(c: string) {
    const current = draft.skin.concerns;
    if (current.includes(c)) {
      update("skin", { ...draft.skin, concerns: current.filter((x) => x !== c) });
      return;
    }
    if (current.length >= MAX_CONCERNS) return;
    update("skin", { ...draft.skin, concerns: [...current, c] });
  }

  function setTone(tone: string) {
    update("skin", { ...draft.skin, tone });
  }

  // Mutuamente excluyentes: si el BA agrega un ingrediente a "preferidos"
  // se quita de "a evitar" (y viceversa). No tiene sentido marcar el mismo
  // ingrediente como deseado y no deseado a la vez. Dos updates seguidos
  // funcionan porque React 18+ batchea callbacks dentro del mismo handler
  // y `update` usa setDraft con callback form.
  function togglePreferred(tag: string) {
    const has = draft.preferredIngredients.includes(tag);
    update(
      "preferredIngredients",
      has
        ? draft.preferredIngredients.filter((x) => x !== tag)
        : [...draft.preferredIngredients, tag],
    );
    if (!has && draft.avoidedIngredients.includes(tag)) {
      update(
        "avoidedIngredients",
        draft.avoidedIngredients.filter((x) => x !== tag),
      );
    }
  }

  function toggleAvoided(tag: string) {
    const has = draft.avoidedIngredients.includes(tag);
    update(
      "avoidedIngredients",
      has
        ? draft.avoidedIngredients.filter((x) => x !== tag)
        : [...draft.avoidedIngredients, tag],
    );
    if (!has && draft.preferredIngredients.includes(tag)) {
      update(
        "preferredIngredients",
        draft.preferredIngredients.filter((x) => x !== tag),
      );
    }
  }

  function setSubtone(subtone: Subtone) {
    // Toggle off if already selected.
    if (draft.skin.subtone === subtone) {
      const { subtone: _omit, ...rest } = draft.skin;
      void _omit;
      update("skin", rest);
      return;
    }
    update("skin", { ...draft.skin, subtone });
  }

  return (
    <>
      <StepHeader eyebrow="PASO 2 · PERFIL DE BELLEZA" title="Esencial para recomendar bien" />

      {/* Tipo de piel */}
      <div className="mb-6">
        <Label>Tipo de piel *</Label>
        <div className="flex flex-wrap gap-1.5">
          {SKIN_TYPES.map((s) => (
            <ChipButton
              key={s}
              active={draft.skin.type === s}
              onClick={() => update("skin", { ...draft.skin, type: s })}
            >
              {s}
            </ChipButton>
          ))}
        </div>
      </div>

      {/* Tono + subtono */}
      <div className="mb-6">
        <Label>Tono de piel *</Label>
        <p className="m-0 mb-2.5 text-[14px] text-ink/55 leading-snug">
          Selecciona observando el rostro del cliente en luz natural.
        </p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
          {TONE_SWATCHES.map((label) => {
            const active = draft.skin.tone === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setTone(label)}
                aria-pressed={active}
                className={`flex flex-col items-stretch gap-1.5 p-2.5 rounded-md cursor-pointer bg-white text-left transition-colors ${
                  active ? "border-2 border-ink" : "border border-line hover:border-ink/40"
                }`}
              >
                <span
                  aria-hidden
                  className="w-full h-10 rounded"
                  style={{ background: TONE_HEX[label] }}
                />
                <span className="text-[13px] font-medium leading-tight">{label}</span>
              </button>
            );
          })}
        </div>
        {errors["skin.tone"]?.[0] ? (
          <span className="block mt-1.5 text-xs text-err">{errors["skin.tone"][0]}</span>
        ) : null}

        <div className="mt-4">
          <span className="block text-[13px] font-semibold tracking-[0.08em] uppercase text-ink/55 mb-2">
            Subtono <span className="font-normal text-ink/45">· opcional</span>
          </span>
          <p className="m-0 mb-2 text-[13.5px] text-ink/55 leading-snug">
            Test de venas en muñeca: azules = frío · verdes = cálido · ambas = neutro.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUBTONES.map((s) => (
              <ChipButton
                key={s}
                size="sm"
                active={draft.skin.subtone === s}
                onClick={() => setSubtone(s)}
              >
                {SUBTONE_LABELS[s]}
              </ChipButton>
            ))}
          </div>
        </div>
      </div>

      {/* Concerns */}
      <div className="mb-6">
        <Label>
          Preocupaciones prioritarias{" "}
          <span className="font-normal text-ink/45">
            · opcional · máximo {MAX_CONCERNS} ({draft.skin.concerns.length}/{MAX_CONCERNS})
          </span>
        </Label>
        <p className="m-0 mb-2.5 text-[14px] text-ink/55 leading-snug">
          Lo que el cliente quisiera mejorar. Usa estos chips para entender qué le importa más.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_CONCERNS.map((c) => {
            const active = draft.skin.concerns.includes(c);
            const muted = !active && draft.skin.concerns.length >= MAX_CONCERNS;
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
      </div>

      {/* Intereses */}
      <div className="mb-6">
        <Label>Intereses de belleza * · elige al menos uno</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(INTEREST_GROUPS).map(([group, items]) => (
            <article key={group} className="bg-bone rounded-[10px] p-3">
              <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
                {group}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {items.map((it) => (
                  <ChipButton
                    key={it}
                    size="sm"
                    active={draft.interests.includes(it)}
                    onClick={() => toggleInterest(it)}
                  >
                    {it}
                  </ChipButton>
                ))}
              </div>
            </article>
          ))}
        </div>
        {errors.interests?.[0] ? (
          <span className="block mt-1.5 text-xs text-err">{errors.interests[0]}</span>
        ) : null}
      </div>

      {/* Rutina */}
      <div className="mb-5">
        <Label>Rutina actual *</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <article className="bg-bone rounded-[10px] p-3">
            <div className="text-[15.5px] font-medium text-ink/70 mb-2">
              ¿Cuándo aplica su rutina? · elige una o varias
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ROUTINE_TIMINGS.map((id) => (
                <ChipButton
                  key={id}
                  active={draft.routineTiming.includes(id)}
                  onClick={() => toggleTiming(id)}
                >
                  {TIMING_LABELS[id]}
                </ChipButton>
              ))}
            </div>
            {errors.routineTiming?.[0] ? (
              <span className="block mt-1.5 text-xs text-err">{errors.routineTiming[0]}</span>
            ) : null}
          </article>

          <article className="bg-bone rounded-[10px] p-3">
            <div className="text-[15.5px] font-medium text-ink/70 mb-2">Nivel de elaboración</div>
            <div className="flex flex-wrap gap-1.5">
              {ROUTINE_LEVELS.map((id) => (
                <ChipButton
                  key={id}
                  active={draft.routine === id}
                  onClick={() => update("routine", id)}
                >
                  {LEVEL_LABELS[id]}
                </ChipButton>
              ))}
            </div>
          </article>
        </div>
      </div>

      {/* Ingredientes preferidos / a evitar */}
      <div className="mb-6">
        <Label>
          Ingredientes <span className="font-normal text-ink/45">· opcional</span>
        </Label>
        <p className="m-0 mb-2.5 text-[14px] text-ink/55 leading-snug">
          Lo que al cliente le gusta o prefiere evitar. Alimenta el ranking suave —
          las alergias reales van en el campo de abajo.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <article className="bg-bone rounded-[10px] p-3">
            <div className="text-[15.5px] font-medium text-ink/70 mb-2 inline-flex items-center gap-1.5">
              <span className="text-ok">✓</span> Preferidos
            </div>
            <div className="flex flex-wrap gap-1.5">
              {INGREDIENT_TAGS.map((tag) => (
                <ChipButton
                  key={`pref-${tag}`}
                  size="sm"
                  active={draft.preferredIngredients.includes(tag)}
                  onClick={() => togglePreferred(tag)}
                >
                  {tag}
                </ChipButton>
              ))}
            </div>
          </article>
          <article className="bg-bone rounded-[10px] p-3">
            <div className="text-[15.5px] font-medium text-ink/70 mb-2 inline-flex items-center gap-1.5">
              <span className="text-warn">⊘</span> A evitar
            </div>
            <div className="flex flex-wrap gap-1.5">
              {INGREDIENT_TAGS.map((tag) => (
                <ChipButton
                  key={`avoid-${tag}`}
                  size="sm"
                  active={draft.avoidedIngredients.includes(tag)}
                  onClick={() => toggleAvoided(tag)}
                >
                  {tag}
                </ChipButton>
              ))}
            </div>
          </article>
        </div>
      </div>

      {/* Alergias */}
      <article className="bg-bone border border-line rounded-[10px] p-3.5 flex gap-2.5 items-start">
        <span className="text-ink/60 mt-0.5">
          <Icon name="warning" size={16} />
        </span>
        <div className="flex-1">
          <div className="text-[16px] font-semibold mb-2">Alergias conocidas *</div>
          <Input
            placeholder='p.ej. fragancia, parabenos, níquel… o escribe "ninguna"'
            value={draft.allergiesText}
            onChange={(e) => update("allergiesText", e.target.value)}
            className="bg-white"
          />
        </div>
      </article>
    </>
  );
}


function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
      {children}
    </div>
  );
}
