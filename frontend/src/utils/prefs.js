// Preferencias locales (por navegador). Claves con default "activado".
const get = (k) => localStorage.getItem(k) !== "off";
const set = (k, v) => localStorage.setItem(k, v ? "on" : "off");

// Tonos de notificación disponibles. "beep" = sintético; el resto, ficheros.
export const TONOS = [
  { id: "tono1", label: "Tono 1", src: "/sounds/tono1.ogg" },
  { id: "tono2", label: "Tono 2", src: "/sounds/tono2.ogg" },
  { id: "tono3", label: "Tono 3", src: "/sounds/tono3.ogg" },
  { id: "beep", label: "Pitido clásico", src: null },
];
const TONO_DEFAULT = "tono1";

export const prefs = {
  getSound: () => get("taya:sound"),
  setSound: (v) => set("taya:sound", v),
  getNearby: () => get("taya:nearby"),
  setNearby: (v) => set("taya:nearby", v),
  getTono: () => localStorage.getItem("taya:tono") || TONO_DEFAULT,
  setTono: (id) => localStorage.setItem("taya:tono", id),
};

export function srcDeTono(id) {
  return TONOS.find((t) => t.id === id)?.src || null;
}

/** Reproduce un tono concreto (para previsualizar en Ajustes). */
export function reproducirTono(id) {
  const src = srcDeTono(id);
  if (!src) return beepSintetico();
  try {
    const a = new Audio(src);
    a.volume = 1;
    a.play().catch(() => beepSintetico());
  } catch {
    beepSintetico();
  }
}

import { toast } from "./toast.js";

/** Aviso completo: toast in-app + pitido + vibración + notificación navegador. */
export function avisar(titulo, cuerpo, tipo = "info") {
  toast(titulo, cuerpo, tipo);
  if (prefs.getSound()) beep();
  try {
    navigator.vibrate?.([120, 60, 120]);
  } catch {
    /* sin vibración */
  }
  try {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      new Notification(titulo, { body: cuerpo, icon: "/favicon.svg" });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((p) => {
        if (p === "granted") new Notification(titulo, { body: cuerpo });
      });
    }
  } catch {
    /* sin notificaciones */
  }
}

/** Aviso sonoro: reproduce el tono elegido por el usuario (default tono1). */
export function beep() {
  const src = srcDeTono(prefs.getTono());
  if (!src) return beepSintetico();
  try {
    const a = new Audio(src);
    a.volume = 1;
    a.play().catch(() => beepSintetico());
  } catch {
    beepSintetico();
  }
}

/** Pitido sintético de respaldo (sin ficheros de audio). */
export function beepSintetico() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    o.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.22, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    o.start();
    o.stop(ctx.currentTime + 0.5);
    setTimeout(() => ctx.close(), 600);
  } catch {
    /* sin audio disponible */
  }
}
