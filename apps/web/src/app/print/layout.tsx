import type { ReactNode } from "react";

/**
 * Layout dedicado para rutas /print/*. Sin Shell ni TopBar — el contenido
 * cae directo en el body para que window.print() saque una hoja limpia y
 * para que el `@page` definido en cada page pueda dictar márgenes.
 */
export default function PrintLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-white text-ink">{children}</div>;
}
