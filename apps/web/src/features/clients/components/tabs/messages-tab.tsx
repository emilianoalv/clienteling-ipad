"use client";

import { useState } from "react";
import type { Client } from "@/types/client";
import type { Communication } from "@/types/communication";
import type { Template } from "@/types/template";
import { Button, Icon } from "@/components/primitives";
import { Modal } from "@/components/feedback";
import { CommLog } from "@/features/communications";
import { Composer } from "@/features/followup/components/composer";

export interface MessagesTabProps {
  client: Client;
  communications: readonly Communication[];
  templates: readonly Template[];
  staffName: string;
  storeName: string;
}

/**
 * Tab Mensajes del perfil del cliente — vista unificada que reemplaza
 * el log read-only anterior.
 *
 * Layout:
 *   - Header con botón "Nuevo mensaje" → abre modal con Composer en
 *     modo compact (cliente pre-cargado, plantillas filtradas a marca).
 *   - CommLog abajo filtrado al cliente actual.
 *
 * Cierra el gap más visible del flujo Comunicaciones↔Perfil: antes la
 * BA tenía que salir del perfil al `/ba/followup` para mandar un
 * mensaje. Ahora todo pasa sin perder el contexto del cliente.
 */
export function MessagesTab({
  client,
  communications,
  templates,
  staffName,
  storeName,
}: MessagesTabProps) {
  const [open, setOpen] = useState(false);

  const clientLookup = { [client.id]: client.name } as Record<string, string>;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[14.5px] font-semibold tracking-[0.12em] uppercase text-ink/60">
            Mensajes
          </div>
          <p className="m-0 mt-1 text-[14.5px] text-ink/60 leading-snug">
            Comunicaciones enviadas a {client.name.split(/\s+/)[0] ?? client.name}. Manda un nuevo
            mensaje con plantillas pre-cargadas.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          leading={<Icon name="whatsapp" size={12} />}
          onClick={() => setOpen(true)}
        >
          Nuevo mensaje
        </Button>
      </header>

      <CommLog communications={communications} clientLookup={clientLookup} compact />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Nuevo mensaje a ${client.name.split(/\s+/)[0] ?? client.name}`}
        description="Selecciona plantilla, ajusta el mensaje y abre tu app de mensajería."
        size="lg"
      >
        <Composer
          client={client}
          templates={templates}
          staffName={staffName}
          storeName={storeName}
          layout="compact"
        />
      </Modal>
    </div>
  );
}
