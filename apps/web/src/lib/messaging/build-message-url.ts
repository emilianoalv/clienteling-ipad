/**
 * Generates deep-link URLs that hand off composition to the user's
 * native app (WhatsApp / Apple Mail / iOS Messages) with the body
 * pre-populated. This is the "delegated send" pattern: la BA aprieta
 * Enviar, su iPad cambia a WhatsApp con el mensaje listo, ella sólo
 * da Enviar.
 *
 * Why deep links instead of an API integration:
 *   - Zero backend, zero per-message cost.
 *   - No WhatsApp Business API authorization required — the message
 *     goes from the BA's own WhatsApp account, not from a corporate
 *     line.
 *   - Works with any WhatsApp install (personal, Business, Business
 *     API client).
 *
 * Limitations (be honest):
 *   - We don't know if the message was actually sent. The Composer
 *     asks the BA on return via a confirmation dialog.
 *   - Replies arrive in the BA's WhatsApp, not in the app.
 *   - No delivery / read receipts in the app.
 */

import type { Channel } from "@/types/communication";

export interface BuildMessageUrlInput {
  channel: Channel;
  /** E.164-ish phone for WhatsApp / SMS. Spaces, dashes, parens y "+" se limpian. */
  phone?: string;
  /** Email address for Email channel. */
  email?: string;
  /** Body the BA composed — gets URL-encoded into the deep link. */
  body: string;
  /** Optional subject for Email channel (mailto supports it). */
  subject?: string;
}

/**
 * Sanitizes a phone string into the all-digits format `wa.me` expects.
 * Examples: "+52 55 1234 5678" → "525512345678", "(55) 1234-5678" → "5512345678".
 */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function buildMessageUrl(input: BuildMessageUrlInput): string {
  const body = encodeURIComponent(input.body);
  switch (input.channel) {
    case "WhatsApp": {
      const phone = input.phone ? normalizePhone(input.phone) : "";
      // wa.me funciona sin teléfono también — abre WhatsApp y deja a la
      // BA escoger contacto. Útil como fallback si el cliente no tiene
      // tel en el perfil.
      return `https://wa.me/${phone}?text=${body}`;
    }
    case "Email": {
      const email = input.email ?? "";
      const subject = input.subject ? `subject=${encodeURIComponent(input.subject)}&` : "";
      return `mailto:${email}?${subject}body=${body}`;
    }
    case "SMS": {
      const phone = input.phone ? normalizePhone(input.phone) : "";
      // El formato sms: cambia entre iOS y Android. iOS soporta
      // sms:NUMERO&body=… o sms:NUMERO?body=… — usamos el query
      // estándar que ambos respetan.
      return `sms:${phone}?body=${body}`;
    }
  }
}
