import { cn } from "@/lib/cn";

export interface StepperStep {
  label: string;
}

export interface StepperProps {
  steps: ReadonlyArray<StepperStep>;
  /** 0-based index of the currently active step. */
  current: number;
  className?: string;
}

export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <ol className={cn("flex items-center gap-3 list-none m-0 p-0", className)}>
      {steps.map((step, idx) => {
        const state = idx < current ? "done" : idx === current ? "active" : "pending";
        return (
          <li
            key={step.label}
            className={cn(
              "inline-flex items-center gap-2 text-xs font-semibold leading-none",
              state === "active" && "text-ink",
              state === "done" && "text-ok",
              state === "pending" && "text-ink/40",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "inline-flex items-center justify-center w-[22px] h-[22px] rounded-full border text-[15px]",
                state === "active" && "bg-ink text-paper border-ink",
                state === "done" && "bg-ok text-white border-ok",
                state === "pending" && "bg-white border-line",
              )}
            >
              {state === "done" ? "✓" : idx + 1}
            </span>
            <span className="text-xs">{step.label}</span>
            {idx < steps.length - 1 ? (
              <span aria-hidden className="w-6 h-px bg-line" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
