import { cn } from "@/lib/cn";

export interface DividerProps {
  dashed?: boolean;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function Divider({ dashed = false, orientation = "horizontal", className }: DividerProps) {
  return (
    <hr
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "m-0 bg-transparent",
        orientation === "horizontal"
          ? cn("w-full border-t border-line", dashed && "border-dashed")
          : cn("h-full border-l border-line", dashed && "border-dashed"),
        className,
      )}
    />
  );
}
