"use client";

import { useMemo, useState, useTransition } from "react";
import { Avatar, Button, Icon, Input } from "@/components/primitives";
import { Card, Stepper } from "@/components/patterns";
import type { Client } from "@/types/client";
import type { Product, Sku } from "@/types/product";
import type { ProductTech } from "@/types/product-tech";
import type { SampleInventoryItem } from "@/server/repositories/sample.repository";
import { VISIT_ONLY_MOTIVES, type VisitMotive } from "@/types/visit-motive";
import { FOLLOWUP_TYPES, type FollowupType } from "@/types/followup-task";
import { registerVisit } from "../actions/register-visit";
import type { RegisterVisitInput } from "../schemas/register-visit.schema";
import { CompatibilityPicker } from "./compatibility-picker";

const WIZARD_STEPS = [
  { label: "Motivo" },
  { label: "Recomendar" },
  { label: "Muestras" },
  { label: "Seguimiento" },
] as const;

const STEP_INDEX = {
  MOTIVE: 0,
  RECS: 1,
  SAMPLES: 2,
  FOLLOWUP: 3,
} as const;

const LAST_STEP = WIZARD_STEPS.length - 1;

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function addDaysISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
}

export interface RegisterVisitFormProps {
  client: Client;
  products: readonly Product[];
  /** Optional ficha técnica map — enables age/routine/timing/active-allergy signals in the picker. */
  techs?: ReadonlyMap<Sku, ProductTech>;
  /** Sample inventory — filters step 3 to only products with stock available. */
  sampleInventory: readonly SampleInventoryItem[];
  baName: string;
}

export function RegisterVisitForm({
  client,
  products,
  techs,
  sampleInventory,
  baName,
}: RegisterVisitFormProps) {
  const [step, setStep] = useState<number>(STEP_INDEX.MOTIVE);

  const [motive, setMotive] = useState<VisitMotive>("browse");
  const [notes, setNotes] = useState("");
  const [recSkus, setRecSkus] = useState<string[]>([]);
  const [sampleSkus, setSampleSkus] = useState<string[]>([]);
  const [samplesPrefilled, setSamplesPrefilled] = useState(false);

  const [showFollowup, setShowFollowup] = useState(false);
  const [followupType, setFollowupType] = useState<FollowupType>("call");
  const [followupDescription, setFollowupDescription] = useState("");
  const [followupDueAt, setFollowupDueAt] = useState<string>(addDaysISO(7));
  const [followupPrefilled, setFollowupPrefilled] = useState(false);

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  // Build maps for sample step: which products have a sample available and in stock?
  const inventoryBySku = useMemo(
    () => new Map(sampleInventory.map((i) => [i.sku, i])),
    [sampleInventory],
  );

  const samplableProducts = useMemo(
    () =>
      products.filter((p) => {
        if (!p.sampleSku) return false;
        const item = inventoryBySku.get(p.sampleSku as unknown as string);
        return item != null && item.have > 0;
      }),
    [products, inventoryBySku],
  );

  function goNext() {
    // Cuando entras al paso de muestras la primera vez, precarga los productos
    // recomendados que sí tengan sample disponible — la BA puede quitar/agregar.
    if (step === STEP_INDEX.RECS && !samplesPrefilled) {
      const recsWithSample = recSkus.filter((sku) => {
        const product = products.find((p) => (p.sku as unknown as string) === sku);
        if (!product?.sampleSku) return false;
        const item = inventoryBySku.get(product.sampleSku as unknown as string);
        return item != null && item.have > 0;
      });
      if (recsWithSample.length > 0) {
        setSampleSkus(recsWithSample);
      }
      setSamplesPrefilled(true);
    }
    // Al entrar al paso de Seguimiento por primera vez: si hay muestras dadas
    // pre-rellena la sección con plantilla auto-armada (WhatsApp + 14d +
    // descripción "Pedir feedback de X a {firstName}"). El cierre del ciclo
    // de muestra siempre debe nacer del sistema, no de la memoria del BA.
    if (step === STEP_INDEX.SAMPLES && !followupPrefilled && sampleSkus.length > 0) {
      const sampleLines = sampleSkus.map((sku) => {
        const product = products.find((p) => (p.sku as unknown as string) === sku);
        return product?.line ?? sku;
      });
      const productList =
        sampleLines.length === 1
          ? sampleLines[0]
          : `${sampleLines.slice(0, -1).join(", ")} y ${sampleLines[sampleLines.length - 1]}`;
      const firstName = client.name.split(/\s+/)[0] ?? client.name;
      setShowFollowup(true);
      setFollowupType("whatsapp");
      setFollowupDescription(`Pedir feedback de ${productList} a ${firstName}`);
      setFollowupDueAt(addDaysISO(14));
      setFollowupPrefilled(true);
    }
    setStep((s) => Math.min(s + 1, LAST_STEP));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function onSubmit() {
    const input: RegisterVisitInput = {
      clientId: client.id,
      motive,
      samples: sampleSkus,
      recommendations: recSkus,
      ...(notes ? { notes } : {}),
      ...(showFollowup
        ? {
            followup: {
              type: followupType,
              description: followupDescription,
              dueAt: followupDueAt,
            },
          }
        : {}),
    };
    startTransition(async () => {
      const result = await registerVisit(input);
      if (result && !result.ok) setErrors(result.fieldErrors ?? {});
    });
  }

  return (
    <Card variant="luxe" className="flex flex-col gap-5">
      {/* Header */}
      <header className="flex flex-col gap-3">
        <div>
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            Registrar visita
          </div>
          <h2 className="m-0 mt-1 font-display text-[30px] leading-tight tracking-[-0.01em]">
            Atender una visita
          </h2>
          <p className="m-0 mt-1.5 text-[15px] text-ink/60 leading-snug">
            Usa esta vista cuando la clienta vino pero no hubo venta. Se atribuye automáticamente a{" "}
            <strong className="text-ink">{baName}</strong>.
          </p>
        </div>
        <Stepper steps={WIZARD_STEPS} current={step} onStepClick={(idx) => setStep(idx)} />
      </header>

      {/* Client banner */}
      <article className="bg-bone rounded-xl px-4 py-3 flex items-center gap-3.5">
        <Avatar initials={initials(client.name)} size={48} />
        <div className="flex-1 min-w-0">
          <div className="text-[16px] font-semibold leading-tight">{client.name}</div>
          <div className="text-[14px] text-ink/60 leading-tight mt-0.5 truncate">
            {client.phone} · {client.email}
          </div>
        </div>
      </article>

      {/* Step content */}
      <div className="min-h-[280px]">
        {step === STEP_INDEX.MOTIVE && (
          <StepMotive
            motive={motive}
            onChangeMotive={setMotive}
            notes={notes}
            onChangeNotes={setNotes}
            error={errors.motive?.[0]}
          />
        )}

        {step === STEP_INDEX.RECS && (
          <StepRecs
            client={client}
            products={products}
            techs={techs}
            selected={recSkus}
            onChange={setRecSkus}
          />
        )}

        {step === STEP_INDEX.SAMPLES && (
          <StepSamples
            client={client}
            samplableProducts={samplableProducts}
            techs={techs}
            inventoryBySku={inventoryBySku}
            selected={sampleSkus}
            onChange={setSampleSkus}
          />
        )}

        {step === STEP_INDEX.FOLLOWUP && (
          <StepFollowup
            show={showFollowup}
            onToggle={setShowFollowup}
            type={followupType}
            onChangeType={setFollowupType}
            description={followupDescription}
            onChangeDescription={setFollowupDescription}
            dueAt={followupDueAt}
            onChangeDueAt={setFollowupDueAt}
            errors={errors}
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex items-center justify-between pt-2 border-t border-line">
        <Button variant="ghost" onClick={goBack} disabled={step === 0}>
          ← Anterior
        </Button>
        <div className="text-[13.5px] text-ink/55 tabular">
          Paso {step + 1} de {WIZARD_STEPS.length}
        </div>
        {step < LAST_STEP ? (
          <Button
            variant="primary"
            onClick={goNext}
            trailing={<Icon name="arrow-right" />}
          >
            {stepCtaLabel(step)}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={onSubmit}
            loading={isPending}
            trailing={<Icon name="check" />}
          >
            Guardar visita
          </Button>
        )}
      </nav>
    </Card>
  );
}

function stepCtaLabel(step: number): string {
  if (step === STEP_INDEX.MOTIVE) return "Siguiente";
  return "Saltar / Siguiente";
}

// ── Step 1: Motivo + notas ────────────────────────────────────────────────
function StepMotive({
  motive,
  onChangeMotive,
  notes,
  onChangeNotes,
  error,
}: {
  motive: VisitMotive;
  onChangeMotive: (m: VisitMotive) => void;
  notes: string;
  onChangeNotes: (n: string) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <section>
        <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2.5">
          Motivo de la visita *
        </div>
        <p className="m-0 mb-3 text-[14px] text-ink/55 leading-snug">
          ¿Por qué vino la clienta hoy? Esto se guarda con la interacción para entender patrones de
          visita.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {VISIT_ONLY_MOTIVES.map((m) => {
            const active = motive === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onChangeMotive(m.id)}
                aria-pressed={active}
                className={`inline-flex items-center h-9 px-4 rounded-full border text-[13.5px] font-semibold cursor-pointer transition-colors ${
                  active
                    ? "bg-ink text-paper border-ink"
                    : "bg-white text-ink border-line hover:bg-bone"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
        {error ? <span className="block mt-1.5 text-xs text-err">{error}</span> : null}
      </section>

      <section>
        <label
          htmlFor="visit-notes"
          className="block text-[14.5px] font-semibold tracking-[0.02em] text-ink/70 mb-1.5"
        >
          Notas (opcional)
        </label>
        <textarea
          id="visit-notes"
          value={notes}
          onChange={(e) => onChangeNotes(e.target.value)}
          rows={4}
          placeholder="Lo que conversaron, productos que vio, inquietudes…"
          className="w-full rounded-[10px] border border-line bg-white px-[14px] py-2.5 text-[15px] text-ink outline-none placeholder:text-ink/40 focus-visible:border-ink resize-y"
        />
      </section>
    </div>
  );
}

// ── Step 2: Recomendaciones ───────────────────────────────────────────────
function StepRecs({
  client,
  products,
  techs,
  selected,
  onChange,
}: {
  client: Client;
  products: readonly Product[];
  techs?: ReadonlyMap<Sku, ProductTech>;
  selected: readonly string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-1.5">
          ¿Qué le recomendaste?
        </div>
        <p className="m-0 text-[14px] text-ink/55 leading-snug">
          Productos que sugeriste para que vea más adelante. La app rankea por compatibilidad con su
          perfil; abre la ficha técnica desde la card del producto en el catálogo para ver claims
          clínicos y activos. Si no hubo recomendaciones, salta este paso.
        </p>
      </div>
      <CompatibilityPicker
        client={client}
        products={products}
        techs={techs}
        selected={selected}
        onChange={onChange}
      />
    </section>
  );
}

// ── Step 3: Muestras (filtrado por inventario) ────────────────────────────
function StepSamples({
  client,
  samplableProducts,
  techs,
  inventoryBySku,
  selected,
  onChange,
}: {
  client: Client;
  samplableProducts: readonly Product[];
  techs?: ReadonlyMap<Sku, ProductTech>;
  inventoryBySku: ReadonlyMap<string, SampleInventoryItem>;
  selected: readonly string[];
  onChange: (next: string[]) => void;
}) {
  if (samplableProducts.length === 0) {
    return (
      <section className="flex flex-col gap-3">
        <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          Muestras
        </div>
        <p className="m-0 text-[15px] text-ink/55 leading-snug">
          No hay productos con muestra disponible en tu inventario actual. Bases, correctores y
          labiales no tienen sample formal (testers en tienda); skincare y fragancias hero sí —
          revisa el inventario en /ba/samples si crees que falta uno.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-1.5">
          ¿Le diste alguna muestra?
        </div>
        <p className="m-0 text-[14px] text-ink/55 leading-snug">
          Solo se muestran productos con muestra disponible en inventario. Los productos que ya
          recomendaste y tienen muestra están pre-seleccionados — puedes quitarlos si no entregaste
          la muestra.
        </p>
      </div>
      <CompatibilityPicker
        client={client}
        products={samplableProducts}
        techs={techs}
        selected={selected}
        onChange={onChange}
        topN={samplableProducts.length}
      />
      <SampleStockHint products={samplableProducts} inventoryBySku={inventoryBySku} selected={selected} />
    </section>
  );
}

function SampleStockHint({
  products,
  inventoryBySku,
  selected,
}: {
  products: readonly Product[];
  inventoryBySku: ReadonlyMap<string, SampleInventoryItem>;
  selected: readonly string[];
}) {
  const selectedItems = selected
    .map((sku) => products.find((p) => (p.sku as unknown as string) === sku))
    .filter((p): p is Product => p != null);
  if (selectedItems.length === 0) return null;

  return (
    <div className="rounded-md bg-bone border border-line px-3 py-2 text-[13px] text-ink/60 leading-snug">
      <span className="font-semibold text-ink/75">Stock muestras:</span>{" "}
      {selectedItems
        .map((p) => {
          const inv = p.sampleSku ? inventoryBySku.get(p.sampleSku as unknown as string) : null;
          if (!inv) return null;
          return `${p.line} (${inv.have})`;
        })
        .filter(Boolean)
        .join(" · ")}
    </div>
  );
}

// ── Step 4: Seguimiento ───────────────────────────────────────────────────
function StepFollowup({
  show,
  onToggle,
  type,
  onChangeType,
  description,
  onChangeDescription,
  dueAt,
  onChangeDueAt,
  errors,
}: {
  show: boolean;
  onToggle: (b: boolean) => void;
  type: FollowupType;
  onChangeType: (t: FollowupType) => void;
  description: string;
  onChangeDescription: (s: string) => void;
  dueAt: string;
  onChangeDueAt: (s: string) => void;
  errors: Record<string, string[]>;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-1.5">
          ¿Programar seguimiento?
        </div>
        <p className="m-0 text-[14px] text-ink/55 leading-snug">
          Opcional. Si agendas una tarea, aparecerá en tu inbox de Seguimientos hasta que la marques
          como hecha.
        </p>
      </div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={show}
          onChange={(e) => onToggle(e.target.checked)}
          className="mt-1 w-[18px] h-[18px] accent-ink shrink-0"
        />
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] font-semibold leading-tight">
            Sí, agendar tarea post-visita
          </span>
          <span className="block text-[13.5px] text-ink/60 leading-snug mt-0.5">
            Llamada, WhatsApp, feedback de muestra o cita.
          </span>
        </span>
      </label>
      {show ? (
        <div className="pl-9 pr-1 flex flex-col gap-3">
          <div>
            <div className="text-[12.5px] font-semibold text-ink/70 mb-1.5">Tipo</div>
            <div className="flex flex-wrap gap-1.5">
              {FOLLOWUP_TYPES.map((ft) => {
                const active = type === ft.id;
                return (
                  <button
                    key={ft.id}
                    type="button"
                    onClick={() => onChangeType(ft.id)}
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
              placeholder='ej. "Llamar para feedback de muestra Génifique"'
              value={description}
              onChange={(e) => onChangeDescription(e.target.value)}
              {...(errors["followup.description"]?.[0]
                ? { error: errors["followup.description"][0] }
                : {})}
            />
            <Input
              label="Vence *"
              type="date"
              value={dueAt}
              min={todayISO()}
              onChange={(e) => onChangeDueAt(e.target.value)}
              {...(errors["followup.dueAt"]?.[0]
                ? { error: errors["followup.dueAt"][0] }
                : {})}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
