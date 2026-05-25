"use client";

import type { Channel } from "@/types/communication";
import { EmailPreview } from "./email-preview";
import { SmsPreview } from "./sms-preview";
import { WhatsappPreview } from "./whatsapp-preview";

export interface MessagePreviewProps {
  channel: Channel;
  body: string;
  /** Asunto — solo se usa en Email. */
  subject: string;
  /** Nombre del cliente. */
  contactName: string;
  /** Iniciales del cliente (para el avatar circular del header de WA). */
  contactInitials: string;
  /** Teléfono — se muestra en WA y SMS. */
  contactPhone: string;
  /** Email — se muestra en el Email mockup. */
  contactEmail: string;
  /** Nombre de la BA (primer nombre típicamente) — header del mockup. */
  fromName: string;
  /** Marca para mostrar al lado del nombre del BA en el header. */
  fromBrand: string;
}

/**
 * Dispatcher de preview según el canal activo del composer.
 *
 * WhatsApp y SMS son mockups tipo iPhone (header del contacto + burbuja
 * con el body). Email es un mockup tipo Mail.app (header borrador con
 * De/Para/Asunto + cuerpo plano). Cada uno usa colores característicos
 * de su app real para que la BA reconozca a primera vista qué medio
 * está por usar.
 */
export function MessagePreview(props: MessagePreviewProps) {
  if (props.channel === "Email") {
    return (
      <EmailPreview
        body={props.body}
        subject={props.subject}
        fromName={props.fromName}
        fromBrand={props.fromBrand}
        toEmail={props.contactEmail}
      />
    );
  }
  if (props.channel === "SMS") {
    return (
      <SmsPreview
        body={props.body}
        contactName={props.contactName}
        contactPhone={props.contactPhone}
      />
    );
  }
  return (
    <WhatsappPreview
      body={props.body}
      contactName={`${props.fromName} · ${props.fromBrand}`}
      contactInitials={props.contactInitials}
    />
  );
}
