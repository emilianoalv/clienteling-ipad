/**
 * `consultation` feature — public API (F3.5).
 *
 * Owns the 5-step diagnosis wizard that produces a Recommendation, and the
 * basket / POS-handoff view that converts that recommendation into a purchase.
 */
export { ConsultationWizard, type ConsultationWizardProps } from "./components/consultation-wizard";
export { Basket, type BasketProps } from "./components/basket";

export { fetchConsultationContext } from "./server/fetch-consultation-context";
export { fetchBasketContext } from "./server/fetch-basket-context";
export { listRecommendations, type ListRecommendationsArgs } from "./server/list-recommendations";

export { saveRecommendation } from "./actions/save-recommendation";
export { handoffRecommendation } from "./actions/handoff-recommendation";

export { suggestProducts } from "./services/suggest-products";
export {
  saveRecommendationSchema,
  type SaveRecommendationInput,
  SKIN_TYPES,
  TONES,
  type SkinType,
  type Tone,
} from "./schemas/save-recommendation.schema";
