// Preferencias locales (por navegador). Claves con default "activado".
const get = (k) => localStorage.getItem(k) !== "off";
const set = (k, v) => localStorage.setItem(k, v ? "on" : "off");

/*
 * Tonos de notificación.
 *
 * Se sintetizan con Web Audio en vez de reproducir ficheros de audio. Motivos:
 *
 *  - Los .ogg anteriores eran de procedencia desconocida. Un sonido descargado
 *    arrastra una licencia, y no había constancia de cuál.
 *  - Suenan en el instante: no hay descarga, ni fallo si la red va mal, ni
 *    entrada que precargar en el Service Worker.
 *  - El aviso llega justo cuando el usuario mira otra cosa; que dependa de un
 *    fichero cacheado es un punto de fallo innecesario.
 *
 * Los identificadores se mantienen (tono1..tono3, beep) para no invalidar la
 * preferencia ya guardada en localStorage de quien ya eligió uno.
 */
export const TONOS = [
  { id: "tono1", labelKey: "set.toneChime" },
  { id: "tono2", labelKey: "set.toneAlert" },
  { id: "tono3", labelKey: "set.toneSoft" },
  { id: "beep", labelKey: "set.tonePing" },
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

/* ── síntesis ────────────────────────────────────────────────────────────── */

let _ctx = null;

/**
 * Un único AudioContext para toda la sesión, en vez de uno por aviso.
 *
 * Cada contexto reserva una salida de audio del sistema, así que crearlos sin
 * cerrarlos va acumulando recursos. Chrome 148 aguanta cientos sin quejarse
 * —comprobado— pero no todos los navegadores son igual de generosos y no hay
 * ninguna razón para pedir uno nuevo cada vez.
 *
 * Lo que sí obliga a reutilizarlo es la política de autoplay: el contexto nace
 * "suspended" y solo pasa a "running" tras un gesto del usuario. Manteniendo
 * uno vivo, ese permiso se conserva y los avisos posteriores suenan sin
 * depender de que el usuario acabe de tocar la pantalla.
 */
function contexto() {
  const Ctx = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
  if (!Ctx) return null;
  try {
    if (!_ctx || _ctx.state === "closed") _ctx = new Ctx();
    if (_ctx.state === "suspended") _ctx.resume().catch(() => {});
    return _ctx;
  } catch {
    return null;
  }
}

/**
 * Una nota con cuerpo de campana.
 *
 * Un oscilador solo suena a zumbido de electrodoméstico. Lo que da timbre son
 * los armónicos: se suma la fundamental y dos parciales por encima, cada uno
 * más flojo que el anterior. El tercero va a 3.01× y no a 3× exactamente —
 * esa desafinación mínima es lo que separa una campana de un pitido de horno.
 *
 * El ataque no es instantáneo (6 ms) porque arrancar la onda en seco produce
 * un chasquido audible. La caída es exponencial, que es como pierde energía
 * un cuerpo que vibra de verdad.
 */
function nota(ctx, salida, { freq, t0, dur, vol = 1, brillo = 1 }) {
  const PARCIALES = [
    { mult: 1, nivel: 1 },
    { mult: 2, nivel: 0.3 * brillo },
    { mult: 3.01, nivel: 0.13 * brillo },
  ];
  const ATAQUE = 0.006;
  const ini = ctx.currentTime + t0;

  for (const p of PARCIALES) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq * p.mult;

    const pico = vol * p.nivel;
    g.gain.setValueAtTime(0.0001, ini);
    g.gain.exponentialRampToValueAtTime(pico, ini + ATAQUE);
    // Los parciales agudos se apagan antes que la fundamental, igual que en un
    // instrumento real: si duran lo mismo, el resultado suena sintético.
    g.gain.exponentialRampToValueAtTime(0.0001, ini + dur / p.mult ** 0.5);

    osc.connect(g);
    g.connect(salida);
    osc.start(ini);
    osc.stop(ini + dur + 0.05);
  }
}

/** Cadena de salida: filtro suave + volumen general. */
function salidaMaestra(ctx, corte) {
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = corte;
  lp.Q.value = 0.7;
  const g = ctx.createGain();
  // 0.7 deja el pico sobre 0.4: se oye con ruido de carretera y aún sobra
  // margen de sobra antes de saturar (verificado renderizando la síntesis).
  g.gain.value = 0.7;
  lp.connect(g);
  g.connect(ctx.destination);
  return lp;
}

/*
 * Cada tono es una secuencia de notas. Los intervalos son musicales a
 * propósito: dos notas a distancia arbitraria suenan a error del sistema,
 * mientras que una quinta o un acorde mayor se leen como "atención" sin
 * resultar agresivos.
 */
const RECETAS = {
  // Quinta justa ascendente (Re5 → La5). Cálido y neutro: es el que más veces
  // va a sonar, así que no puede cansar.
  tono1: {
    corte: 4200,
    notas: [
      { freq: 587.33, t0: 0, dur: 0.5, vol: 0.5, brillo: 0.9 },
      { freq: 880.0, t0: 0.13, dur: 0.6, vol: 0.45, brillo: 0.9 },
    ],
  },
  // Acorde mayor ascendente (Fa#5 - La#5 - Do#6). Más brillante y con tres
  // golpes: para el taxista, que puede tener el móvil en el salpicadero.
  tono2: {
    corte: 5200,
    notas: [
      { freq: 739.99, t0: 0, dur: 0.34, vol: 0.42, brillo: 1.25 },
      { freq: 932.33, t0: 0.085, dur: 0.34, vol: 0.42, brillo: 1.25 },
      { freq: 1108.73, t0: 0.17, dur: 0.55, vol: 0.46, brillo: 1.15 },
    ],
  },
  // Una sola nota grave y larga (La4), filtro bajo y poco volumen. Para quien
  // quiere enterarse sin que lo oiga el vagón entero.
  tono3: {
    corte: 2400,
    notas: [{ freq: 440.0, t0: 0, dur: 0.9, vol: 0.4, brillo: 0.55 }],
  },
  // El pitido de siempre, para quien lo prefiera. Dos golpes cortos en vez de
  // un zumbido largo: informa igual y molesta menos.
  beep: {
    corte: 6000,
    notas: [
      { freq: 880.0, t0: 0, dur: 0.14, vol: 0.4, brillo: 0.2 },
      { freq: 880.0, t0: 0.17, dur: 0.2, vol: 0.4, brillo: 0.2 },
    ],
  },
};

/** Reproduce un tono concreto (para previsualizar en Ajustes). */
export function reproducirTono(id) {
  const receta = RECETAS[id] || RECETAS[TONO_DEFAULT];
  const ctx = contexto();
  if (!ctx) return;
  try {
    const salida = salidaMaestra(ctx, receta.corte);
    for (const n of receta.notas) nota(ctx, salida, n);
  } catch {
    /* sin audio disponible */
  }
}

import { toast } from "./toast.js";

/** Aviso completo: toast in-app + tono + vibración + notificación navegador. */
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

/** Aviso sonoro con el tono elegido por el usuario. */
export function beep() {
  reproducirTono(prefs.getTono());
}
