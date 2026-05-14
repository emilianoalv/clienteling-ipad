import Link from "next/link";
import { Avatar, BrandTag, Icon } from "@/components/primitives";
import type { AgendaItem } from "../../services/get-ba-day-snapshot";

const KIND_LABEL: Record<string, string> = {
  ritual: "Ritual",
  makeup: "Maquillaje",
  diagnosis: "Diagnóstico",
  consultation: "Consulta",
  "vip-cabin": "Cabina VIP",
  facial: "Facial",
  "anniversary-event": "Aniversario",
  "product-followup": "Seguimiento de producto",
  "fragrance-consult": "Consulta de fragancia",
  other: "Otro",
};

export interface TodayAgendaProps {
  today: readonly AgendaItem[];
  tomorrow: readonly AgendaItem[];
}

/**
 * Agenda card — today's appointments + a preview of tomorrow.
 * Mirrors prototype `AgendaRow` listing (screens-home.jsx:147-166 + 327-339).
 */
export function TodayAgenda({ today, tomorrow }: TodayAgendaProps) {
  return (
    <article className="bg-white border border-line rounded-xl p-6 shadow-[0_1px_2px_rgba(14,14,15,0.03)]">
      <header className="flex items-baseline justify-between mb-2">
        <div>
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            Hoy
          </div>
          <div className="font-display text-[24px] mt-1">
            Agenda · <span className="tabular">{today.length}</span> citas
          </div>
        </div>
        <Link
          href="/ba/appointments"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-line bg-white text-[16.5px] font-semibold transition-colors hover:bg-bone text-inherit no-underline"
        >
          Calendario <Icon name="arrow-right" size={12} />
        </Link>
      </header>

      {today.length === 0 ? (
        <p className="m-0 mt-3 text-[16px] text-ink/60">Sin citas hoy.</p>
      ) : (
        <ul className="list-none m-0 p-0 flex flex-col">
          {today.map((item) => (
            <li key={item.appointment.id}>
              <AgendaRow item={item} />
            </li>
          ))}
        </ul>
      )}

      {tomorrow.length > 0 && (
        <>
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60 mt-5 mb-1.5">
            Mañana
          </div>
          <ul className="list-none m-0 p-0 flex flex-col">
            {tomorrow.slice(0, 2).map((item) => (
              <li key={item.appointment.id}>
                <AgendaRow item={item} />
              </li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
}

function AgendaRow({ item }: { item: AgendaItem }) {
  const { appointment, clientName } = item;
  const at = new Date(appointment.at);
  const hh = at.getHours().toString().padStart(2, "0");
  const mm = at.getMinutes().toString().padStart(2, "0");
  return (
    <div className="grid grid-cols-[56px_1px_36px_1fr_auto] items-center gap-3.5 py-3 border-b border-line last:border-b-0">
      <div className="text-right">
        <div className="font-display text-[20px] leading-none">
          {hh}:{mm}
        </div>
        <div className="text-[14.5px] text-ink/60 mt-1">{appointment.durationMin}m</div>
      </div>
      <div aria-hidden className="bg-line w-px h-8" />
      <Avatar
        initials={initials(clientName)}
        size={36}
        tone={appointment.brand === "Lancôme" ? "lancome" : "ysl"}
      />
      <div className="min-w-0">
        <div className="text-sm font-semibold leading-tight truncate">{clientName}</div>
        <div className="text-xs text-ink/60 mt-0.5">
          {KIND_LABEL[appointment.kind] ?? appointment.kind}
        </div>
      </div>
      <BrandTag brand={appointment.brand} alwaysShow />
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
}
