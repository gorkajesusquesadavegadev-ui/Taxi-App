package com.taya.service;

import com.taya.repository.ConfiguracionTarifaRepository;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Tarifas oficiales — el cálculo que decide cuánto paga la gente.
 *
 * Esta clase ya dio dos fallos reales en producción: la Tarifa 3 se estimaba
 * como un múltiplo inventado de la urbana (un taxista lo detectó porque su
 * taxímetro marcaba 30 € donde la app decía 25,52) y faltaba el suplemento de
 * aeropuerto. Ninguno de los dos habría llegado a un cliente con estos tests.
 *
 * Cada importe esperado está calculado a mano desde la tabla del BOC, no
 * copiado de lo que devuelve el código: un test que se limita a repetir la
 * salida actual no detecta que la salida actual esté mal.
 *
 * Fuentes:
 *   Tarifa 1 urbana  — BOC nº 174, 3-sep-2025  (Resolución 14-ago-2025)
 *   Tarifa 3 interurb— BOC nº 59, 24-mar-2023  (Orden 14-mar-2023)
 */
class TarifaServiceTest {

    private static final ZoneId CANARIAS = ZoneId.of("Atlantic/Canary");

    // Puntos reales. Los dos primeros caen dentro del casco de Las Palmas
    // (radio 7 km); los demás, fuera, que es lo que dispara Tarifa 3.
    private static final double LPA_LAT = 28.123, LPA_LNG = -15.432;   // Las Palmas centro
    private static final double MUELLE_LAT = 28.1450, MUELLE_LNG = -15.4280; // Muelle Sta. Catalina
    private static final double AEROPUERTO_LAT = 27.9319, AEROPUERTO_LNG = -15.3866; // LPA
    private static final double MASPALOMAS_LAT = 27.7606, MASPALOMAS_LNG = -15.5860;
    private static final double MASPALOMAS2_LAT = 27.7650, MASPALOMAS2_LNG = -15.5860;

    private FestivoService festivos;

    /** Servicio con el reloj clavado en un instante concreto (hora canaria). */
    private TarifaService alas(String fechaHoraIso) {
        festivos = mock(FestivoService.class);           // por defecto: nada es festivo
        return conFestivos(fechaHoraIso, festivos);
    }

    private TarifaService conFestivos(String fechaHoraIso, FestivoService f) {
        var instante = LocalDateTime.parse(fechaHoraIso).atZone(CANARIAS).toInstant();
        return new TarifaService(
            mock(ConfiguracionTarifaRepository.class),
            mock(OsrmClient.class),
            f,
            Clock.fixed(instante, CANARIAS));
    }

    private static void euros(String esperado, BigDecimal real) {
        assertEquals(new BigDecimal(esperado), real);
    }

    // ─────────────────── Tarifa 1 · urbana (BOC 174/2025) ───────────────────
    //
    // Trayecto de 5 km dentro de Las Palmas. Cobrables = 5,000 - 0,500 = 4,500
    // (la bajada de bandera ya incluye los primeros 500 m).
    // Suplemento: radiotaxi 0,60 € (esta app es central de radiotaxi).

    @Nested class Tarifa1Urbana {

        private BigDecimal urbano5km(String cuando) {
            return alas(cuando).precioPorRuta(LPA_LAT, LPA_LNG, 28.100, -15.420, 5.0);
        }

        @Test void diurno_laborable() {
            // 3,05 + 0,85 × 4,500 = 6,875  → +0,60 = 7,475 → 7,48
            euros("7.48", urbano5km("2026-08-12T10:00:00"));   // miércoles
        }

        @Test void diurno_sabado() {
            // 3,25 + 0,90 × 4,500 = 7,300  → +0,60 = 7,90
            euros("7.90", urbano5km("2026-08-15T10:00:00"));   // sábado
        }

        @Test void diurno_domingo() {
            // 4,00 + 1,00 × 4,500 = 8,500  → +0,60 = 9,10
            euros("9.10", urbano5km("2026-08-16T10:00:00"));   // domingo
        }

        @Test void diurno_festivo_entre_semana() {
            var f = mock(FestivoService.class);
            when(f.esFestivo(LocalDate.of(2026, 8, 12))).thenReturn(true);
            var t = conFestivos("2026-08-12T10:00:00", f);
            // festivo en miércoles → misma franja que domingo: 4,00 + 1,00
            euros("9.10", t.precioPorRuta(LPA_LAT, LPA_LNG, 28.100, -15.420, 5.0));
        }

        @Test void diurno_vispera_nochebuena() {
            // 24/12 diurno es víspera: 4,00 + 0,90 × 4,500 = 8,050 → +0,60 = 8,65
            euros("8.65", urbano5km("2026-12-24T10:00:00"));
        }

        @Test void nocturno_entre_semana() {
            // 3,80 + 0,90 × 4,500 = 7,850 → +0,60 = 8,45
            euros("8.45", urbano5km("2026-08-12T23:00:00"));   // miércoles noche
        }

        @Test void nocturno_viernes() {
            // 4,30 + 1,00 × 4,500 = 8,800 → +0,60 = 9,40
            euros("9.40", urbano5km("2026-08-14T23:00:00"));   // viernes noche
        }

        @Test void nocturno_domingo() {
            // 4,75 + 1,00 × 4,500 = 9,250 → +0,60 = 9,85
            euros("9.85", urbano5km("2026-08-16T23:00:00"));
        }

        @Test void nocturno_nochebuena() {
            // 6,95 + 1,00 × 4,500 = 11,450 → +0,60 = 12,05
            euros("12.05", urbano5km("2026-12-24T23:00:00"));
        }

        @Test void nocturno_nochevieja() {
            euros("12.05", urbano5km("2026-12-31T23:00:00"));
        }

        @Test void la_madrugada_sigue_siendo_nocturna() {
            // 05:59 es nocturna; a las 06:00 ya no. Frontera exacta del BOC.
            euros("8.45", urbano5km("2026-08-12T05:00:00"));   // nocturno entre semana
        }

        @Test void a_las_seis_empieza_el_diurno() {
            euros("7.48", urbano5km("2026-08-12T06:00:00"));
        }

        @Test void a_las_veintidos_empieza_el_nocturno() {
            euros("8.45", urbano5km("2026-08-12T22:00:00"));
        }
    }

    // ────────────────── Tarifa 3 · interurbana (BOC 59/2023) ──────────────────
    //
    // Aquí NO hay bajada de bandera: hay un mínimo de percepción que ya incluye
    // los primeros 1.500 m. Trayecto de 25 km → cobrables 23,500.

    @Nested class Tarifa3Interurbana {

        private BigDecimal aMaspalomas25km(String cuando) {
            return alas(cuando).precioPorRuta(LPA_LAT, LPA_LNG, MASPALOMAS_LAT, MASPALOMAS_LNG, 25.0);
        }

        @Test void diurno_laborable() {
            // 3,85 + 1,35 × 23,500 = 35,575 → +0,60 = 36,175 → 36,18
            euros("36.18", aMaspalomas25km("2026-08-12T10:00:00"));
        }

        @Test void nocturno() {
            // 4,25 + 1,55 × 23,500 = 40,675 → +0,60 = 41,275 → 41,28
            euros("41.28", aMaspalomas25km("2026-08-12T23:00:00"));
        }

        @Test void domingo_diurno_cobra_como_nocturno() {
            // El BOC mete domingo/festivo (0-24h) en la misma franja que la noche.
            euros("41.28", aMaspalomas25km("2026-08-16T10:00:00"));
        }

        @Test void sabado_diurno_es_franja_normal() {
            // A diferencia de Tarifa 1, en T3 el sábado NO tiene franja propia.
            euros("36.18", aMaspalomas25km("2026-08-15T10:00:00"));
        }

        @Test void navideno_nocturno() {
            // 6,54 + 1,55 × 23,500 = 42,965 → +0,60 = 43,565 → 43,57
            euros("43.57", aMaspalomas25km("2026-12-24T23:00:00"));
        }

        @Test void reyes_vispera_nocturno() {
            // 5/1 en franja nocturna también es navideño según el BOC.
            euros("43.57", aMaspalomas25km("2027-01-05T23:00:00"));
        }

        @Test void navideno_de_dia_no_lleva_recargo_navideno() {
            // El recargo navideño de T3 es solo 22h-24h; de día es franja normal.
            euros("36.18", aMaspalomas25km("2026-12-24T10:00:00"));
        }
    }

    // ───────────────────────────── Suplementos ─────────────────────────────

    @Nested class Suplementos {

        @Test void urbana_lleva_radiotaxi_siempre() {
            // 3,05 + 0,85 × 4,500 = 6,875; sin radiotaxi serían 6,88
            euros("7.48", alas("2026-08-12T10:00:00")
                .precioPorRuta(LPA_LAT, LPA_LNG, 28.100, -15.420, 5.0));
        }

        @Test void urbana_al_muelle_suma_setenta_centimos() {
            // 6,875 + 0,60 + 0,70 = 8,175 → 8,18
            euros("8.18", alas("2026-08-12T10:00:00")
                .precioPorRuta(LPA_LAT, LPA_LNG, MUELLE_LAT, MUELLE_LNG, 5.0));
        }

        @Test void interurbana_al_aeropuerto_suma_dos_diez() {
            // 35,575 + 0,60 + 2,10 = 38,275 → 38,28
            euros("38.28", alas("2026-08-12T10:00:00")
                .precioPorRuta(LPA_LAT, LPA_LNG, AEROPUERTO_LAT, AEROPUERTO_LNG, 25.0));
        }

        @Test void el_suplemento_de_aeropuerto_vale_en_cualquier_isla() {
            // Tenerife Sur (TFS). El de T3 aplica en toda la comunidad autónoma,
            // no solo en Gran Canaria — fallo real corregido en su día.
            double tfsLat = 28.0445, tfsLng = -16.5715;
            euros("38.28", alas("2026-08-12T10:00:00")
                .precioPorRuta(27.9, -16.6, tfsLat, tfsLng, 25.0));
        }

        @Test void en_interurbana_el_muelle_cuenta_como_puerto_no_como_muelle_urbano() {
            // 2,10 € (recinto portuario de T3), no los 0,70 € del muelle urbano.
            euros("38.28", alas("2026-08-12T10:00:00")
                .precioPorRuta(MASPALOMAS_LAT, MASPALOMAS_LNG, MUELLE_LAT, MUELLE_LNG, 25.0));
        }

        @Test void desde_el_aeropuerto_tambien_suma_no_solo_hacia_el() {
            euros("38.28", alas("2026-08-12T10:00:00")
                .precioPorRuta(AEROPUERTO_LAT, AEROPUERTO_LNG, LPA_LAT, LPA_LNG, 25.0));
        }
    }

    // ──────────────────── Metros incluidos en el mínimo ────────────────────

    @Nested class MetrosIncluidos {

        @Test void urbana_los_primeros_quinientos_metros_no_se_cobran() {
            // 300 m → solo bandera + radiotaxi
            euros("3.65", alas("2026-08-12T10:00:00")
                .precioPorRuta(LPA_LAT, LPA_LNG, 28.124, -15.433, 0.3));
        }

        @Test void urbana_justo_en_quinientos_metros() {
            euros("3.65", alas("2026-08-12T10:00:00")
                .precioPorRuta(LPA_LAT, LPA_LNG, 28.124, -15.433, 0.5));
        }

        @Test void interurbana_los_primeros_mil_quinientos_no_se_cobran() {
            // 1 km → solo mínimo de percepción + radiotaxi
            euros("4.45", alas("2026-08-12T10:00:00")
                .precioPorRuta(MASPALOMAS_LAT, MASPALOMAS_LNG, MASPALOMAS2_LAT, MASPALOMAS2_LNG, 1.0));
        }

        @Test void interurbana_justo_en_mil_quinientos() {
            euros("4.45", alas("2026-08-12T10:00:00")
                .precioPorRuta(MASPALOMAS_LAT, MASPALOMAS_LNG, MASPALOMAS2_LAT, MASPALOMAS2_LNG, 1.5));
        }

        @Test void un_viaje_de_cero_km_cobra_el_minimo() {
            euros("3.65", alas("2026-08-12T10:00:00")
                .precioPorRuta(LPA_LAT, LPA_LNG, LPA_LAT, LPA_LNG, 0.0));
        }
    }

    // ───────────────────────── Elección de tarifa ─────────────────────────

    @Nested class QueTarifaSeAplica {

        private final TarifaService t = alas("2026-08-12T10:00:00");

        @Test void dentro_de_las_palmas_es_urbana() {
            assertEquals("Tarifa 1 · Zona urbana",
                t.zonaLabel(LPA_LAT, LPA_LNG, 28.100, -15.420));
        }

        @Test void al_aeropuerto_es_interurbana() {
            assertEquals("Tarifa 3 · Interurbano",
                t.zonaLabel(LPA_LAT, LPA_LNG, AEROPUERTO_LAT, AEROPUERTO_LNG));
        }

        @Test void al_sur_es_interurbana() {
            assertEquals("Tarifa 3 · Interurbano",
                t.zonaLabel(LPA_LAT, LPA_LNG, MASPALOMAS_LAT, MASPALOMAS_LNG));
        }

        @Test void entre_dos_municipios_distintos_es_interurbana() {
            // Santa Cruz de Tenerife → La Laguna. Son dos cascos urbanos
            // distintos y dos municipios distintos, así que no puede aplicarse
            // la tarifa urbana de ninguno de los dos.
            assertEquals("Tarifa 3 · Interurbano",
                t.zonaLabel(28.463, -16.251, 28.487, -16.313));
        }

        @Test void entre_islas_distintas_es_interurbana() {
            // Las Palmas → Arrecife. Ambos son capitales con casco urbano
            // propio; sin comprobar que sea el MISMO casco, esto se cobraba
            // como Tarifa 1 urbana.
            assertEquals("Tarifa 3 · Interurbano",
                t.zonaLabel(LPA_LAT, LPA_LNG, 28.963, -13.548));
        }

        @Test void fuera_de_todo_casco_urbano_es_interurbana() {
            assertEquals("Tarifa 3 · Interurbano",
                t.zonaLabel(MASPALOMAS_LAT, MASPALOMAS_LNG, MASPALOMAS2_LAT, MASPALOMAS2_LNG));
        }
    }

    // ───────────────────────────── Regresiones ─────────────────────────────

    @Nested class Regresiones {

        @Test void las_palmas_al_aeropuerto_no_vuelve_a_quedarse_corto() {
            // El caso que destapó el fallo: un taxista dijo que su taxímetro
            // marcaba unos 30 € donde la app calculaba 25,52. La app aplicaba
            // Tarifa 1 con un multiplicador inventado en vez de la tabla de T3.
            // 25,7 km, laborable diurno:
            //   3,85 + 1,35 × 24,200 = 36,520 → +0,60 +2,10 = 39,22
            var precio = alas("2026-08-12T10:00:00")
                .precioPorRuta(LPA_LAT, LPA_LNG, AEROPUERTO_LAT, AEROPUERTO_LNG, 25.7);
            euros("39.22", precio);
        }

        @Test void el_precio_siempre_sale_con_dos_decimales() {
            var p = alas("2026-08-12T10:00:00")
                .precioPorRuta(LPA_LAT, LPA_LNG, 28.100, -15.420, 3.333);
            assertEquals(2, p.scale());
        }

        @Test void la_tarifa_no_depende_del_orden_origen_destino_en_zona() {
            var t = alas("2026-08-12T10:00:00");
            assertEquals(
                t.zonaLabel(LPA_LAT, LPA_LNG, AEROPUERTO_LAT, AEROPUERTO_LNG),
                t.zonaLabel(AEROPUERTO_LAT, AEROPUERTO_LNG, LPA_LAT, LPA_LNG));
        }
    }

    // ────────────── La estimación completa (lo que sale por la API) ──────────────
    //
    // precioPorRuta es el núcleo, pero lo que consume el cliente es estimarVia:
    // pide la ruta a OSRM, calcula el precio con la distancia REAL del recorrido
    // y compone la respuesta. Aquí OSRM va mockeado: lo que se comprueba es el
    // ensamblaje, no el router.

    @Nested class EstimacionCompleta {

        private TarifaService conRuta(double km, double minutos) {
            var osrm = mock(OsrmClient.class);
            when(osrm.rutaVia(any())).thenReturn(
                new OsrmClient.Ruta(km, minutos, java.util.List.of(), false));
            var instante = LocalDateTime.parse("2026-08-12T10:00:00").atZone(CANARIAS).toInstant();
            return new TarifaService(
                mock(ConfiguracionTarifaRepository.class),
                osrm,
                mock(FestivoService.class),
                Clock.fixed(instante, CANARIAS));
        }

        @Test void devuelve_precio_horquilla_zona_y_suplementos() {
            var e = conRuta(25.0, 28.4)
                .estimar(LPA_LAT, LPA_LNG, MASPALOMAS_LAT, MASPALOMAS_LNG);

            euros("36.18", e.precioEstimado());
            euros("36", e.precioMin());
            euros("41", e.precioMax());
            assertEquals("Tarifa 3 · Interurbano", e.zona());
            assertEquals("Radiotaxi 0,60€", e.suplementos());
        }

        @Test void el_detalle_de_suplementos_nombra_el_aeropuerto() {
            var e = conRuta(25.0, 28.0)
                .estimar(LPA_LAT, LPA_LNG, AEROPUERTO_LAT, AEROPUERTO_LNG);
            assertEquals("Radiotaxi 0,60€ + Aeropuerto/Puerto 2,10€", e.suplementos());
            euros("38.28", e.precioEstimado());
        }

        @Test void los_minutos_se_redondean_hacia_arriba() {
            // 28,1 min → 29. Nunca prometer al cliente menos tiempo del estimado.
            var e = conRuta(25.0, 28.1)
                .estimar(LPA_LAT, LPA_LNG, MASPALOMAS_LAT, MASPALOMAS_LNG);
            assertEquals(0, new BigDecimal("29").compareTo(e.duracionMin()));
        }

        @Test void con_paradas_el_precio_usa_la_distancia_del_recorrido_completo() {
            // La zona la marca origen→destino, pero el importe sale de los km
            // reales del recorrido con paradas: 30 km en vez de los 25 directos.
            var e = conRuta(30.0, 40.0).estimarVia(
                LPA_LAT, LPA_LNG, MASPALOMAS_LAT, MASPALOMAS_LNG,
                java.util.List.of(new double[]{27.9, -15.5}));
            // 3,85 + 1,35 × 28,500 = 42,325 → +0,60 = 42,925 → 42,93
            euros("42.93", e.precioEstimado());
            assertEquals("Tarifa 3 · Interurbano", e.zona());
        }
    }

    // ──────────── Datos de tarifa que se le muestran al usuario ────────────

    @Nested class InfoDeTarifaVigente {

        @Test void de_dia_entre_semana_describe_la_franja_correcta() {
            var m = alas("2026-08-12T10:00:00").infoActual();
            assertEquals("Diurna laborable", m.get("franja"));
            assertEquals(false, m.get("esFestivo"));
            euros("3.05", (BigDecimal) m.get("bajadaBandera"));
            euros("3.85", (BigDecimal) m.get("minimoPercepcionT3"));
            assertEquals(500, m.get("metrosIncluidosUrbano"));
            assertEquals(1500, m.get("metrosIncluidosT3"));
        }

        @Test void de_noche_lo_dice() {
            assertEquals("Nocturna (22:00–6:00)", alas("2026-08-12T23:00:00").infoActual().get("franja"));
        }

        @Test void el_sabado_lo_dice() {
            assertEquals("Sábado", alas("2026-08-15T10:00:00").infoActual().get("franja"));
        }

        @Test void el_domingo_lo_dice() {
            var m = alas("2026-08-16T10:00:00").infoActual();
            assertEquals("Festiva/Domingo", m.get("franja"));
            assertEquals(true, m.get("esFestivo"));
        }

        @Test void publica_los_dos_suplementos() {
            var m = alas("2026-08-12T10:00:00").infoActual();
            euros("0.60", (BigDecimal) m.get("suplementoRadiotaxi"));
            euros("2.10", (BigDecimal) m.get("suplementoAeropuertoPuerto"));
        }
    }

    // ───────────────────── Radio de búsqueda de taxis ─────────────────────

    @Nested class RadioDeBusqueda {

        @Test void sin_configuracion_en_base_de_datos_usa_cinco_kilometros() {
            var repo = mock(ConfiguracionTarifaRepository.class);
            when(repo.findAll()).thenReturn(java.util.List.of());
            var t = new TarifaService(repo, mock(OsrmClient.class), mock(FestivoService.class),
                Clock.systemUTC());
            // Si esto devolviera null o 0, el matching no encontraría ningún taxi.
            euros("5", t.radioBusquedaKm());
        }
    }

    // ───────────── La horquilla que se le enseña al cliente ─────────────

    @Nested class Horquilla {

        @Test void son_cinco_euros_por_encima_del_entero_inferior() {
            var r = com.taya.util.PrecioUtil.horquilla(new BigDecimal("36.18"));
            euros("36", r[0]);
            euros("41", r[1]);
        }

        @Test void un_precio_entero_no_se_mueve_hacia_abajo() {
            var r = com.taya.util.PrecioUtil.horquilla(new BigDecimal("40.00"));
            euros("40", r[0]);
            euros("45", r[1]);
        }

        @Test void nunca_deja_ver_los_centimos() {
            var r = com.taya.util.PrecioUtil.horquilla(new BigDecimal("8.29"));
            assertEquals(0, r[0].scale());
            assertEquals(0, r[1].scale());
        }

        @Test void un_precio_nulo_no_revienta() {
            var r = com.taya.util.PrecioUtil.horquilla(null);
            assertEquals(null, r[0]);
            assertEquals(null, r[1]);
        }
    }
}
