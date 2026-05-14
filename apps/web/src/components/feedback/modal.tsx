"use client";

import { useEffect, useId, type ReactNode } from "react";
import { Icon } from "@/components/primitives";
import { cn } from "@/lib/cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

const SIZE: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-[420px]",
  md: "max-w-[560px]",
  lg: "max-w-[720px]",
};

/**
 * Accessible modal dialog. Closes on Escape or backdrop click. The parent
 * controls open state — no stacking logic here.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
  className,
}: ModalProps) {
  const headingId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-ink/40 backdrop-blur-[2px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "w-full bg-white rounded-xl shadow-lift-lg overflow-hidden flex flex-col animate-modal-pop",
          "max-h-[calc(100vh-56px)]",
          SIZE[size],
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 px-6 py-5 border-b border-line">
          <div>
            <h2
              id={headingId}
              className="m-0 font-display text-[22px] leading-tight tracking-[-0.01em]"
            >
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-1 text-[16px] font-medium leading-snug text-ink/60"
              >
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="shrink-0 w-9 h-9 rounded-md bg-transparent text-ink/60 cursor-pointer hover:bg-ink/[0.04] hover:text-ink"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <Icon name="x" />
          </button>
        </header>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
        {footer ? (
          <footer className="flex justify-end gap-2 px-6 py-4 border-t border-line bg-paper">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
