"use client";

import { Input } from "@/components/primitives";
import {
  AGE_RANGES,
  DIAL_CODES,
  GENDER_OPTIONS,
} from "../../../schemas/new-client.schema";
import { ChipButton } from "../_parts/chip-button";
import { StepHeader } from "../_parts/step-header";
import type { Draft, FieldErrors } from "../types";
import type { AgeRange } from "@/types/client";

/** Edad en años cumplidos a la fecha; null si la fecha es inválida o futura. */
function ageFromBirthday(iso: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 ? age : null;
}

function ageRangeFromAge(age: number | null): AgeRange | "" {
  if (age == null) return "";
  if (age < 18) return "";
  if (age <= 24) return "18-24";
  if (age <= 34) return "25-34";
  if (age <= 44) return "35-44";
  if (age <= 54) return "45-54";
  if (age <= 64) return "55-64";
  return "65+";
}

export interface IdentityStepProps {
  draft: Draft;
  errors: FieldErrors;
  update<K extends keyof Draft>(key: K, value: Draft[K]): void;
}

export function IdentityStep({ draft, errors, update }: IdentityStepProps) {
  const derivedAge = ageFromBirthday(draft.birthday);
  const derivedRange = ageRangeFromAge(derivedAge);

  function onBirthdayChange(iso: string) {
    update("birthday", iso);
    update("ageRange", ageRangeFromAge(ageFromBirthday(iso)));
  }
  return (
    <>
      <StepHeader eyebrow="PASO 1 · IDENTIDAD" title="¿A quién vamos a consentir?" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Nombre(s) *"
          placeholder="María Fernanda"
          autoFocus
          value={draft.firstName}
          onChange={(e) => update("firstName", e.target.value)}
          {...(errors.firstName?.[0] ? { error: errors.firstName[0] } : {})}
        />
        <Input
          label="Apellido(s) *"
          placeholder="González Ruíz"
          value={draft.lastName}
          onChange={(e) => update("lastName", e.target.value)}
          {...(errors.lastName?.[0] ? { error: errors.lastName[0] } : {})}
        />

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink/60 tracking-[0.02em]">
            Teléfono celular *
          </span>
          <div className="flex gap-1.5">
            <select
              value={draft.dialCode}
              onChange={(e) => update("dialCode", e.target.value)}
              className="h-10 w-[120px] flex-none rounded-[10px] border border-line bg-white px-3 text-sm text-ink outline-none cursor-pointer focus-visible:border-ink"
              aria-label="Código de país"
            >
              {DIAL_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label} {c.code}
                </option>
              ))}
            </select>
            <Input
              type="tel"
              inputMode="numeric"
              placeholder="55 1234 5678"
              value={draft.phone}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                update("phone", digitsOnly);
              }}
              className="flex-1"
              maxLength={10}
              {...(errors.phone?.[0] ? { error: errors.phone[0] } : {})}
            />
          </div>
        </div>

        <Input
          label="Correo electrónico *"
          type="email"
          placeholder="maria@correo.com"
          value={draft.email}
          onChange={(e) => update("email", e.target.value)}
          {...(errors.email?.[0] ? { error: errors.email[0] } : {})}
        />

        <Input
          label="Fecha de nacimiento *"
          type="date"
          value={draft.birthday}
          onChange={(e) => onBirthdayChange(e.target.value)}
          {...(errors.birthday?.[0] ? { error: errors.birthday[0] } : {})}
        />

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-ink/60 tracking-[0.02em]">Género *</span>
          <div className="flex flex-wrap gap-1.5">
            {GENDER_OPTIONS.map((g) => (
              <ChipButton key={g} active={draft.gender === g} onClick={() => update("gender", g)}>
                {g}
              </ChipButton>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <span className="text-xs font-semibold text-ink/60 tracking-[0.02em]">
          Rango de edad{" "}
          <span className="font-normal text-ink/45">
            · calculado automáticamente
            {derivedAge != null ? ` · ${derivedAge} años` : ""}
          </span>
        </span>
        <div className="flex flex-wrap gap-1.5">
          {AGE_RANGES.map((r) => (
            <ChipButton key={r} active={derivedRange === r} disabled>
              {r}
            </ChipButton>
          ))}
        </div>
        {errors.ageRange?.[0] && !derivedRange ? (
          <span className="text-xs text-err">{errors.ageRange[0]}</span>
        ) : null}
      </div>

      <p className="m-0 mt-4 text-[16.5px] font-medium text-ink/60">
        Todos los campos son obligatorios. La validación ocurre al pasar al siguiente paso.
      </p>
    </>
  );
}
