"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Client } from "@/types/client";
import type { Channel, Communication } from "@/types/communication";
import { Icon } from "@/components/primitives";
import type { IconName } from "@/types/icon";
import { CommLog } from "@/features/communications";

type ChannelFilter = "all" | Channel;

const CHANNEL_ICON: Record<Channel, IconName> = {
  WhatsApp: "whatsapp",
  Email: "email",
  SMS: "sms",
};

export interface MessagesTabProps {
  client: Client;
  communications: readonly Communication[];
  /** Oculta el botón "Nuevo mensaje" cuando el viewer no es BA. */
  readOnly?: boolean;
}

/**
 * Tab Mensajes del perfil del cliente — log + entrada al composer.
 *
 * El composer vive en pantalla completa (`/ba/clients/[id]/message/new`)
 * para tener espacio para el preview tipo teléfono. Esta tab solo muestra
 * el historial filtrable + el botón que navega al composer.
 */
export function MessagesTab({ client, communications, readOnly = false }: MessagesTabProps) {
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
        {readOnly ? null : (
          <Link
            href={`/ba/clients/${client.id}/message/new`}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-line bg-white text-ink text-[14px] font-semibold no-underline hover:bg-bone transition-colors"
          >
            <Icon name="whatsapp" size={12} />
            Nuevo mensaje
          </Link>
        )}
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
    </div>
  );
}
