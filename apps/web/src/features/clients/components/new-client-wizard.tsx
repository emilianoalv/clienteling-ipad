"use client";

import { useState, useTransition } from "react";
import type { ZodError } from "zod";
import { Button, Icon } from "@/components/primitives";
import { createClient } from "../actions/create-client";
import {
  CHANNELS,
  newClientSchema,
  type NewClientInput,
} from "../schemas/new-client.schema";
import { IdentityStep } from "./new-client/_steps/identity-step";
import { BeautyStep } from "./new-client/_steps/beauty-step";
import {
  PRIVACY_NOTICE_VERSION,
  PrivacyStep,
} from "./new-client/_steps/privacy-step";
import type { Draft, FieldErrors } from "./new-client/types";

type Step = 0 | 1 | 2;

const STEP_FIELDS: Record<Step, ReadonlyArray<keyof NewClientInput>> = {
  0: [
    "firstName",
    "lastName",
    "phone",
    "dialCode",
    "email",
    "birthday",
    "gender",
    "ageRange",
    "brands",
  ],
  1: ["skin", "routine", "routineTiming", "interests"],
  2: ["acceptPrivacy", "consents"],
};

const INITIAL_DRAFT: Draft = {
  firstName: "",
  lastName: "",
  dialCode: "+52",
  phone: "",
  email: "",
  birthday: "",
  city: "CDMX",
  gender: "Femenino",
  ageRange: "",
  brands: ["Lancôme"],
  // tone "" obliga a la BA a elegir un swatch antes de continuar (UI validation).
  skin: { type: "Normal", concerns: [], tone: "" },
  routine: "Básica",
  routineTiming: ["morning"],
  interests: ["Skincare"],
  allergiesText: "",
  acceptPrivacy: false,
  channels: { WhatsApp: false, Email: true, SMS: true },
};

const STEP_LABELS: ReadonlyArray<{ id: Step; label: string }> = [
  { id: 0, label: "Datos básicos" },
  { id: 1, label: "Intereses" },
  { id: 2, label: "Aviso de privacidad" },
];

export interface NewClientWizardProps {
  storeName?: string;
  baName?: string;
}

export function NewClientWizard({
  storeName = "Liverpool Polanco",
  baName = "Demo User",
}: NewClientWizardProps = {}) {
  const [step, setStep] = useState<Step>(0);
  const [draft, setDraft] = useState<Draft>(INITIAL_DRAFT);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function toggleInterest(value: string) {
    setDraft((d) => ({
      ...d,
      interests: d.interests.includes(value)
        ? d.interests.filter((x) => x !== value)
        : [...d.interests, value],
    }));
  }

  function toggleTiming(value: Draft["routineTiming"][number]) {
    setDraft((d) => ({
      ...d,
      routineTiming: d.routineTiming.includes(value)
        ? d.routineTiming.filter((x) => x !== value)
        : [...d.routineTiming, value],
    }));
  }

  function buildInput(): NewClientInput {
    return {
      firstName: draft.firstName,
      lastName: draft.lastName,
      dialCode: draft.dialCode,
      phone: draft.phone,
      email: draft.email,
      birthday: draft.birthday,
      city: draft.city,
      gender: draft.gender,
      ageRange: draft.ageRange as NewClientInput["ageRange"],
      preferredLang: "es-MX",
      brands: draft.brands as NewClientInput["brands"],
      skin: draft.skin,
      routine: draft.routine,
      routineTiming: draft.routineTiming,
      interests: draft.interests,
      allergies: parseAllergies(draft.allergiesText),
      acceptPrivacy: draft.acceptPrivacy as true,
      consents: CHANNELS.map((channel) => ({
        channel,
        status: draft.channels[channel] ? ("granted" as const) : ("revoked" as const),
      })),
    };
  }

  function validateStep(s: Step): boolean {
    const parsed = newClientSchema.safeParse(buildInput());
    if (parsed.success) {
      setErrors({});
      return true;
    }
    const owned = STEP_FIELDS[s] as readonly string[];
    const scoped: FieldErrors = {};
    for (const [k, v] of Object.entries(flattenIssues(parsed.error))) {
      if (owned.some((f) => k === f || k.startsWith(`${f}.`))) scoped[k] = v;
    }
    setErrors(scoped);
    return Object.keys(scoped).length === 0;
  }

  function firstStepWithErrors(fieldErrors: FieldErrors): Step {
    for (const s of [0, 1, 2] as const) {
      const owned = STEP_FIELDS[s] as readonly string[];
      if (Object.keys(fieldErrors).some((k) => owned.some((f) => k === f || k.startsWith(`${f}.`))))
        return s;
    }
    return 2;
  }

  function onContinue() {
    if (validateStep(step)) {
      setStep((s) => Math.min(2, (s + 1) as Step) as Step);
    }
  }

  function onSubmit() {
    const input = buildInput();
    const parsed = newClientSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors = flattenIssues(parsed.error);
      setErrors(fieldErrors);
      setStep(firstStepWithErrors(fieldErrors));
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await createClient(input);
      if (result && !result.ok) {
        const fieldErrors = (result.fieldErrors ?? {}) as FieldErrors;
        setErrors(fieldErrors);
        if (Object.keys(fieldErrors).length) setStep(firstStepWithErrors(fieldErrors));
      }
    });
  }

  return (
    <div className="max-w-[960px] mx-auto px-2 py-2 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            Nueva clienta
          </div>
          <h2 className="m-0 mt-1 font-display text-[28px] leading-none tracking-[-0.01em]">
            Alta en <span className="italic">3 pasos</span>
          </h2>
        </div>
        <ol className="flex items-center gap-3 m-0 p-0 list-none">
          {STEP_LABELS.map((s, i) => {
            const isCurrent = s.id === step;
            const isDone = s.id < step;
            return (
              <li key={s.id} className="flex items-center gap-3">
                <span className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center justify-center w-[22px] h-[22px] rounded-full text-[15px] font-semibold ${
                      isCurrent
                        ? "bg-ink text-white"
                        : isDone
                          ? "bg-ok text-white"
                          : "bg-bone text-ink/50"
                    }`}
                  >
                    {isDone ? "✓" : s.id + 1}
                  </span>
                  <span
                    className={`text-[16.5px] font-medium ${
                      isCurrent ? "text-ink" : "text-ink/60"
                    }`}
                  >
                    {s.label}
                  </span>
                </span>
                {i < STEP_LABELS.length - 1 ? (
                  <span aria-hidden className="w-9 h-px bg-line" />
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Card */}
      <article className="bg-white border border-line rounded-xl p-6 md:p-8 shadow-[0_1px_2px_rgba(14,14,15,0.03)]">
        {step === 0 && <IdentityStep draft={draft} errors={errors} update={update} />}
        {step === 1 && (
          <BeautyStep
            draft={draft}
            errors={errors}
            update={update}
            toggleInterest={toggleInterest}
            toggleTiming={toggleTiming}
          />
        )}
        {step === 2 && (
          <PrivacyStep
            draft={draft}
            errors={errors}
            update={update}
            storeName={storeName}
            baName={baName}
          />
        )}

        {/* Footer */}
        <div className="flex justify-between items-center mt-7 pt-5 border-t border-line">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, (s - 1) as Step) as Step)}
            disabled={step === 0}
            leading={<Icon name="arrow-left" />}
          >
            Atrás
          </Button>
          <span className="text-xs text-ink/60">
            Paso <strong className="tabular">{step + 1}</strong> de 3
          </span>
          {step < 2 ? (
            <Button variant="primary" onClick={onContinue} trailing={<Icon name="arrow-right" />}>
              Continuar
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={onSubmit}
              loading={isPending}
              trailing={<Icon name="arrow-right" />}
            >
              Guardar clienta
            </Button>
          )}
        </div>
      </article>

      <p className="m-0 text-[15px] text-ink/40 text-center">
        Versión del aviso: {PRIVACY_NOTICE_VERSION}
      </p>
    </div>
  );
}

function flattenIssues(error: ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

function parseAllergies(text: string): string[] {
  const s = text.trim();
  if (!s || /^ningun[ao]s?$/i.test(s)) return [];
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}
