import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/format/number";
import type { AdoptionData } from "../../lib/adoption-tracker";

export interface AdoptionTrackerProps {
  data: AdoptionData;
  className?: string;
}

/** Two stacked groups of horizontal bars: by role + by store. */
export function AdoptionTracker({ data, className }: AdoptionTrackerProps) {
  return (
    <article
      className={cn(
        "bg-white border border-line rounded-lg p-5 flex flex-col gap-5",
        className,
      )}
    >
      <header className="flex items-baseline justify-between">
        <span className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          Adopción de la plataforma
        </span>
        <span className="text-[14px] text-ink/60">Últimos 7 días</span>
      </header>

      <section>
        <div className="text-[13px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
          Por rol
        </div>
        {data.byRole.length === 0 ? (
          <p className="m-0 text-[15px] text-ink/60">Sin usuarios registrados.</p>
        ) : (
          <ul className="list-none m-0 p-0 grid gap-2">
            {data.byRole.map((r) => (
              <AdoptionRow
                key={r.role}
                label={r.role}
                percent={r.percent}
                ratio={`${r.activeCount} de ${r.totalCount}${r.activeCount === 1 ? " activo" : " activos"}`}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="text-[13px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-2">
          Por tienda
        </div>
        {data.byStore.length === 0 ? (
          <p className="m-0 text-[15px] text-ink/60">Sin staff asignado a tiendas.</p>
        ) : (
          <ul className="list-none m-0 p-0 grid gap-2">
            {data.byStore.map((s) => (
              <AdoptionRow
                key={s.storeId}
                label={s.storeName}
                percent={s.percent}
                ratio={`${s.activeCount} de ${s.totalCount}`}
              />
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}

function AdoptionRow({
  label,
  percent,
  ratio,
}: {
  label: string;
  percent: number;
  ratio: string;
}) {
  const tone =
    percent >= 80 ? "bg-ok" : percent >= 60 ? "bg-ink" : "bg-warn";
  const flagAttention = percent < 60;
  return (
    <li className="grid grid-cols-[7rem_1fr_auto_auto] items-center gap-3 text-[15px]">
      <span className="font-medium">{label}</span>
      <div className="h-2 rounded-full bg-ink/[0.06] overflow-hidden">
        <div
          className={cn("h-full", tone)}
          style={{ width: `${Math.max(2, percent)}%` }}
        />
      </div>
      <span className="font-semibold tabular w-12 text-right">
        {formatPercent(percent)}
      </span>
      <span
        className={cn(
          "text-[14px] tabular",
          flagAttention ? "text-warn font-semibold" : "text-ink/60",
        )}
      >
        {ratio}
        {flagAttention ? " · atención" : ""}
      </span>
    </li>
  );
}
