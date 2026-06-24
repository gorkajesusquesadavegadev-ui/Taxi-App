import { api } from "./client.js";

export function pushSoportado() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function permisoActual() {
  return pushSoportado() ? Notification.permission : "unsupported";
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function esIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
function esPWAInstalada() {
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

/**
 * Pide permiso, suscribe el navegador al push y lo guarda en el backend.
 * Devuelve { ok, motivo } para poder explicar el fallo al usuario.
 */
export async function activarPush() {
  if (!pushSoportado()) {
    if (esIOS() && !esPWAInstalada())
      return { ok: false, motivo: "En iPhone debes instalar la app (Compartir → Añadir a pantalla de inicio) y abrirla desde el icono." };
    return { ok: false, motivo: "Tu navegador no soporta notificaciones push." };
  }
  try {
    const permiso = await Notification.requestPermission();
    if (permiso === "denied")
      return { ok: false, motivo: "Has bloqueado las notificaciones. Actívalas en los ajustes del navegador para este sitio." };
    if (permiso !== "granted")
      return { ok: false, motivo: "No diste permiso de notificaciones." };

    const reg = await navigator.serviceWorker.ready;
    const { publicKey } = await api.vapidPublicKey();
    if (!publicKey) return { ok: false, motivo: "El servidor no devolvió la clave de notificaciones." };
    const appKey = urlBase64ToUint8Array(publicKey);

    // Borra cualquier suscripción previa (posible clave VAPID distinta = causa de
    // "push service error") y crea una nueva. Reintenta una vez ante fallos
    // transitorios del servicio de push (FCM).
    let sub = await reg.pushManager.getSubscription();
    if (sub) { try { await sub.unsubscribe(); } catch (_) {} sub = null; }
    try {
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey });
    } catch (e1) {
      await new Promise((r) => setTimeout(r, 1200));
      try {
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey });
      } catch (e2) {
        return { ok: false, motivo: "El servicio de notificaciones rechazó la suscripción (FCM). Comprueba que tu móvil tiene Google Play Services y conexión, y reintenta. (" + (e2?.message || e2) + ")" };
      }
    }
    const json = sub.toJSON();
    await api.pushSubscribe({
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    });
    return { ok: true, motivo: "" };
  } catch (e) {
    return { ok: false, motivo: "Error activando avisos: " + (e?.message || e) };
  }
}

/** Comprueba si ya hay una suscripción activa en este navegador. */
export async function pushActivo() {
  if (!pushSoportado() || Notification.permission !== "granted") return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    return !!(await reg.pushManager.getSubscription());
  } catch (_) {
    return false;
  }
}

export async function desactivarPush() {
  if (!pushSoportado()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await api.pushUnsubscribe({ endpoint: sub.endpoint });
      await sub.unsubscribe();
    }
  } catch (_) {}
}
