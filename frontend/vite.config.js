import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate", // al desplegar nueva web, la app se actualiza sola
      includeAssets: ["favicon-32.png", "icons/apple-touch-icon.png"],
      manifest: {
        name: "TAYA · Taxi de Gran Canaria",
        short_name: "TAYA",
        description: "Pide, reserva y viaja por Gran Canaria con tarifas oficiales.",
        lang: "es",
        theme_color: "#0B2E4F",
        background_color: "#0B2E4F",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        categories: ["travel", "navigation", "business"],
        icons: [
          { src: "icons/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // assets propios precacheados; mapas/fuentes van a red con caché
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin.includes("basemaps.cartocdn.com"),
            handler: "CacheFirst",
            options: {
              cacheName: "mapa-tiles",
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 14 },
            },
          },
          {
            urlPattern: ({ url }) => url.origin.includes("fonts.gstatic.com"),
            handler: "CacheFirst",
            options: { cacheName: "fuentes", expiration: { maxEntries: 20, maxAgeSeconds: 31536000 } },
          },
        ],
      },
      devOptions: { enabled: false }, // PWA solo en build (dev queda limpio)
    }),
  ],
  server: { port: 5173, host: true }, // host:true → accesible desde el móvil por IP
});
