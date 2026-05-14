import { formatCurrency } from "@/lib/format/format-currency";

export interface TodayHeroProps {
  firstName: string;
  greeting: string;
  dateLabel: string;
  storeName: string;
  todayApptCount: number;
  pendingCount: number;
  monthGoalPct: number;
  monthGoalAmount: number;
  monthGoalTarget: number;
}

/**
 * BA "Hoy" hero — greeting + 3-stat strip + month-objective gauge.
 * Mirrors prototype `ScreenHome` lines 229-259.
 */
export function TodayHero(props: TodayHeroProps) {
  const { greeting, firstName, dateLabel, storeName, todayApptCount, pendingCount } = props;
  const { monthGoalPct, monthGoalAmount, monthGoalTarget } = props;
  const pendingTone = pendingCount > 3 ? "text-err" : "text-ink";

  return (
    <div className="grid gap-5 grid-cols-1 xl:grid-cols-[1.3fr_1fr]">
      <section className="bg-gradient-to-b from-white to-paper border border-line rounded-xl px-9 py-8 shadow-[0_1px_2px_rgba(14,14,15,0.03)]">
        <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          {dateLabel} · {storeName}
        </div>
        <h2 className="mt-2 font-display text-[52px] leading-none tracking-[-0.02em]">
          {greeting} <span className="italic">{firstName}</span>.
        </h2>
        <div className="mt-5 flex items-center gap-7 flex-wrap">
          <Stat label="Citas hoy" value={String(todayApptCount)} />
          <Divider />
          <Stat label="Pendientes" value={String(pendingCount)} tone={pendingTone} />
          <Divider />
          <Stat
            label="Meta del mes"
            value={
              <>
                {monthGoalPct}
                <span className="text-[18px] text-ink/60">%</span>
              </>
            }
          />
        </div>
      </section>

      <section className="bg-white border border-line rounded-xl px-8 py-7 flex items-center gap-6 shadow-[0_1px_2px_rgba(14,14,15,0.03)]">
        <ObjectiveGauge pct={monthGoalPct} />
        <div className="flex-1 min-w-0">
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            Meta del mes
          </div>
          <div className="font-display text-[32px] mt-1.5 leading-none tabular">
            {formatCurrency(monthGoalAmount)}
          </div>
          <div className="text-sm text-ink/60 mt-2">
            de {formatCurrency(monthGoalTarget)} · Proyección +6%
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "text-ink",
}: {
  label: string;
  value: React.ReactNode;
  tone?: string;
}) {
  return (
    <div>
      <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        {label}
      </div>
      <div className={`font-display text-[28px] mt-0.5 tabular leading-none ${tone}`}>{value}</div>
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="block w-px h-9 bg-line" />;
}

function ObjectiveGauge({ pct }: { pct: number }) {
  const R = 46;
  const C = 2 * Math.PI * R;
  const filled = (pct / 100) * C;
  return (
    <svg width={140} height={140} viewBox="0 0 110 110" aria-hidden className="shrink-0">
      <circle cx={55} cy={55} r={R} fill="none" stroke="currentColor" className="text-ink/[0.08]" strokeWidth={9} />
      <circle
        cx={55}
        cy={55}
        r={R}
        fill="none"
        stroke="currentColor"
        className="text-ink"
        strokeWidth={9}
        strokeDasharray={`${filled} 999`}
        strokeLinecap="round"
        transform="rotate(-90 55 55)"
      />
      <text
        x={55}
        y={62}
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize={28}
        fill="currentColor"
        className="text-ink"
      >
        {pct}%
      </text>
    </svg>
  );
}
