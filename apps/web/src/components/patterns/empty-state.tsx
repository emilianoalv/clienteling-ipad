import type { ReactNode } from "react";
import { Icon } from "@/components/primitives";
import type { IconName } from "@/types/icon";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: IconName;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon = "search",
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center text-center gap-3 px-6 py-14 rounded-lg border border-dashed border-line bg-bone text-ink/60",
        className,
      )}
    >
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white text-ink/60">
        <Icon name={icon} size={28} />
      </div>
      <h3 className="m-0 text-base font-medium leading-tight text-ink">{title}</h3>
      {description ? (
        <p className="m-0 text-[16px] font-medium leading-normal max-w-[38ch]">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
