import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  hint?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { error, hint, label, id, className, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
  return (
    <label className="flex flex-col gap-1 font-sans" htmlFor={inputId}>
      {label ? (
        <span className="text-xs font-semibold text-ink/60 tracking-[0.02em]">{label}</span>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "h-10 w-full rounded-[10px] border bg-white px-[14px] text-sm text-ink outline-none placeholder:text-ink/40 transition-[border-color,box-shadow] duration-150 ease-luxe focus-visible:shadow-[0_0_0_3px_rgba(14,14,15,0.08)]",
          error
            ? "border-err focus-visible:border-err focus-visible:shadow-[0_0_0_3px_rgba(162,58,46,0.16)]"
            : "border-line focus-visible:border-ink",
          className,
        )}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...rest}
      />
      {error ? (
        <span id={`${inputId}-error`} className="text-xs text-err">
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} className="text-xs text-ink/60">
          {hint}
        </span>
      ) : null}
    </label>
  );
});
