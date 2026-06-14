// Bus de toasts simple (pub/sub) para avisos in-app que salen por arriba.
const subs = new Set();
let seq = 0;

export function toast(titulo, cuerpo, tipo = "info", meta = null) {
  const t = { id: ++seq, titulo, cuerpo, tipo, meta };
  subs.forEach((fn) => fn(t));
}

export function onToast(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}
