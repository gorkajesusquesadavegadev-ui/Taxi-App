/*
 * Service Worker de autodestrucción.
 *
 * Sustituye al SW de la app (Workbox) en los navegadores que ya la tenían
 * instalada. Al activarse: borra TODAS las cachés (incluida la app y las
 * teselas del mapa), se desregistra, y recarga la pestaña — que ya recibe la
 * página de "próximamente". Sin este fichero, quien tuviera la PWA seguiría
 * viendo la app cacheada aunque el servidor ya sirva otra cosa.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (e) { /* nada que limpiar */ }
    try { await self.registration.unregister(); } catch (e) {}
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      try { client.navigate(client.url); } catch (e) {}
    }
  })());
});
// Sin manejador fetch: todo va a la red -> la página de "próximamente".
