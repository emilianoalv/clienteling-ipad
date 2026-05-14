"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { Client } from "@/types/client";
import type { BrandId } from "@/types/brand";
import type { Product, Sku } from "@/types/product";
import { BrandTag, Button, Icon } from "@/components/primitives";
import { Card, KvRow } from "@/components/patterns";
import { formatCurrency } from "@/lib/format/format-currency";
import { saveRecommendation } from "../actions/save-recommendation";
import { SKIN_TYPES, type SkinType, type Tone } from "../schemas/save-recommendation.schema";

/**
 * The next-intl `t` is typed against the generated `IntlMessages` union. The
 * union of all leaf paths in the project's JSON is large enough that some
 * dynamically-built keys (e.g. `consultation.skin_type.${SKIN_KEY[s]}`) and
 * even some static keys hit TS's display limits. This shim widens the call
 * signature so we don't have to cast at every call site — the corresponding
 * keys are still listed in `messages/es-MX.json` and `messages/en-US.json`,
 * so a missing key is caught at runtime by next-intl.
 */
type Translator = (key: string, params?: Record<string, string | number>) => string;
import { suggestProducts } from "../services/suggest-products";

const CONCERNS: readonly string[] = [
  "Luminosidad",
  "Líneas finas",
  "Arrugas profundas",
  "Firmeza",
  "Manchas",
  "Poros",
  "Textura",
  "Hidratación",
  "Ojeras",
  "Rojeces",
  "Sensibilidad",
  "Acné adulto",
];

const TONE_SWATCHES: ReadonlyArray<[Tone, string]> = [
  ["Muy claro", "#F5E0CE"],
  ["Claro", "#EFCEB4"],
  ["Medio", "#D9AE8B"],
  ["Medio cálido", "#C69978"],
  ["Oscuro", "#8F5E3D"],
  ["Muy oscuro", "#5E3A22"],
];

const ROUTINE = {
  morning: ["Limpiador", "Sérum", "Hidratante", "SPF"],
  evening: ["Desmaquillante", "Tónico", "Tratamiento", "Crema noche"],
} as const;

const MAX_CONCERNS = 3;
const STEP_COUNT = 5;

export interface ConsultationWizardProps {
  client: Client;
  products: readonly Product[];
  brandScope?: readonly BrandId[];
}

export function ConsultationWizard({ client, products, brandScope }: ConsultationWizardProps) {
  const t = useTranslations() as unknown as Translator;
  const [step, setStep] = useState(0);
  const [skinType, setSkinType] = useState<SkinType>("Mixta");
  const [concerns, setConcerns] = useState<readonly string[]>(["Luminosidad", "Líneas finas"]);
  const [tone, setTone] = useState<Tone>("Medio cálido");
  const [selectedSkus, setSelectedSkus] = useState<readonly Sku[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const suggestions = useMemo(
    () => suggestProducts(products, { skinType, concerns, brands: brandScope }, 6),
    [products, skinType, concerns, brandScope],
  );

  function toggleConcern(c: string) {
    setConcerns((prev) => {
      if (prev.includes(c)) return prev.filter((x) => x !== c);
      if (prev.length >= MAX_CONCERNS) return prev;
      return [...prev, c];
    });
  }

  function toggleSku(sku: Sku) {
    setSelectedSkus((prev) =>
      prev.includes(sku) ? prev.filter((s) => s !== sku) : [...prev, sku],
    );
  }

  function onSubmit() {
    setError(null);
    if (concerns.length === 0) {
      setError(t("consultation.error.no_concerns"));
      setStep(1);
      return;
    }
    if (selectedSkus.length === 0) {
      setError(t("consultation.error.no_items"));
      setStep(STEP_COUNT - 1);
      return;
    }
    startTransition(async () => {
      const result = await saveRecommendation({
        clientId: client.id,
        skinType,
        concerns: [...concerns],
        tone,
        items: [...selectedSkus],
      });
      if (result && !result.ok) setError(result.message ?? t("consultation.error.save"));
    });
  }

  const isLast = step === STEP_COUNT - 1;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
      <Card variant="luxe" className="flex flex-col gap-5">
        <header>
          <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            {t("consultation.eyebrow", { name: client.name })}
          </span>
          <h2 className="m-0 font-display text-[36px] leading-tight tracking-[-0.01em]">
            {t("consultation.title")}
          </h2>
          <p className="m-0 mt-1 text-[16px] font-medium leading-snug text-ink/60">
            {t("consultation.subtitle")}
          </p>
        </header>

        <Stepper step={step} onStep={setStep} t={t} />

        <div className="min-h-[260px]">
          {step === 0 ? (
            <SkinTypeStep value={skinType} onChange={setSkinType} t={t} />
          ) : step === 1 ? (
            <ConcernsStep value={concerns} onToggle={toggleConcern} t={t} />
          ) : step === 2 ? (
            <ToneStep value={tone} onChange={setTone} />
          ) : step === 3 ? (
            <RoutineStep t={t} />
          ) : (
            <RecommendationStep
              suggestions={suggestions}
              selected={selectedSkus}
              onToggle={toggleSku}
              t={t}
              context={{ name: client.name, skinType, concerns }}
            />
          )}
        </div>

        {error ? (
          <p className="m-0 text-[16px] font-medium leading-snug text-err">{error}</p>
        ) : null}

        <footer className="flex justify-between gap-3 pt-5 border-t border-line">
          <Button
            variant="ghost"
            leading={<Icon name="arrow-left" />}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            {t("consultation.back")}
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" disabled aria-disabled="true">
              {t("consultation.save_draft")}
            </Button>
            {isLast ? (
              <Button
                variant="primary"
                onClick={onSubmit}
                loading={isPending}
                trailing={<Icon name="arrow-right" />}
              >
                {t("consultation.create_recommendation")}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => setStep((s) => Math.min(STEP_COUNT - 1, s + 1))}
                trailing={<Icon name="arrow-right" />}
              >
                {t("consultation.next")}
              </Button>
            )}
          </div>
        </footer>
      </Card>

      <aside className="flex flex-col gap-4 sticky top-4">
        <Card>
          <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            {t("consultation.summary")}
          </span>
          <div className="mt-3">
            <KvRow label={t("consultation.summary_field.skin_type")} value={skinType} />
            <KvRow
              label={t("consultation.summary_field.concerns")}
              value={t("consultation.concerns_count", { count: concerns.length })}
            />
            <KvRow label={t("consultation.summary_field.tone")} value={tone} />
            <KvRow
              label={t("consultation.summary_field.products")}
              value={t("consultation.products_count", { count: selectedSkus.length })}
              dashed={false}
            />
          </div>
          <hr className="my-3 border-0 border-t border-dashed border-line" />
          <p className="m-0 text-[15px] font-medium leading-snug text-ink/60">
            {t("consultation.autosave_hint")}
          </p>
        </Card>
        <Card>
          <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            {t("consultation.integration.title")}
          </span>
          <div className="mt-2.5 flex items-center gap-2.5">
            <span aria-hidden className="inline-block w-2.5 h-2.5 rounded-full bg-warn" />
            <span className="text-[16px] font-semibold">{t("consultation.integration.modiface")}</span>
          </div>
          <p className="m-0 mt-1 text-[16px] font-medium leading-snug text-ink/60">
            {t("consultation.integration.hint")}
          </p>
        </Card>
        <Link
          href={`/ba/clients/${client.id}`}
          className="text-[16px] font-medium text-ink/60 hover:text-ink no-underline"
        >
          ← {t("consultation.back_to_profile")}
        </Link>
      </aside>
    </div>
  );
}

function Stepper({
  step,
  onStep,
  t,
}: {
  step: number;
  onStep(s: number): void;
  t: Translator;
}) {
  return (
    <div className="flex gap-0 bg-bone rounded-md p-1">
      {Array.from({ length: STEP_COUNT }, (_, i) => {
        const active = step === i;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onStep(i)}
            aria-pressed={active}
            className={`flex-1 h-10 border-0 rounded text-[16px] font-semibold cursor-pointer transition-shadow ${
              active
                ? "bg-white text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                : "bg-transparent text-ink/60"
            }`}
          >
            {i + 1}. {t(`consultation.step.${STEP_KEYS[i]!}`)}
          </button>
        );
      })}
    </div>
  );
}

const STEP_KEYS = ["skin_type", "concerns", "tone", "routine", "recommendation"] as const;

function SkinTypeStep({
  value,
  onChange,
  t,
}: {
  value: SkinType;
  onChange(v: SkinType): void;
  t: Translator;
}) {
  return (
    <div>
      <span className="block text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-3">
        {t("consultation.skin_type.eyebrow")}
      </span>
      <div className="grid grid-cols-4 gap-3">
        {SKIN_TYPES.map((s) => {
          const active = value === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              aria-pressed={active}
              className={`p-5 rounded-md cursor-pointer text-left bg-white border ${
                active ? "border-2 border-ink" : "border-line"
              }`}
            >
              <div className="font-display text-[22px] leading-tight">{s}</div>
              <div className="mt-0.5 text-[15px] font-medium leading-snug text-ink/60">
                {t(`consultation.skin_type.${SKIN_KEY[s]}`)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const SKIN_KEY: Record<SkinType, string> = {
  Seca: "dry",
  Normal: "normal",
  Mixta: "mixed",
  Grasa: "oily",
};

function ConcernsStep({
  value,
  onToggle,
  t,
}: {
  value: readonly string[];
  onToggle(c: string): void;
  t: Translator;
}) {
  return (
    <div>
      <span className="block text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-3">
        {t("consultation.concerns.eyebrow", { max: MAX_CONCERNS })}
      </span>
      <div className="flex flex-wrap gap-2">
        {CONCERNS.map((c) => {
          const active = value.includes(c);
          return (
            <button
              key={c}
              type="button"
              onClick={() => onToggle(c)}
              aria-pressed={active}
              className={`h-9 px-4 rounded-pill cursor-pointer text-[16px] font-medium border ${
                active
                  ? "bg-ink text-paper border-ink"
                  : "bg-white text-ink border-line hover:border-ink/40"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>
      <div className="mt-5 flex items-center gap-3.5 px-4 py-3 bg-bone rounded-md">
        <Icon name="camera" />
        <div className="flex-1">
          <div className="text-[16px] font-semibold leading-tight">
            {t("consultation.concerns.photo.title")}
          </div>
          <div className="text-[15px] font-medium leading-snug text-ink/60">
            {t("consultation.concerns.photo.hint")}
          </div>
        </div>
        <Button variant="ghost" size="sm" disabled aria-disabled="true">
          {t("consultation.concerns.photo.cta")}
        </Button>
      </div>
    </div>
  );
}

function ToneStep({ value, onChange }: { value: Tone; onChange(v: Tone): void }) {
  return (
    <div>
      <span className="block text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-3">
        Undertone
      </span>
      <div className="flex gap-2.5">
        {TONE_SWATCHES.map(([label, color]) => {
          const active = value === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onChange(label)}
              aria-pressed={active}
              className={`flex-1 p-3 rounded-md cursor-pointer bg-white border ${
                active ? "border-2 border-ink" : "border-line"
              }`}
            >
              <div className="w-full h-12 rounded mb-2" style={{ background: color }} />
              <div className="text-[15px] font-medium leading-snug">{label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RoutineStep({ t }: { t: Translator }) {
  const blocks: ReadonlyArray<[string, readonly string[]]> = [
    [t("consultation.routine.morning"), ROUTINE.morning],
    [t("consultation.routine.evening"), ROUTINE.evening],
  ];
  return (
    <div className="grid grid-cols-2 gap-4">
      {blocks.map(([title, steps]) => (
        <Card variant="flat" key={title}>
          <span className="text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            {title}
          </span>
          <ul className="list-none m-0 mt-2 p-0">
            {steps.map((s, i) => (
              <li
                key={s}
                className={`flex items-center gap-2.5 py-2.5 ${
                  i < steps.length - 1 ? "border-b border-dashed border-line" : ""
                }`}
              >
                <span className="inline-flex w-[22px] h-[22px] items-center justify-center rounded-full bg-bone text-[15px] font-semibold">
                  {i + 1}
                </span>
                <span className="text-[16px]">{s}</span>
                <span className="ml-auto text-[15px] text-ink/40">—</span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}

function RecommendationStep({
  suggestions,
  selected,
  onToggle,
  t,
  context,
}: {
  suggestions: readonly Product[];
  selected: readonly Sku[];
  onToggle(sku: Sku): void;
  t: Translator;
  context: { name: string; skinType: SkinType; concerns: readonly string[] };
}) {
  return (
    <div>
      <span className="block text-[15px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-3">
        {t("consultation.recommendation.eyebrow", {
          name: context.name.split(" ")[0] ?? context.name,
          skin: context.skinType,
          concerns: context.concerns.join(", ") || "—",
        })}
      </span>
      {suggestions.length === 0 ? (
        <p className="m-0 text-[16px] font-medium leading-snug text-ink/60">
          {t("consultation.recommendation.empty")}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {suggestions.map((p) => {
            const active = selected.includes(p.sku);
            return (
              <Card variant="flat" key={p.sku} className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className={`inline-flex w-12 h-12 items-center justify-center rounded font-display text-[20px] ${
                      p.brand === "Lancôme"
                        ? "bg-lancome-rose text-lancome-ink"
                        : "bg-ysl-ink text-ysl-gold"
                    }`}
                  >
                    {p.line.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <BrandTag brand={p.brand} alwaysShow />
                    <div className="text-[16px] font-semibold leading-tight mt-1 truncate">
                      {p.line}
                    </div>
                  </div>
                </div>
                <div className="text-[15px] font-medium leading-snug text-ink/60">{p.name}</div>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-[17px] font-semibold tabular">
                    {formatCurrency(p.price)}
                  </span>
                  <Button
                    variant={active ? "primary" : "ghost"}
                    size="sm"
                    leading={<Icon name={active ? "check" : "plus"} />}
                    onClick={() => onToggle(p.sku)}
                  >
                    {active ? t("consultation.recommendation.added") : t("consultation.recommendation.add")}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
