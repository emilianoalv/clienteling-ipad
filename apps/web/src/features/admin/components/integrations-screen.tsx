"use client";

import { useState, useTransition } from "react";
import type { Integration, IntegrationKey, IntegrationStatus } from "@/types/integration";
import { Button, Chip, Icon } from "@/components/primitives";
import { Card, KvRow } from "@/components/patterns";
import { toggleIntegrationStatusAction } from "../actions/toggle-integration-status";

const STATUS_VARIANT: Record<IntegrationStatus, "ok" | "warn" | "neutral"> = {
  live: "ok",
  sandbox: "warn",
  stub: "neutral",
};

export interface IntegrationsScreenProps {
  integrations: readonly Integration[];
}

/**
 * Panel de integraciones del Admin Central. Permite alternar status
 * sandbox ↔ live para integraciones con adapter listo (POS, WhatsApp,
 * e-Commerce). Stub (ModiFace) queda read-only hasta F4.
 *
 * El toggle es cosmético — no conecta APIs reales. Cuando Sprint 2
 * monte los adapters HTTP de verdad, este mismo botón inicia el
 * handshake.
 */
export function IntegrationsScreen({ integrations: initial }: IntegrationsScreenProps) {
  // Optimistic local state — el revalidatePath del action refresca el
  // server-rendered listado, pero mantenemos copia local para feedback
  // inmediato sin esperar el round-trip.
  const [integrations, setIntegrations] = useState(initial);
  const [pendingKey, setPendingKey] = useState<IntegrationKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function onToggle(key: IntegrationKey) {
    setError(null);
    setPendingKey(key);
    startTransition(async () => {
      const result = await toggleIntegrationStatusAction(key);
      setPendingKey(null);
      if (result.ok) {
        setIntegrations((prev) =>
          prev.map((i) =>
            i.key === key
              ? {
                  ...i,
                  status: result.status,
                  lastEvent: `Status → ${result.status} · ${new Date().toISOString().slice(0, 10)}`,
                }
              : i,
          ),
        );
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card variant="luxe">
        <span className="block text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
          Integraciones
        </span>
        <h2 className="m-0 font-display text-[30px] leading-tight">Estructura de sistema</h2>
        <p className="m-0 mt-1 text-[16px] max-w-[620px]">
          Activa o desactiva integraciones desde aquí. Sandbox = simulador local; Live = conectado
          a la API real (requiere adapter Sprint 2). Los stubs quedan inhabilitados hasta F4.
        </p>
      </Card>

      {error ? (
        <div className="inline-flex items-center gap-2 px-4 py-3 bg-err/[0.08] text-err rounded-md text-[15px] font-semibold border border-err/25 self-start">
          <Icon name="warning" /> {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        {integrations.map((i) => {
          const isStub = i.status === "stub";
          const isPending = pendingKey === i.key;
          const nextLabel = i.status === "live" ? "Pasar a sandbox" : "Activar live";
          return (
            <Card key={i.key}>
              <div className="flex items-center gap-2.5">
                <span className="inline-flex w-9 h-9 items-center justify-center rounded-md bg-bone">
                  <Icon name="plug" size={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[17px] font-semibold leading-tight truncate">{i.label}</div>
                  <div className="text-[15px] font-medium text-ink/60 truncate">{i.mode}</div>
                </div>
                <Chip variant={STATUS_VARIANT[i.status]} size="sm">
                  {i.status}
                </Chip>
              </div>
              <hr className="my-3 border-0 border-t border-dashed border-line" />
              <KvRow label="Último evento" value={i.lastEvent} />
              <KvRow label="Documentación" value="Ready for handoff" dashed={false} />
              <div className="flex gap-2 mt-3">
                <Button variant="default" size="sm" disabled>
                  Ver eventos
                </Button>
                <Button
                  variant={isStub ? "default" : "outline"}
                  size="sm"
                  onClick={() => onToggle(i.key)}
                  disabled={isStub || isPending}
                  loading={isPending}
                  title={isStub ? "Sin adapter — F4" : undefined}
                >
                  {isStub ? "Sin adapter" : nextLabel}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
