"use client";

import { useState, useTransition } from "react";
import { Avatar, Button, Icon, Input } from "@/components/primitives";
import { Card } from "@/components/patterns";
import type { Client } from "@/types/client";
import type { Product } from "@/types/product";
import { VISIT_MOTIVES, type VisitMotive } from "@/types/visit-motive";
import { FOLLOWUP_TYPES, type FollowupType } from "@/types/followup-task";
import { registerVisit } from "../actions/register-visit";
import type { RegisterVisitInput } from "../schemas/register-visit.schema";
import { CompatibilityPicker } from "./compatibility-picker";

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
  baName: string;
}

export function RegisterVisitForm({ client, products, baName }: RegisterVisitFormProps) {
  const [motive, setMotive] = useState<VisitMotive>("browse");
  const [notes, setNotes] = useState("");

  const [showSamples, setShowSamples] = useState(false);
  const [sampleSkus, setSampleSkus] = useState<string[]>([]);

  const [showRecs, setShowRecs] = useState(false);
  const [recSkus, setRecSkus] = useState<string[]>([]);

  const [showFollowup, setShowFollowup] = useState(false);
  const [followupType, setFollowupType] = useState<FollowupType>("call");
  const [followupDescription, setFollowupDescription] = useState("");
  const [followupDueAt, setFollowupDueAt] = useState<string>(addDaysISO(7));

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isPending, startTransition] = useTransition();

  function onSubmit() {
    const input: RegisterVisitInput = {
      clientId: client.id,
      motive,
      samples: showSamples ? sampleSkus : [],
      recommendations: showRecs ? recSkus : [],
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
    <Card variant="luxe" className="flex flex-col gap-5 max-w-[960px]">
      {/* Header */}
      <header>
        <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          Registrar visita
        </div>
        <h2 className="m-0 mt-1 font-display text-[30px] leading-tight tracking-[-0.01em]">
          Atender una visita
        </h2>
        <p className="m-0 mt-1.5 text-[15px] text-ink/60 leading-snug">
          Usa esta vista cuando la clienta vino pero no hubo venta. Captura motivo, acciones que
          tomaste (muestra/recomendación) y opcionalmente un seguimiento. Se atribuye automáticamente
          a <strong className="text-ink">{baName}</strong>.
        </p>
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

      {/* Motivo */}
      <section>
        <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2.5">
          Motivo de la visita *
        </div>
        <div className="flex flex-wrap gap-1.5">
          {VISIT_MOTIVES.map((m) => {
            const active = motive === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMotive(m.id)}
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
        {errors.motive?.[0] ? (
          <span className="block mt-1.5 text-xs text-err">{errors.motive[0]}</span>
        ) : null}
      </section>

      {/* Notas */}
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
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Lo que conversaron, productos que vio, inquietudes…"
          className="w-full rounded-[10px] border border-line bg-white px-[14px] py-2.5 text-[15px] text-ink outline-none placeholder:text-ink/40 focus-visible:border-ink resize-y"
        />
      </section>

      {/* Acciones tomadas */}
      <section>
        <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-3">
          ¿Qué acción tomaste? (opcional)
        </div>
        <div className="flex flex-col gap-3">
          <DisclosureToggle
            checked={showSamples}
            onChange={setShowSamples}
            label="Le di una muestra"
            sub="Selecciona los productos que entregaste. La app te sugiere los más compatibles."
          />
          {showSamples ? (
            <div className="pl-9 pr-1">
              <CompatibilityPicker
                client={client}
                products={products}
                selected={sampleSkus}
                onChange={setSampleSkus}
              />
            </div>
          ) : null}

          <DisclosureToggle
            checked={showRecs}
            onChange={setShowRecs}
            label="Le hice una recomendación"
            sub="Productos que sugeriste pero no compró. Genera un enganche para futura visita."
          />
          {showRecs ? (
            <div className="pl-9 pr-1">
              <CompatibilityPicker
                client={client}
                products={products}
                selected={recSkus}
                onChange={setRecSkus}
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* Seguimiento */}
      <section>
        <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-3">
          ¿Programar seguimiento?
        </div>
        <DisclosureToggle
          checked={showFollowup}
          onChange={setShowFollowup}
          label="Sí, agendar tarea post-visita"
          sub="Aparecerá en tu inbox de Seguimientos hasta que la marques como hecha."
        />
        {showFollowup ? (
          <div className="pl-9 pr-1 mt-3 flex flex-col gap-3">
            <div>
              <div className="text-[12.5px] font-semibold text-ink/70 mb-1.5">Tipo</div>
              <div className="flex flex-wrap gap-1.5">
                {FOLLOWUP_TYPES.map((ft) => {
                  const active = followupType === ft.id;
                  return (
                    <button
                      key={ft.id}
                      type="button"
                      onClick={() => setFollowupType(ft.id)}
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
                value={followupDescription}
                onChange={(e) => setFollowupDescription(e.target.value)}
                {...(errors["followup.description"]?.[0]
                  ? { error: errors["followup.description"][0] }
                  : {})}
              />
              <Input
                label="Vence *"
                type="date"
                value={followupDueAt}
                min={todayISO()}
                onChange={(e) => setFollowupDueAt(e.target.value)}
                {...(errors["followup.dueAt"]?.[0]
                  ? { error: errors["followup.dueAt"][0] }
                  : {})}
              />
            </div>
          </div>
        ) : null}
      </section>

      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={onSubmit}
          loading={isPending}
          trailing={<Icon name="check" />}
        >
          Guardar visita
        </Button>
      </div>
    </Card>
  );
}

function DisclosureToggle({
  checked,
  onChange,
  label,
  sub,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  sub: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 w-[18px] h-[18px] accent-ink shrink-0"
      />
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-semibold leading-tight">{label}</span>
        <span className="block text-[13.5px] text-ink/60 leading-snug mt-0.5">{sub}</span>
      </span>
    </label>
  );
}
