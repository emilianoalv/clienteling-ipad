"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/primitives";

export interface SignaturePadProps {
  /** dataURL PNG base64 cuando hay trazo; null cuando está limpio. */
  onChange: (signature: string | null) => void;
  /** Etiqueta para a11y. */
  ariaLabel?: string;
  /** Alto del canvas en px lógicos. Default 180. */
  height?: number;
}

/**
 * Lienzo de firma para iPad / mouse / Apple Pencil.
 *
 * Usa Pointer Events API porque cubre los 3 inputs con un solo handler:
 *   - touch (dedo en iPad)
 *   - mouse (demo en desktop)
 *   - pen (Apple Pencil)
 *
 * Maneja DPI retina escalando el canvas internamente para que los trazos
 * se vean nítidos. El dataURL serializado siempre se exporta a la
 * resolución lógica (más liviano en payload, suficiente para mostrar).
 *
 * No depende de librerías externas — el comportamiento es lo bastante
 * simple para resolverlo con 1 ref + 3 handlers.
 */
export function SignaturePad({
  onChange,
  ariaLabel = "Firma del cliente",
  height = 180,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  // Re-escala el canvas a devicePixelRatio para nitidez en retina iPad.
  // Se llama en mount y en cada resize.
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0E0E0F";
  }, []);

  useEffect(() => {
    setupCanvas();
    window.addEventListener("resize", setupCanvas);
    return () => window.removeEventListener("resize", setupCanvas);
  }, [setupCanvas]);

  function pointAt(e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const { x, y } = pointAt(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointAt(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (isEmpty) setIsEmpty(false);
    onChange(canvas.toDataURL("image/png"));
  }

  function onClear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={ariaLabel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="w-full bg-white border border-line rounded-[10px] cursor-crosshair"
          style={{ height: `${height}px`, touchAction: "none" }}
        />
        {isEmpty ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-ink/35 text-[15px] font-medium"
          >
            Firma aquí con el dedo o Apple Pencil
          </div>
        ) : null}
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClear}
          disabled={isEmpty}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-line bg-white text-ink/70 text-[13px] font-semibold hover:bg-bone hover:text-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Icon name="x" size={11} />
          Limpiar
        </button>
      </div>
    </div>
  );
}
