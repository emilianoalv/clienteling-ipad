/**
 * `clients` feature — public API.
 * Spec: docs/05-feature-modules.md § "features/clients/".
 */
export { ClientList } from "./components/client-list";
export { ClientProfile } from "./components/client-profile";
export { NewClientWizard } from "./components/new-client-wizard";
export { RegisterVisitForm } from "./components/register-visit-form";
export { RegisterSaleForm } from "./components/register-sale-form";

export { listClients } from "./server/list-clients";
export { fetchClient, fetchClientWithHistory } from "./server/fetch-client";

export { createClient } from "./actions/create-client";
export { registerVisit } from "./actions/register-visit";
export { registerSale } from "./actions/register-sale";
export { updateConsent } from "./actions/update-consent";

export { segmentClient } from "./services/segment-client";
export { calculateLevelProgress } from "./services/level-progress";
export { applyPurchaseToStats, applyVisitToStats } from "./services/update-client-stats";
export { listUpcomingEvents } from "./services/list-upcoming-events";
