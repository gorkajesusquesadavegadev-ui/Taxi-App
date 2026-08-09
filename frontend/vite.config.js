import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate", // al desplegar nueva web, la app se actualiza sola
      // Registro manual en src/pwa.js (comprobación cada 60s + recarga en cuanto
      // hay versión nueva); evita el registro automático mínimo sin esa lógica.
      injectRegister: false,
      includeAssets: ["favicon-32.png", "icons/apple-touch-icon.png"],
      manifest: {
        name: "CanaryCab · Tu App de Taxis de Canarias",
        short_name: "CanaryCab",
        description: "Tu taxi en las Islas Canarias: ruta real, tarifa oficial y seguimiento en vivo.",
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
        // El Service Worker nuevo se activa SOLO, sin esperar a que se cierren
        // todas las pestañas ni a que la página le mande nada.
        //
        // Por qué: hasta ahora el nuevo quedaba "esperando" y el viejo seguía
        // sirviendo la app entera desde su caché — incluidas las cabeceras HTTP,
        // así que un usuario veía la CSP antigua y una versión de hace días
        // aunque el servidor ya tuviera la nueva. Y no bastaba con arreglar el
        // código de la página: quien tuviera una versión anterior seguía
        // ejecutando el código VIEJO, que nunca pedía el relevo. Poniéndolo en
        // el propio SW, el relevo ya no depende de la página.
        //
        // Contrapartida: una pestaña abierta puede quedarse a medias entre dos
        // versiones; por eso pwa.js recarga al detectar el cambio de control.
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: "/index.html",
        // Las guías de tarifas son páginas estáticas fuera del SPA. Sin esto,
        // navigateFallback las secuestra y sirve el index.html de la app: quien
        // ya tuviera el Service Worker instalado acababa en el login en vez de
        // en la página. (Googlebot no ejecuta el SW, así que el problema solo
        // lo sufren los usuarios reales — justo los que traería el SEO.)
        // Las páginas legales (/privacidad, /terminos…) NO van en esta lista a
        // propósito, aunque también tengan HTML estático. El fichero estático
        // es solo español —es la versión vinculante— y existe para que Google
        // pueda indexarlas; quien ya tiene la app instalada sigue viéndolas
        // dentro de la SPA, que respeta el idioma que eligió. Metiéndolas aquí,
        // un alemán que recargara /privacidad saltaría al español.
        navigateFallbackDenylist: [/^\/(tarifas-taxi-gran-canaria|taxi-aeropuerto-las-palmas|taxi-aeropuerto-maspalomas|taxi-aeropuerto-puerto-mogan|taxi-aeropuerto-puerto-rico|taxi-airport-las-palmas|taxi-airport-maspalomas|taxi-airport-puerto-mogan|taxi-airport-puerto-rico|taxi-fares-gran-canaria|taxi-flughafen-las-palmas|taxi-flughafen-maspalomas|taxi-flughafen-puerto-mogan|taxi-flughafen-puerto-rico|taxi-las-palmas-maspalomas-de|taxi-las-palmas-maspalomas-en|taxi-las-palmas-maspalomas|taxitarife-gran-canaria)$/],
        // handlers Web Push (push + notificationclick) en el SW generado
        importScripts: ["/push-sw.js"],
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
  server: { port: 5173, host: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("leaflet") || id.includes("react-leaflet")) return "leaflet";
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/") || id.includes("scheduler")) return "react";
          if (id.includes("react-router")) return "router";
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
