"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/primitives";
import { Modal } from "./modal";

export interface PreviewDialogProps {
  open: boolean;
  onClose: () => void;
  /**
   * Human-readable label of the feature being previewed, e.g. "usuarios" or
   * "plantillas de seguimiento". Inserted into the default description.
   */
  feature: string;
  /** Override the default title. */
  title?: string;
  /** Override the default body. Use when the feature needs custom copy. */
  description?: ReactNode;
}

/**
 * Dialog mostrado al hacer clic en acciones que aún no están conectadas a
 * Server Actions (típicamente CRUDs admin que vendrán en F4). El lenguaje
 * es consultor — nunca "coming soon" ni copy de error.
 */
export function PreviewDialog({
  open,
  onClose,
  feature,
  title,
  description,
}: PreviewDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title ?? "Funcionalidad en preview"}
      size="sm"
      footer={
        <Button variant="primary" size="sm" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {description ?? (
        <p className="m-0 text-[16px] leading-relaxed text-ink/80">
          La gestión completa de <strong>{feature}</strong> estará disponible
          en el rollout nacional. Esta vista es preview de la próxima fase.
        </p>
      )}
    </Modal>
  );
}
