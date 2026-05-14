import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type CardVariant = "default" | "flat" | "luxe";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: CardVariant;
  children: ReactNode;
}

const VARIANT: Record<CardVariant, string> = {
  default: "bg-white border border-line rounded-lg p-5 shadow-lift",
  flat: "bg-white border border-line rounded-lg p-5",
  luxe: "bg-white border border-line rounded-xl p-6 shadow-[0_1px_2px_rgba(14,14,15,0.03)]",
};

export function Card({ variant = "default", className, children, ...rest }: CardProps) {
  return (
    <section className={cn(VARIANT[variant], className)} {...rest}>
      {children}
    </section>
  );
}
