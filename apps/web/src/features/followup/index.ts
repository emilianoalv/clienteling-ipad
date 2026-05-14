/**
 * `followup` feature — public API (F3.6).
 *
 * Wraps the template composer + WhatsApp preview + bitácora tabs into a single
 * screen consumed by `(app)/ba/followup/page.tsx`. Send actions live in
 * `features/communications`.
 */
export { FollowupScreen, type FollowupScreenProps } from "./components/followup-screen";
export { Composer, type ComposerProps } from "./components/composer";
export { TemplateList } from "./components/template-list";
export { WhatsappPreview } from "./components/whatsapp-preview";
export { listTemplates, type ListTemplatesArgs } from "./server/list-templates";
