import type { BaDaySnapshot } from "../services/get-ba-day-snapshot";
import { TodayHero } from "./_parts/today-hero";
import { QuickActions } from "./_parts/quick-actions";
import { TodayEvents } from "./_parts/today-events";
import { TodayAgenda } from "./_parts/today-agenda";
import { PendingList } from "./_parts/pending-list";

export interface BaTodayScreenProps {
  baName: string;
  storeName: string;
  snapshot: BaDaySnapshot;
  /** Override for tests; defaults to `new Date()`. */
  now?: Date;
}

/**
 * BA "Hoy" landing — mirrors prototype `ScreenHome`. Composition only; data
 * comes preloaded via [[getBaDaySnapshot]]. KPIs (pendientes, meta) remain
 * prototype-frozen until F4.
 */
export function BaTodayScreen({ baName, storeName, snapshot, now = new Date() }: BaTodayScreenProps) {
  const firstName = baName.split(/\s+/)[0] ?? baName;
  const dateLabel = formatDateLabel(now);
  const greeting = greetingFor(now);
  const pendingCount = 5 + 2; // matches PendingList items + 2 hardcoded confirmaciones
  const monthGoalPct = 72;
  const monthGoalAmount = 1_184_020;
  const monthGoalTarget = 1_650_000;

  return (
    <div className="px-8 py-7 flex flex-col gap-6">
      <TodayHero
        greeting={greeting}
        firstName={firstName}
        dateLabel={dateLabel}
        storeName={storeName}
        todayApptCount={snapshot.today.length}
        pendingCount={pendingCount}
        monthGoalPct={monthGoalPct}
        monthGoalAmount={monthGoalAmount}
        monthGoalTarget={monthGoalTarget}
      />

      <QuickActions />

      {snapshot.upcomingEvents.length > 0 && <TodayEvents entries={snapshot.upcomingEvents} />}

      <div className="grid gap-5 grid-cols-1 xl:grid-cols-[1fr_1.1fr]">
        <PendingList />
        <TodayAgenda today={snapshot.today} tomorrow={snapshot.tomorrow} />
      </div>
    </div>
  );
}

function greetingFor(d: Date): string {
  const h = d.getHours();
  if (h < 12) return "Buenos días,";
  if (h < 19) return "Buenas tardes,";
  return "Buenas noches,";
}

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function formatDateLabel(d: Date): string {
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} · ${MONTHS[d.getMonth()]} · ${d.getFullYear()}`;
}
