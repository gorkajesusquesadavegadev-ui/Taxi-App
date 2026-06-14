// Helpers de reservas: formato de fecha y enlace de WhatsApp.

export const fmtFechaReserva = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }) +
    " · " + d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
};

export const fmtFechaCorta = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) +
    " " + d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
};

/** Enlace wa.me; normaliza el número español (añade 34 si falta prefijo). */
export function whatsappLink(telefono, mensaje = "") {
  if (!telefono) return null;
  let n = telefono.replace(/[\s\-().]/g, "").replace(/^\+/, "");
  if (n.length === 9) n = "34" + n; // móvil español sin prefijo
  return `https://wa.me/${n}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ""}`;
}

/** Valor mínimo para un input datetime-local: dentro de 1 hora, hora local. */
export function minDateTimeLocal() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setSeconds(0, 0);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}
