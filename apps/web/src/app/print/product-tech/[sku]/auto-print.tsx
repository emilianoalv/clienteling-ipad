"use client";

import { useEffect } from "react";

/**
 * Dispara el diálogo de impresión del navegador apenas se monta. Damos
 * un pequeño delay para asegurar que las fuentes externas y el layout
 * estén listos — sin esto, Safari y Chrome pueden imprimir con el
 * fallback de Times New Roman.
 */
export function AutoPrint() {
  useEffect(() => {
    const id = window.setTimeout(() => {
      window.print();
    }, 400);
    return () => window.clearTimeout(id);
  }, []);
  return null;
}
