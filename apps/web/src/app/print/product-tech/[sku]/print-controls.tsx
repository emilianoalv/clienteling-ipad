"use client";

/**
 * Botón "Imprimir / Guardar como PDF". Vive en su propio módulo cliente
 * porque la page es Server Component y Next 15 prohíbe pasar onClick a
 * un <button> renderizado en el servidor.
 */
export function PrintControls() {
  return (
    <div className="no-print mt-6 flex gap-2 justify-end">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-white rounded cursor-pointer text-[13.5px] font-semibold"
      >
        Imprimir / Guardar como PDF
      </button>
    </div>
  );
}
