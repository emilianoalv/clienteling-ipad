import { cn } from "@/lib/cn";

export type StatusLightLevel = "verde" | "amarillo" | "rojo";

const LEVEL: Record<
  StatusLightLevel,
  { bg: string; dot: string; label: string }
> = {
  verde: { bg: "bg-ok/10", dot: "bg-ok", label: "Verde" },
  amarillo: { bg: "bg-warn/10", dot: "bg-warn", label: "Amarillo" },
  rojo: { bg: "bg-err/10", dot: "bg-err", label: "Rojo" },
};

export interface StatusLightProps {
  status: StatusLightLevel;
  /** Override the default label (e.g. translated). */
  label?: string;
  className?: string;
}

/**
 * Traffic-light pill used in the Supervisor "semáforo de tiendas" view.
 */
export function StatusLight({ status, label, className }: StatusLightProps) {
  const meta = LEVEL[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-pill text-[15px] font-semibold",
        meta.bg,
        className,
      )}
    >
      <span className={cn("inline-block w-2 h-2 rounded-full", meta.dot)} />
      {label ?? meta.label}
    </span>
  );
}
