"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { Button, Icon } from "@/components/primitives";

export interface BarcodeScannerProps {
  open: boolean;
  onScan: (code: string) => void;
  onClose: () => void;
  /** Optional hint shown above the camera area, e.g. "Apunta al código SKU del producto". */
  hint?: string;
}

type Status = "idle" | "starting" | "scanning" | "denied" | "no-camera" | "error";

/**
 * Full-screen modal that opens the device camera, decodes barcodes/QR with
 * @zxing/browser, and calls `onScan(code)` when one is detected.
 *
 * Closes automatically after a successful scan. Handles permission denial,
 * absence of camera, and runtime errors with explicit UI states.
 */
export function BarcodeScanner({ open, onScan, onClose, hint }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const reader = new BrowserMultiFormatReader();
    setStatus("starting");
    setErrorMessage(null);

    const startScanner = async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (cancelled) return;
        if (!devices.length) {
          setStatus("no-camera");
          return;
        }
        // Prefer the rear-facing camera if there are multiple (iPad / phone).
        const rear =
          devices.find((d) => /back|rear|environment/i.test(d.label)) ?? devices[devices.length - 1];
        const deviceId = rear?.deviceId;
        if (!videoRef.current || !deviceId) return;

        const controls = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, _err, ctrl) => {
            if (cancelled) {
              ctrl.stop();
              return;
            }
            if (result) {
              const text = result.getText().trim();
              if (text) {
                ctrl.stop();
                controlsRef.current = null;
                onScan(text);
              }
            }
          },
        );
        if (cancelled) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setStatus("scanning");
      } catch (err: unknown) {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === "NotAllowedError") {
          setStatus("denied");
        } else if (err instanceof DOMException && err.name === "NotFoundError") {
          setStatus("no-camera");
        } else {
          setStatus("error");
          setErrorMessage(err instanceof Error ? err.message : "Error desconocido");
        }
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, onScan]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Escanear código SKU"
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-xl w-full max-w-[640px] overflow-hidden flex flex-col">
        <header className="flex items-center justify-between px-5 py-4 border-b border-line">
          <div>
            <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
              Escanear SKU
            </div>
            <h2 className="m-0 mt-1 font-display text-[24px] leading-none">Apunta al código</h2>
          </div>
          <Button variant="ghost" iconOnly onClick={onClose} aria-label="Cerrar">
            <Icon name="x" />
          </Button>
        </header>

        <div className="relative bg-ink aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          {status === "scanning" ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-[260px] h-[140px] rounded-md border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
            </div>
          ) : null}
          {status !== "scanning" ? (
            <div className="absolute inset-0 flex items-center justify-center text-white text-center px-6">
              <StatusMessage status={status} errorMessage={errorMessage} />
            </div>
          ) : null}
        </div>

        <footer className="px-5 py-4 flex items-center gap-3 flex-wrap">
          <p className="m-0 flex-1 text-[14.5px] text-ink/70 leading-snug min-w-[200px]">
            {hint ?? "Apunta al código de barras del producto. Se detecta automáticamente."}
          </p>
          <Button onClick={onClose}>Cancelar</Button>
        </footer>
      </div>
    </div>
  );
}

function StatusMessage({ status, errorMessage }: { status: Status; errorMessage: string | null }) {
  if (status === "starting") return <p className="m-0">Iniciando cámara…</p>;
  if (status === "denied")
    return (
      <p className="m-0">
        Permiso de cámara denegado. Habilítalo en la configuración del navegador y vuelve a abrir.
      </p>
    );
  if (status === "no-camera") return <p className="m-0">No se detectó cámara en este dispositivo.</p>;
  if (status === "error")
    return <p className="m-0">Error al iniciar la cámara: {errorMessage ?? "—"}</p>;
  return null;
}
