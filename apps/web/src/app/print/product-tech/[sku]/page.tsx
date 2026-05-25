import { notFound } from "next/navigation";
import type { Sku } from "@/types/product";
import { requireSession } from "@/server/auth/session";
import { productRepository } from "@/server/repositories/product.repository";
import { productTechRepository } from "@/server/repositories/product-tech.repository";
import { AutoPrint } from "./auto-print";

const SLOT_LABEL: Record<string, string> = {
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

export default async function ProductTechPrintPage({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  await requireSession();
  const { sku } = await params;
  const skuTyped = sku as Sku;

  const [product, tech] = await Promise.all([
    productRepository.findBySku(skuTyped),
    productTechRepository.find(skuTyped),
  ]);

  if (!product) notFound();
  if (!tech) {
    return (
      <main className="mx-auto max-w-[680px] px-10 py-12">
        <h1 className="text-2xl font-display">{product.name}</h1>
        <p className="mt-4 text-ink/55">
          Ficha técnica aún no disponible para este producto. No se puede generar el PDF.
        </p>
      </main>
    );
  }

  const productLookup = await productRepository.findBySku;
  // Resolver layerWith → nombres.
  const layerProducts: { sku: string; line: string; name: string }[] = [];
  if (tech.layerWith) {
    for (const otherSku of tech.layerWith) {
      const p = await productRepository.findBySku(otherSku);
      if (p) layerProducts.push({ sku: otherSku, line: p.line, name: p.name });
    }
  }
  void productLookup;

  return (
    <>
      <AutoPrint />
      {/* @page sets the printer paper geometry. Letter para la BA México. */}
      <style>{`
        @page { size: letter; margin: 18mm 16mm; }
        @media print {
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <main className="mx-auto max-w-[680px] px-10 py-10 font-[Manrope,sans-serif]">
        <header className="border-b border-ink/15 pb-5 mb-6">
          <div className="text-[12px] tracking-[0.18em] uppercase text-ink/55 font-semibold">
            Ficha técnica · {product.brand}
          </div>
          <h1 className="m-0 mt-2 font-display text-[32px] leading-[1.1] tracking-[-0.01em]">
            {product.line}
          </h1>
          <p className="m-0 mt-1 text-[16px] text-ink/70">
            {product.name} · {product.size}
          </p>
          <p className="m-0 mt-1 text-[12px] text-ink/45 tabular">
            SKU {product.sku} · generado {new Date().toLocaleDateString("es-MX", { dateStyle: "long" })}
          </p>
        </header>

        <PrintSection title="Activos clave">
          <ul className="m-0 p-0 list-none flex flex-col gap-2">
            {tech.keyActives.map((a) => (
              <li key={a.ingredient} className="text-[14px] leading-snug">
                <strong>{a.ingredient}</strong>
                {a.concentration ? <span className="tabular text-ink/70"> · {a.concentration}</span> : null}
                <span className="text-ink/65"> — {a.benefit}</span>
              </li>
            ))}
          </ul>
        </PrintSection>

        {tech.clinicalResults.length > 0 && (
          <PrintSection title="Resultados clínicos">
            <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
              {tech.clinicalResults.map((r) => (
                <li key={r.claim} className="text-[14px] leading-snug">
                  <strong>{r.claim}</strong>
                  {(r.period || r.sample) && (
                    <span className="text-ink/55"> — {[r.period, r.sample].filter(Boolean).join(" · ")}</span>
                  )}
                </li>
              ))}
            </ul>
          </PrintSection>
        )}

        <PrintSection title="Perfil de uso">
          <p className="m-0 text-[14px] leading-snug">
            <strong>Horario:</strong> {tech.usage.timing.map((t) => (t === "AM" ? "Mañana" : "Noche")).join(" · ")}
            {" · "}
            <strong>Frecuencia:</strong> {tech.usage.frequency}
            {" · "}
            <strong>Slot:</strong> {SLOT_LABEL[tech.usage.slot] ?? tech.usage.slot}
          </p>
        </PrintSection>

        <PrintSection title="Para quién">
          <dl className="m-0 grid grid-cols-2 gap-x-8 gap-y-2 text-[14px]">
            {(tech.target.ageMin || tech.target.ageMax) && (
              <PrintField label="Edad ideal">
                {tech.target.ageMin && tech.target.ageMax
                  ? `${tech.target.ageMin}-${tech.target.ageMax} años`
                  : tech.target.ageMin
                    ? `${tech.target.ageMin}+ años`
                    : `Hasta ${tech.target.ageMax} años`}
              </PrintField>
            )}
            {tech.target.routineLevel && (
              <PrintField label="Rutina mínima">{tech.target.routineLevel}</PrintField>
            )}
            {tech.target.skinTypes && tech.target.skinTypes.length > 0 && (
              <PrintField label="Tipo de piel" full>
                {tech.target.skinTypes.join(" · ")}
              </PrintField>
            )}
            {tech.target.concerns && tech.target.concerns.length > 0 && (
              <PrintField label="Concerns prioritarios" full>
                {tech.target.concerns.join(" · ")}
              </PrintField>
            )}
          </dl>
        </PrintSection>

        <PrintSection title="Sensorial">
          <dl className="m-0 grid grid-cols-2 gap-x-8 gap-y-2 text-[14px]">
            <PrintField label="Textura">{tech.sensorial.texture}</PrintField>
            {tech.sensorial.finish && <PrintField label="Acabado">{tech.sensorial.finish}</PrintField>}
            {tech.sensorial.scent && <PrintField label="Aroma">{tech.sensorial.scent}</PrintField>}
            <PrintField label="Al aplicar" full>{tech.sensorial.feel}</PrintField>
          </dl>
        </PrintSection>

        <section className="mt-5 rounded border border-ink/20 p-3.5 page-keep">
          <div className="text-[11px] tracking-[0.18em] uppercase text-ink/55 font-semibold mb-1.5">
            Tip de venta
          </div>
          <p className="m-0 text-[14px] leading-snug">{tech.saleTip}</p>
        </section>

        {tech.cautions && tech.cautions.length > 0 && (
          <section className="mt-4 rounded border border-ink/30 p-3.5 bg-[#FFF8E8] page-keep">
            <div className="text-[11px] tracking-[0.18em] uppercase font-semibold mb-1.5">
              Precauciones
            </div>
            <ul className="m-0 pl-5 list-disc">
              {tech.cautions.map((c) => (
                <li key={c} className="text-[13.5px] leading-snug">{c}</li>
              ))}
            </ul>
          </section>
        )}

        {layerProducts.length > 0 && (
          <PrintSection title="Combina bien con">
            <ul className="m-0 p-0 list-none flex flex-col gap-1">
              {layerProducts.map((p) => (
                <li key={p.sku} className="text-[14px] leading-snug">
                  <strong>{p.line}</strong>
                  <span className="text-ink/60"> · {p.name}</span>
                </li>
              ))}
            </ul>
          </PrintSection>
        )}

        <footer className="mt-8 pt-4 border-t border-ink/15 text-[11px] text-ink/55 leading-snug">
          Fuente: <span className="break-all">{tech.source}</span>
          <br />
          Documento generado por Clienteling iPad — uso interno de Beauty Advisors. No sustituye la consulta con un especialista.
        </footer>

        <div className="no-print mt-6 flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-white rounded cursor-pointer text-[13.5px] font-semibold"
          >
            Imprimir / Guardar como PDF
          </button>
        </div>
      </main>
    </>
  );
}

function PrintSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="m-0 mb-2 text-[11px] tracking-[0.18em] uppercase text-ink/55 font-semibold border-b border-ink/15 pb-1">
        {title}
      </h2>
      {children}
    </section>
  );
}

function PrintField({
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
      <dt className="text-[10.5px] tracking-[0.12em] uppercase text-ink/50 font-semibold">{label}</dt>
      <dd className="m-0 mt-0.5">{children}</dd>
    </div>
  );
}
