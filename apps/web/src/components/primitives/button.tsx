import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "ghost" | "danger" | "default" | "outline";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  loading?: boolean;
}

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-[10px] font-sans font-semibold border cursor-pointer select-none transition-[background-color,border-color,transform] duration-150 ease-luxe active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed";

const SIZES: Record<ButtonSize, string> = {
  md: "h-10 px-[18px] text-sm",
  sm: "h-8 px-3 text-[16px]",
  lg: "h-12 px-[22px] text-[18px]",
};

const VARIANTS: Record<ButtonVariant, string> = {
  default: "border-line bg-white text-ink hover:bg-bone",
  primary:
    "border-ink bg-ink text-paper hover:brightness-110 hover:bg-ink/95",
  // Outline: borde y texto negros, fondo blanco. Para CTAs de "abrir form"
  // donde primary (sólido negro) se lee como "ya está seleccionado".
  outline: "border-ink bg-white text-ink hover:bg-bone",
  ghost: "border-transparent bg-transparent text-ink hover:bg-ink/[0.04]",
  danger: "border-err bg-err text-white hover:bg-err/90",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "default",
    size = "md",
    iconOnly = false,
    leading,
    trailing,
    loading = false,
    className,
    children,
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        BASE,
        SIZES[size],
        VARIANTS[variant],
        iconOnly && "px-0 w-10",
        iconOnly && size === "sm" && "w-8",
        iconOnly && size === "lg" && "w-12",
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {leading ? (
        <span aria-hidden className="inline-flex items-center">
          {leading}
        </span>
      ) : null}
      <span className="inline-flex items-center">{children}</span>
      {trailing ? (
        <span aria-hidden className="inline-flex items-center">
          {trailing}
        </span>
      ) : null}
    </button>
  );
});
