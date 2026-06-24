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

/**
 * Pide permiso (si hace falta), suscribe el navegador al push y guarda la
 * suscripción en el backend. Devuelve true si quedó activo.
 */
export async function activarPush() {
  if (!pushSoportado()) return false;
  try {
    const permiso = await Notification.requestPermission();
    if (permiso !== "granted") return false;

    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const { publicKey } = await api.vapidPublicKey();
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }
    const json = sub.toJSON();
    await api.pushSubscribe({
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    });
    return true;
  } catch (_) {
    return false;
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
