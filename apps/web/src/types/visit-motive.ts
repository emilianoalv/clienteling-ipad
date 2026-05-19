/**
 * Why the client came in. Captured at the top of visit / sale forms and
 * stored on the resulting `Interaction.motive`. Independent of outcome —
 * a client can come with motive "promo" and not buy, or with "concern" and
 * end up purchasing.
 */
export type VisitMotive =
  | "new-purchase"
  | "repurchase"
  | "gift"
  | "concern"
  | "promo"
  | "browse";

export interface VisitMotiveOption {
  id: VisitMotive;
  label: string;
}

export const VISIT_MOTIVES: ReadonlyArray<VisitMotiveOption> = [
  { id: "new-purchase", label: "Nueva compra" },
  { id: "repurchase", label: "Recompra" },
  { id: "gift", label: "Regalo" },
  { id: "concern", label: "Preocupación" },
  { id: "promo", label: "Promoción" },
  { id: "browse", label: "Conocer productos" },
];

/**
 * Motivos válidos en Registrar visita (sin venta). Los motivos relacionados
 * con compra (new-purchase, repurchase, gift) viven exclusivamente en
 * Registrar venta porque ahí es donde se captura la transacción.
 */
export const VISIT_ONLY_MOTIVES: ReadonlyArray<VisitMotiveOption> = [
  { id: "concern", label: "Preocupación" },
  { id: "promo", label: "Promoción" },
  { id: "browse", label: "Conocer productos" },
];
