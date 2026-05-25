import Link from "next/link";
import type { ClientId } from "@/types/client";
import type { LifeEventKind } from "@/types/life-event";
import type { UpcomingEventEntry } from "../../services/get-ba-day-snapshot";
import { formatDate } from "@/lib/format/format-date";

interface EventStyle {
  bg: string;
  border: string;
  tint: string;
  glyph: string;
}

const STYLES: Record<LifeEventKind, EventStyle> = {
  birthday: {
    bg: "bg-[rgba(232,196,192,0.35)]",
    border: "border-[rgba(184,95,99,0.4)]",
    tint: "text-[#B85F63]",
    glyph: "🎂",
  },
  anniversary: {
    bg: "bg-[rgba(201,169,97,0.18)]",
    border: "border-[rgba(201,169,97,0.45)]",
    tint: "text-[#9C7E36]",
    glyph: "★",
  },
  replenishment: {
    bg: "bg-[rgba(31,122,90,0.10)]",
    border: "border-[rgba(31,122,90,0.30)]",
    tint: "text-ok",
    glyph: "⟳",
  },
};

/**
 * Mapea el tipo de evento a la acción que la BA quiere hacer cuando le
 * da click:
 *   birthday/anniversary → abrir composer con plantilla (felicitar).
 *   replenishment        → registrar venta (la reposición es venta).
 *
 * Eliminamos el detour al perfil del cliente — la BA ya sabe quién es,
 * lo que necesita es el formulario para resolver.
 */
function hrefFor(clientId: ClientId, kind: LifeEventKind): string {
  if (kind === "replenishment") return `/ba/clients/${clientId}/sale`;
  return `/ba/clients/${clientId}/message/new`;
}

export interface TodayEventsProps {
  entries: readonly UpcomingEventEntry[];
}

/**
 * Upcoming life events card. Mirrors prototype `UpcomingEventRow` grid
 * (screens-home.jsx:175-202 + 274-298).
 */
export function TodayEvents({ entries }: TodayEventsProps) {
  if (entries.length === 0) return null;
  const birthdays = entries.filter((e) => e.event.kind === "birthday").length;
  const replenishments = entries.filter((e) => e.event.kind === "replenishment").length;

  return (
    <article className="bg-white border border-line rounded-xl p-5 shadow-[0_1px_2px_rgba(14,14,15,0.03)]">
      <header className="flex items-baseline justify-between mb-3">
        <div>
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            Próximos 45 días
          </div>
          <div className="font-display text-[22px] mt-0.5">
            Eventos · <span className="tabular">{entries.length}</span>
          </div>
        </div>
        <span className="inline-flex items-center h-[22px] px-2.5 rounded-full bg-bone text-[15px] font-medium text-ink/70">
          {birthdays} cumple · {replenishments} reposiciones
        </span>
      </header>
      <ul className="list-none m-0 p-0 grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {entries.map((e) => {
          const s = STYLES[e.event.kind];
          return (
            <li key={`${e.client.id}-${e.event.kind}-${e.event.date}`}>
              <Link
                href={hrefFor(e.client.id, e.event.kind)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md border ${s.bg} ${s.border} transition-opacity hover:opacity-90 text-inherit no-underline`}
              >
                <span
                  aria-hidden
                  className={`w-9 h-9 rounded-full bg-white inline-flex items-center justify-center text-lg ${s.tint}`}
                >
                  {s.glyph}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[16px] font-semibold leading-tight">{e.client.name}</span>
                  <span className="block text-[15.5px] text-ink/60 mt-0.5">{e.event.label}</span>
                </span>
                <span className="text-right shrink-0">
                  <span className={`block text-xs font-semibold lowercase tabular ${s.tint}`}>
                    {relativeWhen(e.event.daysUntil)}
                  </span>
                  <span className="block text-[14px] text-ink/60 mt-0.5">
                    {formatDate(e.event.date)}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

function relativeWhen(days: number): string {
  if (days === 0) return "hoy";
  if (days === 1) return "mañana";
  if (days < 0) return `${-days}d vencido`;
  return `en ${days}d`;
}
