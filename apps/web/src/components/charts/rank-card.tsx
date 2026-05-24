import { cn } from "@/lib/cn";

export interface RankItem {
  label: string;
  value: string | number;
  /** True when this row represents the current user — highlights with accent. */
  isMe?: boolean;
}

export interface RankCardProps {
  title: string;
  items: readonly RankItem[];
  /** "top" = best at #1 (default). "bottom" = inverted ranking. */
  direction?: "top" | "bottom";
  emptyMessage?: string;
}

/**
 * Ranking list with TOP/BOTTOM badges on the extremes. Extracted from
 * `supervisor-dashboard.tsx` so BA, Gerente, Supervisor, and Admin can
 * share the same visual.
 */
export function RankCard({
  title,
  items,
  direction = "top",
  emptyMessage = "Sin datos disponibles.",
}: RankCardProps) {
  return (
    <article className="bg-white border border-line rounded-lg p-4">
      <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
        {title}
      </div>
      {items.length === 0 ? (
        <p className="text-[15px] text-ink/60 mt-2 mb-0">{emptyMessage}</p>
      ) : (
        <ul className="list-none m-0 mt-1 p-0">
          {items.map((item, i) => {
            const isTop = direction === "top" ? i < 2 : i === items.length - 1;
            const isBot =
              direction === "top" ? i === items.length - 1 : i < 2;
            return (
              <li
                key={`${item.label}-${i}`}
                className={cn(
                  "grid grid-cols-[24px_1fr_auto_auto] gap-2.5 items-center py-2 border-b border-dashed border-line last:border-b-0",
                  item.isMe && "bg-ink/[0.03] rounded",
                )}
              >
                <span
                  className={cn(
                    "text-[16px] font-semibold tabular",
                    isTop ? "text-ok" : isBot ? "text-err" : "text-ink/60",
                  )}
                >
                  #{i + 1}
                </span>
                <span
                  className={cn(
                    "text-[16px]",
                    item.isMe && "font-semibold",
                  )}
                >
                  {item.label}
                </span>
                <span className="text-[16px] font-semibold tabular">
                  {item.value}
                </span>
                {isTop ? (
                  <span className="text-[14px] font-semibold uppercase tracking-[0.04em] text-ok px-1.5 rounded-pill border border-ok/20 bg-ok/10">
                    TOP
                  </span>
                ) : isBot ? (
                  <span className="text-[14px] font-semibold uppercase tracking-[0.04em] text-err px-1.5 rounded-pill border border-err/20 bg-err/10">
                    BOTTOM
                  </span>
                ) : (
                  <span />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
