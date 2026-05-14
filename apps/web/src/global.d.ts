/**
 * Strongly-typed next-intl messages.
 *
 * The default-locale bundle is the canonical schema. Other locales must
 * provide the same shape (or fall back to keys present in es-MX.json).
 */
import type messages from "./messages/es-MX.json";

type Messages = typeof messages;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface IntlMessages extends Messages {}
}

export {};
