/* Handlers Web Push, importados por el SW generado (workbox.importScripts).
   Muestran la notificación al llegar un push y abren la app al tocarla. */
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = {}; }
  const title = data.title || "CanaryCab";
  const options = {
    body: data.body || "",
    icon: "/icons/pwa-192.png",
    badge: "/icons/pwa-192.png",
    tag: data.tag || "canarycab",
    renotify: true,
    vibrate: [400, 150, 400],
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ("focus" in w) { w.focus(); if (w.navigate) w.navigate(url); return; }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
