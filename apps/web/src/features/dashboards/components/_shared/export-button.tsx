"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Icon } from "@/components/primitives";
import { cn } from "@/lib/cn";
import type { ExportFormat } from "@/lib/export";
import type { DashboardFilters } from "../../server/types";

export interface ExportArtifact {
  /** Base64-encoded XLSX/CSV body returned by the server action. */
  base64: string;
  mimeType: string;
  filename: string;
}

export interface ExportButtonProps {
  /**
   * Server action that produces the workbook. The signature matches the
   * server actions in `features/dashboards/server/actions/` so dashboards
   * pass them by reference — no inline wrapper, which would fail the RSC
   * serialization boundary when the parent dashboard is a Server Component.
   */
  onExport: (
    filters: DashboardFilters,
    format: ExportFormat,
  ) => Promise<ExportArtifact>;
  /** Current dashboard filters — forwarded to the server action. */
  filters: DashboardFilters;
  label?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
}

/**
 * Dropdown trigger that lets the user pick XLSX or CSV. Calls the provided
 * server action, decodes the base64 payload into a Blob, and triggers a
 * download. Renders a transient toast on success / error.
 */
export function ExportButton({
  onExport,
  filters,
  label = "Exportar",
  size = "md",
  disabled = false,
  className,
}: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handlePick = async (format: ExportFormat) => {
    setOpen(false);
    setBusy(format);
    try {
      const artifact = await onExport(filters, format);
      triggerDownload(artifact);
      setToast({ kind: "ok", text: `Exportado: ${artifact.filename}` });
    } catch (err) {
      console.error("export failed", err);
      setToast({
        kind: "err",
        text: "No fue posible generar el archivo. Intenta de nuevo.",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative inline-block", className)}>
      <Button
        variant="default"
        size={size}
        leading={<Icon name="download" size={12} />}
        trailing={<Icon name="chevron-down" size={12} />}
        disabled={disabled || busy !== null}
        loading={busy !== null}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {busy ? "Generando…" : label}
      </Button>
      {open ? (
        <ul
          role="menu"
          className="absolute right-0 z-30 mt-1 list-none m-0 p-1 bg-white border border-line rounded-md shadow-lift min-w-[180px]"
        >
          <li>
            <MenuItem onClick={() => handlePick("xlsx")}>
              Excel (.xlsx)
            </MenuItem>
          </li>
          <li>
            <MenuItem onClick={() => handlePick("csv")}>CSV (.csv)</MenuItem>
          </li>
        </ul>
      ) : null}
      {toast ? (
        <span
          role="status"
          className={cn(
            "absolute right-0 top-[calc(100%+8px)] whitespace-nowrap z-40 text-[14px] px-3 py-1.5 rounded-md border shadow-lift",
            toast.kind === "ok"
              ? "bg-ok/10 border-ok/30 text-ok"
              : "bg-err/10 border-err/30 text-err",
          )}
        >
          {toast.text}
        </span>
      ) : null}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="w-full text-left text-[15px] px-3 py-2.5 rounded-sm cursor-pointer hover:bg-bone min-h-10"
    >
      {children}
    </button>
  );
}

function triggerDownload(artifact: ExportArtifact): void {
  const buffer = base64ToArrayBuffer(artifact.base64);
  const blob = new Blob([buffer], { type: artifact.mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = artifact.filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
  }
  return buffer;
}
