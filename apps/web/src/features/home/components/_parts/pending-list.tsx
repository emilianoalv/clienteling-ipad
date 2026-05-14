import { cn } from "@/lib/cn";

type Tone = "err" | "warn" | "ok";

interface PendingItem {
  tone: Tone;
  title: string;
  sub: string;
  hint: string;
  cta: string;
}

const ITEMS: readonly PendingItem[] = [
  {
    tone: "err",
    title: "Muestra Advanced Génifique vence hoy",
    sub: "Carolina Mendoza · enviada hace 13 días",
    hint: "Hoy",
    cta: "Pedir feedback",
  },
  {
    tone: "err",
    title: "Cita sin confirmar · mañana 11:00",
    sub: "Sofía Ruiz · Ritual Absolue",
    hint: "Mañana",
    cta: "Confirmar",
  },
  {
    tone: "warn",
    title: "Recomendación sin abrir · 3 días",
    sub: "Natalia Hernández · Rouge Volupté Shine",
    hint: "−3d",
    cta: "Reenviar",
  },
  {
    tone: "warn",
    title: "Cumpleaños esta semana · 2 clientas",
    sub: "Ana Torres (sáb) · Paulina Ríos (dom)",
    hint: "+2",
    cta: "Saludar",
  },
  {
    tone: "ok",
    title: "Seguimiento post-compra",
    sub: "Isabella Ortega · Libre EDP · entrega hoy",
    hint: "Hoy",
    cta: "Agendar",
  },
];

const TONE_DOT: Record<Tone, string> = {
  err: "bg-err",
  warn: "bg-warn",
  ok: "bg-ok",
};

/**
 * 5 pending tasks. Numbers are prototype-frozen seed; F4 will derive them
 * from real samples / appointments / recommendations / events.
 */
export function PendingList() {
  const total = ITEMS.length + 2;
  return (
    <article className="bg-white border border-line rounded-xl shadow-[0_1px_2px_rgba(14,14,15,0.03)]">
      <header className="flex items-baseline justify-between px-6 pt-5 pb-2">
        <div>
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            Por atender
          </div>
          <div className="font-display text-[24px] mt-1">
            Pendientes · <span className="tabular">{total}</span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full bg-warn/10 text-warn text-[15px] font-semibold">
          3 urgentes
        </span>
      </header>
      <ul className="list-none m-0 px-2 pb-3 pt-0 flex flex-col">
        {ITEMS.map((it, i) => (
          <li
            key={i}
            className="flex items-center gap-3 px-3 py-3 rounded-md transition-colors hover:bg-bone"
          >
            <span aria-hidden className={cn("w-1.5 h-1.5 rounded-full shrink-0", TONE_DOT[it.tone])} />
            <div className="flex-1 min-w-0">
              <div className="text-[16.5px] font-semibold leading-tight">{it.title}</div>
              <div className="text-xs text-ink/60 leading-snug mt-0.5">{it.sub}</div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-ink/60 tabular">{it.hint}</span>
              <button
                type="button"
                className="h-[30px] px-3 rounded-md border border-line bg-white text-[16.5px] font-semibold transition-colors hover:bg-bone"
              >
                {it.cta}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
