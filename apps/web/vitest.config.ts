import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    css: true,
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // The real "server-only" package throws when imported in jsdom; map to
      // an empty shim so tests can import server modules directly.
      "server-only": fileURLToPath(new URL("./test/server-only-shim.ts", import.meta.url)),
    },
  },
});
