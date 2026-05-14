/**
 * Nominal-typed string IDs to avoid mixing aggregates (e.g. ClientId vs StoreId).
 *
 * Usage:
 *   type ClientId = Branded<string, "Client">;
 *   const id = "cl-123" as ClientId;
 */
declare const __brand: unique symbol;
export type Branded<T, B extends string> = T & { readonly [__brand]: B };
