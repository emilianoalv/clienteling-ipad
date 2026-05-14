import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ChipVariant = "neutral" | "lancome" | "ysl" | "ok" | "warn" | "danger" | "accent";
export type ChipSize = "sm" | "md";

export interface ChipProps {
  variant?: ChipVariant;
  size?: ChipSize;
  leading?: ReactNode;
  className?: string;
  children: ReactNode;
}

const SIZE: Record<ChipSize, string> = {
  md: "h-[26px] px-[10px] text-xs",
  sm: "h-[22px] px-2 text-[15px]",
};

const VARIANT: Record<ChipVariant, string> = {
  neutral: "bg-bone text-ink border-line",
  accent: "bg-ink text-paper border-ink",
  lancome: "bg-lancome-rose text-lancome-ink border-transparent",
  ysl: "bg-ysl-ink text-ysl-gold border-transparent",
  ok: "bg-ok/10 text-ok border-ok/20",
  warn: "bg-warn/10 text-warn border-warn/20",
  danger: "bg-err/10 text-err border-err/20",
};

export function Chip({
  variant = "neutral",
  size = "md",
  leading,
  className,
  children,
}: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border font-medium whitespace-nowrap",
        SIZE[size],
        VARIANT[variant],
        className,
      )}
    >
      {leading ? (
        <span aria-hidden className="inline-flex items-center">
          {leading}
        </span>
      ) : null}
      <span>{children}</span>
    </span>
  );
}
