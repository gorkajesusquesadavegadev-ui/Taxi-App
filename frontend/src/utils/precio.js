// Formato de precios de cara al cliente.
//
// Al cliente NO se le enseña una cifra exacta, sino una horquilla ("34 – 40 €").
// En un taxi manda el taxímetro: el importe final depende del tráfico, de las
// esperas y de la ruta concreta que haga el conductor, cosas que ninguna app
// puede predecir. Dar un número al céntimo era prometer algo que no se controla.
//
// El rango lo calcula el backend (PrecioUtil.horquilla) y viaja en los campos
// precioMin/precioMax, para que web y app móvil enseñen exactamente lo mismo.

/** Importe suelto con céntimos: "12,50 €". Para importes ya cerrados o internos. */
export const eur = (v) => (v == null ? "—" : `${Number(v).toFixed(2)} €`);

/**
 * Horquilla de precio para el cliente: "34 – 40 €".
 * Si por lo que sea no vienen min/max (respuesta antigua en caché, error),
 * cae a la cifra exacta antes que no enseñar nada.
 */
export function rangoEur(min, max, exacto) {
  if (min != null && max != null) return `${Number(min)} – ${Number(max)} €`;
  return eur(exacto);
}

/** ¿Tenemos horquilla de verdad, o estamos cayendo al importe exacto? */
export const hayRango = (min, max) => min != null && max != null;
