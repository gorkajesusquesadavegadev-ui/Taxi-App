// Preferencias locales (por navegador). Claves con default "activado".
const get = (k) => localStorage.getItem(k) !== "off";
const set = (k, v) => localStorage.setItem(k, v ? "on" : "off");

export const prefs = {
  getSound: () => get("taya:sound"),
  setSound: (v) => set("taya:sound", v),
  getNearby: () => get("taya:nearby"),
  setNearby: (v) => set("taya:nearby", v),
};

/** Pitido corto de notificación (sin ficheros de audio). */
export function beep() {
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
