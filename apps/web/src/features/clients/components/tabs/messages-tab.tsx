"use client";

import { useMemo, useState } from "react";
import type { Client } from "@/types/client";
import type { Channel, Communication } from "@/types/communication";
import type { FollowupTask } from "@/types/followup-task";
import type { Template } from "@/types/template";
import { Button, Icon } from "@/components/primitives";
import type { IconName } from "@/types/icon";
import { Modal } from "@/components/feedback";
import { CommLog } from "@/features/communications";
import { Composer } from "@/features/followup/components/composer";

type ChannelFilter = "all" | Channel;

const CHANNEL_ICON: Record<Channel, IconName> = {
  WhatsApp: "whatsapp",
  Email: "email",
  SMS: "sms",
};

export interface MessagesTabProps {
  client: Client;
  communications: readonly Communication[];
  templates: readonly Template[];
  staffName: string;
  storeName: string;
  /**
   * Task pre-cargada — cuando viene, el modal del composer se abre
   * automáticamente al montar y el composer la recibe para pre-seleccionar
   * plantilla y fijar canal. Deep link "Responder" desde el inbox.
   */
  initialTask?: FollowupTask | null;
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
  initialTask,
}: MessagesTabProps) {
  // Si viene initialTask del deep-link, el modal abre solo al montar.
  const [open, setOpen] = useState(initialTask != null);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("all");

  const clientLookup = { [client.id]: client.name } as Record<string, string>;

  // Solo mostramos chips para canales presentes en las comms históricas
  // — evita ofrecer un filtro vacío. "Todos" siempre aparece primero
  // cuando hay al menos un canal.
  const availableChannels = useMemo<readonly ChannelFilter[]>(() => {
    const present = new Set<Channel>();
    for (const c of communications) present.add(c.channel);
    const ordered: Channel[] = [];
    for (const ch of ["WhatsApp", "Email", "SMS"] as const) {
      if (present.has(ch)) ordered.push(ch);
    }
    if (ordered.length === 0) return [];
    return ["all", ...ordered];
  }, [communications]);

  const filtered = useMemo(
    () =>
      channelFilter === "all"
        ? communications
        : communications.filter((c) => c.channel === channelFilter),
    [communications, channelFilter],
  );

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

      {availableChannels.length > 2 ? (
        <div className="flex items-center gap-1.5 flex-wrap">
          {availableChannels.map((ch) => {
            const active = channelFilter === ch;
            const label = ch === "all" ? "Todos" : ch;
            return (
              <button
                key={ch}
                type="button"
                onClick={() => setChannelFilter(ch)}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-[13px] font-semibold cursor-pointer transition-colors ${
                  active
                    ? "bg-ink text-paper border-ink"
                    : "bg-white text-ink/70 border-line hover:bg-bone hover:text-ink"
                }`}
              >
                {ch !== "all" ? <Icon name={CHANNEL_ICON[ch]} size={12} /> : null}
                {label}
              </button>
            );
          })}
        </div>
      ) : null}

      <CommLog communications={filtered} clientLookup={clientLookup} compact />

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
          task={initialTask ?? null}
          onSent={() => setOpen(false)}
        />
      </Modal>
    </div>
  );
}
