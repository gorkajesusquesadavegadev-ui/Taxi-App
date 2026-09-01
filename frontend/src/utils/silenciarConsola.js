/**
 * Deja la consola muda en producción.
 *
 * El build ya elimina las llamadas a `console` de nuestro código y de la
 * mayoría de las librerías. Pero algunas no se pueden quitar en compilación
 * porque no llaman a `console` directamente, sino a través del objeto global
 * (`window.console.warn`, un alias interno...). Ningún minificador puede
 * detectar eso, así que la única forma de garantizarlo es en ejecución.
 *
 * Qué NO arregla, y conviene tenerlo claro: los errores que escribe el propio
 * navegador cuando una petición falla —«POST /api/auth/login 429 (Too Many
 * Requests)»— no los genera JavaScript, los genera el navegador. No hay forma
 * de silenciarlos desde una página web; le pasa igual a cualquier sitio. No
 * son una fuga: quien abre las herramientas de desarrollo ve el tráfico de red
 * de todos modos, y ahí no viaja nada que no sea suyo.
 *
 * Escotilla: `localStorage.setItem("taya:debug", "1")` y recargar devuelve la
 * consola, para poder diagnosticar un problema real en producción.
 */
const METODOS = ["log", "debug", "info", "warn", "error", "trace", "dir", "table", "group", "groupEnd", "time", "timeEnd", "count", "assert"];

export function silenciarConsola() {
  if (!import.meta.env.PROD) return;
  try {
    if (localStorage.getItem("taya:debug") === "1") return;
  } catch (_) {
    // localStorage bloqueado (modo privado, cookies desactivadas): se silencia.
  }
  const vacia = () => {};
  for (const m of METODOS) {
    try {
      if (typeof console[m] === "function") console[m] = vacia;
    } catch (_) {
      // Algunos navegadores no dejan reasignar; se ignora y se sigue.
    }
  }
}
