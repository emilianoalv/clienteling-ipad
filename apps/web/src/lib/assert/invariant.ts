/**
 * Throws if `condition` is falsy.
 * Use at trust boundaries (env parsing, API responses, switch defaults).
 */
export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Invariant failed: ${message}`);
}

/** Static check that all cases of a discriminated union were handled. */
export function assertNever(value: never, label = "value"): never {
  throw new Error(`Unhandled ${label}: ${JSON.stringify(value)}`);
}
