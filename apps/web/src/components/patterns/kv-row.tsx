import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface KvRowProps {
  label: string;
  value: ReactNode;
  mono?: boolean;
  dashed?: boolean;
  className?: string;
}

export function KvRow({ label, value, mono = false, dashed = true, className }: KvRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto] items-baseline gap-3 py-1.5",
        dashed && "border-b border-dashed border-line last:border-b-0",
        className,
      )}
    >
      <span className="text-xs font-medium leading-snug text-ink/60">{label}</span>
      <span
        className={cn(
          "text-[16px] font-medium leading-snug text-ink text-right",
          mono && "tabular",
        )}
      >
        {value}
      </span>
    </div>
  );
}
