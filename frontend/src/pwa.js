// Recuperación de despliegues: cada `vercel --prod` genera assets con hash nuevo.
// Una pestaña abierta desde antes del deploy sigue con el bundle viejo en memoria;
// si el usuario navega a una ruta que aún no había cargado (import() perezoso),
// pide un chunk cuyo hash ya no existe en el servidor → pantalla en blanco.
// Solución de dos capas:
//   1) Registro correcto del SW con comprobación periódica + recarga automática
//      en cuanto haya una versión nueva (arregla el caso antes de que ocurra).
//   2) Red de seguridad: si aun así falla un import() perezoso, recargar una vez.
import { registerSW } from "virtual:pwa-register";

registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    // Comprobar si hay una versión nueva cada 60 s (una pestaña abierta muchas
    // horas se entera igualmente, sin esperar a la siguiente carga completa).
    setInterval(() => registration.update().catch(() => {}), 60_000);
  },
});

const RELOAD_FLAG = "taya:reload-por-chunk-viejo";
const VENTANA_MS = 15_000; // evita bucle; no bloquea recargas de despliegues futuros

function esErrorDeChunkViejo(msg) {
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i.test(
    msg || ""
  );
}

function recargarUnaVez() {
  const ultima = Number(sessionStorage.getItem(RELOAD_FLAG) || 0);
  if (Date.now() - ultima < VENTANA_MS) return; // ya recargamos hace nada: no bucle
  sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
  window.location.reload();
}

window.addEventListener("error", (e) => {
  if (esErrorDeChunkViejo(e?.message)) recargarUnaVez();
});
window.addEventListener("unhandledrejection", (e) => {
  if (esErrorDeChunkViejo(e?.reason?.message)) recargarUnaVez();
});
