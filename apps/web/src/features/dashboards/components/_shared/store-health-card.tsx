import { Icon } from "@/components/primitives";
import { cn } from "@/lib/cn";
import {
  formatCurrencyCompact,
  formatPercent,
  formatPercentChange,
} from "@/lib/format/number";
import type { StoreHealth, StoreHealthGrade } from "../../lib/store-health";

export interface StoreHealthCardProps {
  storeName: string;
  health: StoreHealth;
  sales: { current: number; target: number };
  yoy?: number;
  baAdoption: number; // 0-100
  alertsCount: number;
  onClick?: () => void;
  className?: string;
}

const GRADE_STYLES: Record<
  StoreHealthGrade,
  { tone: string; band: string; label: string; dot: string }
> = {
  verde: {
    tone: "text-ok",
    band: "bg-ok",
    label: "Verde · saludable",
    dot: "bg-ok",
  },
  ambar: {
    tone: "text-warn",
    band: "bg-warn",
    label: "Ámbar · atención",
    dot: "bg-warn",
  },
  rojo: {
    tone: "text-err",
    band: "bg-err",
    label: "Rojo · intervención",
    dot: "bg-err",
  },
};

/**
 * Large card showing a store's composite Health Score plus the underlying
 * KPIs (sales vs target, YoY, BA adoption, alerts). Clickable to open the
 * supervisor's store drill-down modal.
 */
export function StoreHealthCard({
  storeName,
  health,
  sales,
  yoy,
  baAdoption,
  alertsCount,
  onClick,
  className,
}: StoreHealthCardProps) {
  const style = GRADE_STYLES[health.grade];
  const ratioPct =
    sales.target > 0 ? Math.round((sales.current / sales.target) * 100) : null;
  const interactive = onClick !== undefined;

  return (
    <article
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick?.();
            }
          : undefined
      }
      className={cn(
        "bg-white border border-line rounded-lg p-5 flex flex-col gap-4",
        interactive && "cursor-pointer hover:bg-bone transition-colors",
        className,
      )}
    >
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="m-0 font-display text-[20px] leading-tight">
          {storeName}
        </h3>
        <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold tracking-[0.04em] uppercase">
          <span aria-hidden className={cn("w-2 h-2 rounded-full", style.dot)} />
          <span className={style.tone}>{style.label}</span>
        </span>
      </header>

      <div>
        <div className="text-[13px] font-semibold tracking-[0.12em] uppercase text-ink/60 mb-1">
          Store Health
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[40px] leading-none tabular">
            {health.score}
          </span>
          <span className="text-[16px] text-ink/60">/ 100</span>
        </div>
        <div className="h-2 rounded-full bg-ink/[0.06] overflow-hidden mt-2">
          <div
            className={cn("h-full", style.band)}
            style={{ width: `${Math.max(2, health.score)}%` }}
          />
        </div>
      </div>

      <ul className="list-none m-0 p-0 grid grid-cols-2 gap-x-4 gap-y-2 text-[15px]">
        <li className="flex items-baseline justify-between gap-2">
          <span className="text-ink/60">Ventas</span>
          <span className="font-semibold tabular">
            {formatCurrencyCompact(sales.current)}
          </span>
        </li>
        <li className="flex items-baseline justify-between gap-2">
          <span className="text-ink/60">% objetivo</span>
          <span className="font-semibold tabular">
            {ratioPct === null ? "—" : `${ratioPct}%`}
          </span>
        </li>
        {yoy !== undefined ? (
          <li className="flex items-baseline justify-between gap-2">
            <span className="text-ink/60">YoY</span>
            <span
              className={cn(
                "font-semibold tabular",
                yoy >= 0 ? "text-ok" : "text-err",
              )}
            >
              {formatPercentChange(yoy)}
            </span>
          </li>
        ) : null}
        <li className="flex items-baseline justify-between gap-2">
          <span className="text-ink/60">Adopción BAs</span>
          <span className="font-semibold tabular">{formatPercent(baAdoption)}</span>
        </li>
        <li className="flex items-baseline justify-between gap-2">
          <span className="text-ink/60">Alertas críticas</span>
          <span
            className={cn(
              "font-semibold tabular",
              alertsCount > 0 ? "text-err" : "text-ink/60",
            )}
          >
            {alertsCount}
          </span>
        </li>
      </ul>

      {interactive ? (
        <div className="flex items-center justify-end text-[14px] font-semibold text-ink/60">
          Ver detalle <Icon name="arrow-right" size={12} className="ml-1" />
        </div>
      ) : null}
    </article>
  );
}
