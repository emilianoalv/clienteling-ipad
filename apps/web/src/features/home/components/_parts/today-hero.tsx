export interface TodayHeroProps {
  firstName: string;
  greeting: string;
  dateLabel: string;
  storeName: string;
  todayApptCount: number;
  pendingCount: number;
}

/**
 * BA "Hoy" hero — saludo + 2-stat strip (citas hoy + pendientes).
 * La "Meta del mes" se removió a pedido del cliente: hasta no tener
 * datos reales del POS la cifra hardcodeada solo hacía ruido.
 */
export function TodayHero(props: TodayHeroProps) {
  const { greeting, firstName, dateLabel, storeName, todayApptCount, pendingCount } = props;
  const pendingTone = pendingCount > 3 ? "text-err" : "text-ink";

  return (
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
      </div>
    </section>
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
