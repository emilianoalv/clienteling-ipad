"use client";

import type { Product } from "@/types/product";
import type { ProductTech, RoutineTimingTag } from "@/types/product-tech";
import { BrandTag, Chip, Icon } from "@/components/primitives";
import { Modal } from "@/components/feedback";

const SLOT_LABEL: Record<ProductTech["usage"]["slot"], string> = {
  cleanser: "Limpieza",
  "treatment-serum": "Sérum / tratamiento",
  "treatment-cream": "Crema tratamiento",
  "eye-cream": "Contorno de ojos",
  mask: "Mascarilla",
  spf: "Protector solar",
  foundation: "Base",
  concealer: "Corrector",
  lip: "Labio",
  fragrance: "Fragancia",
};

export interface FichaTecnicaModalProps {
  open: boolean;
  product: Product;
  tech: ProductTech | null;
  /** All products in scope — used to resolve `layerWith` SKUs to names. */
  productLookup: ReadonlyMap<string, Product>;
  onClose: () => void;
}

export function FichaTecnicaModal({
  open,
  product,
  tech,
  productLookup,
  onClose,
}: FichaTecnicaModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${product.line}`}
      description={`${product.name} · ${product.size}`}
      size="lg"
    >
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <BrandTag brand={product.brand} alwaysShow />
          {tech?.source ? (
            <a
              href={tech.source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] text-ink/50 hover:text-ink underline-offset-2 hover:underline inline-flex items-center gap-1"
            >
              Fuente oficial <Icon name="arrow-right" size={12} />
            </a>
          ) : null}
        </div>

        {!tech ? (
          <EmptyTech />
        ) : (
          <>
            <Section title="Activos clave">
              <ul className="m-0 p-0 list-none flex flex-col gap-2">
                {tech.keyActives.map((a) => (
                  <li
                    key={a.ingredient}
                    className="flex items-baseline justify-between gap-3 text-[16px] leading-snug"
                  >
                    <span className="flex-1 min-w-0">
                      <span className="font-semibold">{a.ingredient}</span>
                      {a.concentration ? (
                        <span className="ml-2 text-ink/70 tabular">{a.concentration}</span>
                      ) : null}
                      <span className="text-ink/60"> · {a.benefit}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Section>

            {tech.clinicalResults.length > 0 ? (
              <Section title="Resultados clínicos">
                <ul className="m-0 p-0 list-none flex flex-col gap-2">
                  {tech.clinicalResults.map((r) => (
                    <li key={r.claim} className="text-[16px] leading-snug">
                      <span className="font-semibold">{r.claim}</span>
                      {(r.period || r.sample) && (
                        <span className="text-ink/55 text-[14px]">
                          {" — "}
                          {[r.period, r.sample].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </Section>
            ) : null}

            <Section title="Perfil de uso">
              <div className="flex flex-wrap gap-2">
                {tech.usage.timing.map((t) => (
                  <Chip key={t} variant="neutral" leading={<TimingDot timing={t} />}>
                    {t === "AM" ? "Mañana" : "Noche"}
                  </Chip>
                ))}
                <Chip variant="neutral">{tech.usage.frequency}</Chip>
                <Chip variant="accent">{SLOT_LABEL[tech.usage.slot]}</Chip>
              </div>
            </Section>

            <Section title="Para quién">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 m-0">
                {(tech.target.ageMin || tech.target.ageMax) && (
                  <Field label="Edad ideal">
                    {formatAgeRange(tech.target.ageMin, tech.target.ageMax)}
                  </Field>
                )}
                {tech.target.skinTypes && tech.target.skinTypes.length > 0 && (
                  <Field label="Tipo de piel">
                    <ChipList items={tech.target.skinTypes} />
                  </Field>
                )}
                {tech.target.concerns && tech.target.concerns.length > 0 && (
                  <Field label="Concerns prioritarios" full>
                    <ChipList items={tech.target.concerns} />
                  </Field>
                )}
                {tech.target.routineLevel && (
                  <Field label="Rutina mínima">{tech.target.routineLevel}</Field>
                )}
              </dl>
            </Section>

            <Section title="Sensorial">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 m-0">
                <Field label="Textura">{tech.sensorial.texture}</Field>
                {tech.sensorial.finish && <Field label="Acabado">{tech.sensorial.finish}</Field>}
                {tech.sensorial.scent && <Field label="Aroma">{tech.sensorial.scent}</Field>}
                <Field label="Al aplicar" full>
                  {tech.sensorial.feel}
                </Field>
              </dl>
            </Section>

            <div className="rounded-lg bg-bone border border-line p-4">
              <div className="text-[14px] font-semibold tracking-[0.12em] uppercase text-ink/55 mb-1.5">
                Tip de venta
              </div>
              <p className="m-0 text-[16px] leading-snug">{tech.saleTip}</p>
            </div>

            {tech.cautions && tech.cautions.length > 0 ? (
              <div className="rounded-lg bg-warn/10 border border-warn/30 p-4">
                <div className="text-[14px] font-semibold tracking-[0.12em] uppercase text-warn mb-1.5 inline-flex items-center gap-1.5">
                  <Icon name="warning" size={14} />
                  Precauciones
                </div>
                <ul className="m-0 pl-5 list-disc flex flex-col gap-1">
                  {tech.cautions.map((c) => (
                    <li key={c} className="text-[16px] leading-snug">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {tech.layerWith && tech.layerWith.length > 0 ? (
              <Section title="Combina bien con">
                <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
                  {tech.layerWith.map((sku) => {
                    const layer = productLookup.get(sku);
                    if (!layer) return null;
                    return (
                      <li key={sku} className="text-[16px] leading-snug">
                        <span className="font-semibold">{layer.line}</span>
                        <span className="text-ink/55"> · {layer.name}</span>
                      </li>
                    );
                  })}
                </ul>
              </Section>
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="m-0 mb-2.5 text-[14px] font-semibold tracking-[0.12em] uppercase text-ink/55">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "col-span-2" : undefined}>
      <dt className="text-[13px] text-ink/55 uppercase tracking-[0.08em] font-medium">{label}</dt>
      <dd className="m-0 mt-1 text-[16px] leading-snug">{children}</dd>
    </div>
  );
}

function ChipList({ items }: { items: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <Chip key={i} variant="neutral" size="sm">
          {i}
        </Chip>
      ))}
    </div>
  );
}

function TimingDot({ timing }: { timing: RoutineTimingTag }) {
  return (
    <span
      aria-hidden
      className={
        timing === "AM"
          ? "inline-block w-2 h-2 rounded-full bg-warn"
          : "inline-block w-2 h-2 rounded-full bg-ink"
      }
    />
  );
}

function EmptyTech() {
  return (
    <div className="py-8 text-center text-ink/55 text-[16px]">
      Ficha técnica aún no disponible para este producto.
    </div>
  );
}

function formatAgeRange(min?: number, max?: number): string {
  if (min && max) return `${min}-${max} años`;
  if (min) return `${min}+ años`;
  if (max) return `Hasta ${max} años`;
  return "Sin restricción";
}
