/**
 * ESLint config for @clienteling/web.
 *
 * The `boundaries` plugin enforces the layer rules described in
 * docs/01-architecture.md § "Reglas concretas":
 *
 *   types  ←  config  ←  lib  ←  stores / hooks  ←  components  ←  features  ←  app
 *
 * Lower layers may not import upper layers.
 */
module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "next/typescript", "plugin:boundaries/recommended"],
  plugins: ["boundaries"],
  settings: {
    "boundaries/elements": [
      { type: "types", pattern: "src/types/**" },
      { type: "config", pattern: "src/config/**" },
      { type: "messages", pattern: "src/messages/**" },
      { type: "lib", pattern: "src/lib/**" },
      { type: "hooks", pattern: "src/hooks/**" },
      { type: "stores", pattern: "src/stores/**" },
      { type: "providers", pattern: "src/providers/**" },
      { type: "server", pattern: "src/server/**" },
      { type: "components", pattern: "src/components/**" },
      { type: "features", pattern: "src/features/*", capture: ["feature"] },
      { type: "app", pattern: "src/app/**" },
    ],
    "boundaries/include": ["src/**"],
  },
  rules: {
    "boundaries/element-types": [
      "error",
      {
        default: "disallow",
        rules: [
          { from: "types", allow: [] },
          { from: "config", allow: ["types"] },
          { from: "messages", allow: [] },
          { from: "lib", allow: ["types", "config"] },
          { from: "hooks", allow: ["types", "config", "lib"] },
          { from: "stores", allow: ["types", "config", "lib"] },
          { from: "providers", allow: ["types", "config", "lib", "hooks", "stores"] },
          { from: "server", allow: ["types", "config", "lib"] },
          {
            from: "components",
            allow: ["types", "config", "lib", "hooks", "stores", "components"],
          },
          {
            from: "features",
            allow: [
              "types",
              "config",
              "messages",
              "lib",
              "hooks",
              "stores",
              "providers",
              "server",
              "components",
              ["features", { feature: "${from.feature}" }],
              // F3.6 pair: followup is the composer surface; communications
              // owns the log/send primitives that followup and the client
              // profile reuse. Both directions are explicitly allowed.
              ["features", { feature: "communications" }],
              // F3.9: admin reuses the canonical `segmentClient` rule from
              // the clients feature so segments stay in sync across screens.
              // F3.10: home composes the BA "Hoy" landing and reuses
              // `listUpcomingEvents` from the clients feature.
              ["features", { feature: "clients" }],
              // W5 (visit wizard): clients picker abre FichaTecnicaModal
              // del catálogo para que la BA pueda justificar recomendaciones
              // con claims clínicos reales en piso.
              ["features", { feature: "catalog" }],
              // AD1: AppointmentDetail dentro del perfil del cliente reutiliza
              // las server actions transition/reschedule/cancel del feature
              // appointments para evitar duplicar la lógica de transiciones.
              ["features", { feature: "appointments" }],
            ],
          },
          {
            from: "app",
            allow: [
              "types",
              "config",
              "messages",
              "lib",
              "hooks",
              "stores",
              "providers",
              "server",
              "components",
              "features",
            ],
          },
        ],
      },
    ],
    "boundaries/no-unknown": "error",
    "boundaries/no-unknown-files": "off",
    "@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports" }],
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    complexity: ["warn", 10],
    "max-lines": ["warn", { max: 300, skipComments: true, skipBlankLines: true }],
    "max-lines-per-function": ["warn", { max: 80, skipComments: true, skipBlankLines: true }],
  },
};
