package com.taya.util;

import com.taya.model.Municipio;

/**
 * Deduce el municipio de dos maneras:
 *
 *   - deLicencia(texto): del número/etiqueta de la licencia del taxista. El
 *     dueño decía que en la licencia pone "LPA" o similar; se buscan palabras
 *     clave. Si no aparece ninguna, DESCONOCIDO y el admin lo corrige.
 *
 *   - dePunto(lat,lng): del lugar donde empieza el viaje. Manda para elegir
 *     tarifa urbana y para el matching. Las Palmas es el casco (radio); San
 *     Bartolomé de Tirajana es todo el término municipal del sur turístico
 *     (Maspalomas, Playa del Inglés, San Agustín, El Tablero, Bahía Feliz...),
 *     que por su extensión se acota con un rectángulo, no con un radio.
 *
 * Los patrones de licencia son fáciles de ampliar: si aparece otro formato,
 * se añade aquí sin tocar el resto.
 */
public final class Municipios {

    private Municipios() {}

    // ── Deducción por el texto de la licencia ──────────────────────────────
    public static Municipio deLicencia(String licencia) {
        if (licencia == null) return Municipio.DESCONOCIDO;
        String s = licencia.toUpperCase();
        if (s.contains("LPA") || s.contains("LAS PALMAS")) return Municipio.LAS_PALMAS;
        if (s.contains("SBT") || s.contains("TIRAJANA") || s.contains("MASPALOMAS")
            || s.contains("SAN BARTOLOME") || s.contains("SAN BARTOLOMÉ")) return Municipio.SAN_BARTOLOME;
        return Municipio.DESCONOCIDO;
    }

    // ── Deducción por geografía (dónde empieza el viaje) ───────────────────
    // Casco urbano de Las Palmas: mismo centro/radio que usa TarifaService.
    private static final double LPA_LAT = 28.123, LPA_LNG = -15.432, LPA_RADIO_KM = 7.0;

    // Término municipal de San Bartolomé de Tirajana (franja sur). Rectángulo
    // aproximado que cubre la zona turística y los núcleos habitados; se afina
    // si hiciera falta, pero para separar "sur de la isla" de "capital" basta.
    private static final double SBT_LAT_MIN = 27.72, SBT_LAT_MAX = 27.96;
    private static final double SBT_LNG_MIN = -15.66, SBT_LNG_MAX = -15.45;

    public static Municipio dePunto(double lat, double lng) {
        if (GeoUtil.haversineKm(lat, lng, LPA_LAT, LPA_LNG) <= LPA_RADIO_KM) return Municipio.LAS_PALMAS;
        if (lat >= SBT_LAT_MIN && lat <= SBT_LAT_MAX && lng >= SBT_LNG_MIN && lng <= SBT_LNG_MAX)
            return Municipio.SAN_BARTOLOME;
        return Municipio.DESCONOCIDO;
    }
}
