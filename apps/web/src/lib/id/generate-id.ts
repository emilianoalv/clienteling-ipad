import { customAlphabet } from "nanoid";

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
const nano = customAlphabet(alphabet, 12);

/**
 * Generates a prefixed, URL-safe id (12-char body, no ambiguous chars).
 *
 * @example generateId("cl") // "cl-7p9qe2j4mxva"
 */
export function generateId(prefix: string): string {
  return `${prefix}-${nano()}`;
}
