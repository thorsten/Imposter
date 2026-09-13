import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // Bei Deployment in ein Unterverzeichnis anpassen, z. B. "/impostor/"
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png", "apple-touch-icon.png"],
      workbox: {
        // Alles Gebaute wird precacht -> App laeuft komplett offline
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
      },
      manifest: {
        name: "Wer ist der Impostor",
        short_name: "Impostor",
        description: "Partyspiel fuer ein Handy, das rumgereicht wird.",
        lang: "de",
        start_url: ".",
        scope: ".",
        display: "standalone",
        orientation: "portrait",
        background_color: "#141A2E",
        theme_color: "#141A2E",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.js"],
    include: ["tests/**/*.test.{js,jsx}"],
    coverage: {
      // main.jsx ist nur der Mount-Aufruf, in jsdom nicht sinnvoll messbar.
      include: ["src/**"],
      exclude: ["src/main.jsx"],
      reporter: ["text", "html"],
      thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
    },
  },
});
