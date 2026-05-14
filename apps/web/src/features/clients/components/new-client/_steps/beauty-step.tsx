"use client";

import { Icon, Input } from "@/components/primitives";
import {
  INTEREST_GROUPS,
  ROUTINE_LEVELS,
  ROUTINE_TIMINGS,
  SKIN_TYPES,
} from "../../../schemas/new-client.schema";
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

export interface BeautyStepProps {
  draft: Draft;
  errors: FieldErrors;
  update<K extends keyof Draft>(key: K, value: Draft[K]): void;
  toggleInterest: (value: string) => void;
  toggleTiming: (value: (typeof ROUTINE_TIMINGS)[number]) => void;
}

export function BeautyStep({ draft, errors, update, toggleInterest, toggleTiming }: BeautyStepProps) {
  return (
    <>
      <StepHeader eyebrow="PASO 2 · PERFIL DE BELLEZA" title="Esencial para recomendar bien" />

      <div className="mb-5">
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

      <div className="mb-5">
        <Label>Intereses de belleza * · elige al menos una</Label>
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
    <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2.5">
      {children}
    </div>
  );
}
