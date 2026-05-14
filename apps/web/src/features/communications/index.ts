/**
 * `communications` feature — public API (F3.6).
 *
 * NOTE: Server-only entry points (`listCommunications`, repository access)
 * are NOT re-exported here so this barrel stays safe to import from client
 * components. Server callers should import directly from
 * `@/features/communications/server/list-communications`.
 */
export { CommLog, type CommLogProps } from "./components/comm-log";
export { CommMetrics, type CommMetricsProps } from "./components/comm-metrics";

export { sendCommunication } from "./actions/send-communication";

export {
  renderTemplate,
  missingTokens,
  type TemplateContext,
} from "./services/render-template";
export { aggregateCommStats, type CommStats } from "./services/comm-stats";
export {
  sendCommunicationSchema,
  type SendCommunicationInput,
} from "./schemas/send-communication.schema";
