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
