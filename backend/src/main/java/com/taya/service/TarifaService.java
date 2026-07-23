package com.taya.service;
import com.taya.dto.response.EstimacionResponse;
import com.taya.repository.ConfiguracionTarifaRepository;
import com.taya.util.GeoUtil;
import org.springframework.stereotype.Service;
import java.math.*;
import java.time.*;

/**
 * Tarifas oficiales del taxi en Canarias — dos regímenes distintos, cada uno
 * con su propia fuente legal, que NO deben mezclarse ni aproximarse uno con
 * el otro (fallo real corregido en esta clase: antes Tarifa 3 se estimaba
 * como un múltiplo inventado de la urbana, dando precios muy por debajo de
 * lo que de verdad se cobra):
 *
 * — TARIFA 1 (urbana, solo dentro del casco de Las Palmas de Gran Canaria):
 *   BOC núm. 174 (3-sep-2025), Resolución 14-ago-2025, Viceconsejería de
 *   Industria, Comercio y Consumo — https://www.gobiernodecanarias.org/boc/2025/174/3151.html
 *   Bajada de bandera incluye los primeros 500 m. Suplementos (radiotaxi
 *   0,60€, muelle 0,70€) solo aplican si la carrera empieza Y termina en
 *   zona urbana (así lo restringe el propio BOC, punto 4).
 *
 * — TARIFA 3 (interurbana, todo lo que no sea el casco urbano — aeropuerto,
 *   sur, norte, entre municipios, entre islas): BOC núm. 59 (24-mar-2023),
 *   Orden 14-mar-2023, Consejería de Obras Públicas, Transportes y Vivienda,
 *   que modifica el Decreto 246/2017 — https://sede.gobiernodecanarias.org/boc/boc-a-2023-059-868.pdf
 *   Aquí NO hay "bajada de bandera": hay un "mínimo de percepción" que ya
 *   incluye los primeros 1.500 m, y dos suplementos propios que NO son los
 *   de Tarifa 1: radiotaxi 0,60€ (igual) y aeropuerto/puerto 2,10€ (muy
 *   distinto del muelle urbano de 0,70€, y aplica en TODA Canarias, no solo
 *   Gran Canaria). Válida para toda la Comunidad Autónoma, no solo un
 *   municipio — por eso el taxímetro real de un taxista experimentado nunca
 *   coincidía con el ×1,35 que este código inventaba antes.
 */
@Service
public class TarifaService {
    private final ConfiguracionTarifaRepository repo;
    private final OsrmClient osrm;
    private final FestivoService festivos;
    public TarifaService(ConfiguracionTarifaRepository repo, OsrmClient osrm, FestivoService festivos) {
        this.repo = repo; this.osrm = osrm; this.festivos = festivos;
    }

    private static final ZoneId     CANARIAS          = ZoneId.of("Atlantic/Canary");
    private static final BigDecimal KM_INCLUIDOS_URB   = new BigDecimal("0.500");
    private static final BigDecimal KM_INCLUIDOS_T3    = new BigDecimal("1.500");

    private enum Isla { GRAN_CANARIA, TENERIFE, LANZAROTE, FUERTEVENTURA, LA_PALMA, LA_GOMERA, EL_HIERRO, UNKNOWN }

    private static Isla islaDeL(double lat, double lng) {
        if (lat >= 27.70 && lat <= 28.20 && lng >= -15.85 && lng <= -15.30) return Isla.GRAN_CANARIA;
        if (lat >= 27.90 && lat <= 28.60 && lng >= -16.95 && lng <= -16.10) return Isla.TENERIFE;
        if (lat >= 28.75 && lat <= 29.25 && lng >= -13.95 && lng <= -13.40) return Isla.LANZAROTE;
        if (lat >= 27.60 && lat <= 28.75 && lng >= -14.55 && lng <= -13.70) return Isla.FUERTEVENTURA;
        if (lat >= 28.40 && lat <= 28.95 && lng >= -17.95 && lng <= -17.60) return Isla.LA_PALMA;
        if (lat >= 28.00 && lat <= 28.30 && lng >= -17.45 && lng <= -17.00) return Isla.LA_GOMERA;
        if (lat >= 27.60 && lat <= 27.95 && lng >= -18.20 && lng <= -17.85) return Isla.EL_HIERRO;
        return Isla.UNKNOWN;
    }

    // [lat, lng, radioKm] capitales/núcleos urbanos de cada isla — solo aquí
    // (y solo si origen Y destino caen dentro) se aplica Tarifa 1.
    private static final double[][] CENTROS_URBANOS = {
        {28.123, -15.432, 7.0},  // Las Palmas de Gran Canaria
        {28.463, -16.251, 7.0},  // Santa Cruz de Tenerife
        {28.487, -16.313, 5.0},  // San Cristóbal de La Laguna
        {28.963, -13.548, 5.0},  // Arrecife (Lanzarote)
        {28.499, -13.862, 5.0},  // Puerto del Rosario (Fuerteventura)
        {28.684, -17.764, 4.0},  // Santa Cruz de La Palma
        {28.091, -17.113, 3.5},  // San Sebastián de La Gomera
        {27.807, -17.912, 3.0},  // Valverde (El Hierro)
    };

    private static boolean esUrbano(double lat, double lng) {
        for (double[] c : CENTROS_URBANOS) {
            if (GeoUtil.haversineKm(lat, lng, c[0], c[1]) <= c[2]) return true;
        }
        return false;
    }

    // Muelle Santa Catalina (Puerto de Las Palmas) — mismas coords que DataSeeder.
    // Suplemento de Tarifa 1 (urbana): solo este puerto está cubierto; si se
    // amplía el servicio a otras islas con paradas en su puerto, añadir aquí.
    private static final double MUELLE_LAT = 28.1450, MUELLE_LNG = -15.4280;
    private static final double MUELLE_RADIO_KM = 0.4;

    private static boolean tocaMuelle(double lat, double lng) {
        return GeoUtil.haversineKm(lat, lng, MUELLE_LAT, MUELLE_LNG) <= MUELLE_RADIO_KM;
    }

    // Aeropuertos principales de Canarias — para el suplemento de Tarifa 3
    // (BOC 59/2023: "servicio con origen o destino en recintos aeroportuarios
    // o portuarios", 2,10€, aplica en TODA la comunidad autónoma). Puertos:
    // de momento solo se cubre el de Las Palmas (arriba); si se detecta que
    // hace falta para otras islas, añadir sus coordenadas al mismo patrón.
    private static final double[][] AEROPUERTOS = {
        {27.9319, -15.3866}, // Gran Canaria (LPA)
        {28.4827, -16.3415}, // Tenerife Norte / Los Rodeos (TFN)
        {28.0445, -16.5715}, // Tenerife Sur / Reina Sofía (TFS)
        {28.9455, -13.6052}, // Lanzarote / Guacimeta (ACE)
        {28.4527, -13.8638}, // Fuerteventura / El Matorral (FUE)
        {28.6265, -17.7556}, // La Palma (SPC)
        {28.0296, -17.2147}, // La Gomera (GMZ)
        {27.8148, -17.8871}, // El Hierro (VDE)
    };
    private static final double AEROPUERTO_RADIO_KM = 1.2;

    private static boolean tocaAeropuertoOPuerto(double lat, double lng) {
        if (tocaMuelle(lat, lng)) return true;
        for (double[] a : AEROPUERTOS) {
            if (GeoUtil.haversineKm(lat, lng, a[0], a[1]) <= AEROPUERTO_RADIO_KM) return true;
        }
        return false;
    }

    /** Tarifa 1 aplica solo si origen Y destino están dentro del mismo casco
     *  urbano; cualquier otro caso (aeropuerto, sur, norte, otra isla) es
     *  Tarifa 3 — no existe una tercera tarifa oficial intermedia. */
    private enum Zona { URBANA, INTERURBANO }

    private static Zona zonaDe(double oLat, double oLng, double dLat, double dLng) {
        if (esUrbano(oLat, oLng) && esUrbano(dLat, dLng)) return Zona.URBANA;
        return Zona.INTERURBANO;
    }

    // ─────────────────────────── TARIFA 1 (urbana) ───────────────────────────

    private record FranjaUrbana(BigDecimal bandera, BigDecimal km, BigDecimal esperaH) {}

    /**
     * Franja urbana según día y hora (horario canario). Tabla oficial BOC
     * núm. 174 (14-ago-2025) — verificada contra el PDF original:
     *
     *   Diurno laborable         → 3,05 / 0,85 km / espera 17 €/h
     *   Diurno sábado            → 3,25 / 0,90 km / espera 18 €/h
     *   Diurno dom/festivo       → 4,00 / 1,00 km / espera 20 €/h  (incluye 25/12, 1/1, 6/1)
     *   Diurno vísperas 24/12,31/12,5/1 → 4,00 / 0,90 km / espera 20 €/h
     *   Nocturno lun-jue ordinario→ 3,80 / 0,90 km / espera 20 €/h
     *   Nocturno vie/sáb/víspera → 4,30 / 1,00 km / espera 20 €/h
     *   Nocturno dom/festivo     → 4,75 / 1,00 km / espera 20 €/h
     *   Nocturno 24/12 y 31/12   → 6,95 / 1,00 km / espera 20 €/h
     */
    private FranjaUrbana franjaUrbana(ZonedDateTime t) {
        int         h        = t.getHour();
        boolean     nocturna = h >= 22 || h < 6;
        DayOfWeek   dow      = t.getDayOfWeek();
        MonthDay    md       = MonthDay.of(t.getMonthValue(), t.getDayOfMonth());

        boolean vispera = md.equals(MonthDay.of(12, 24))
                       || md.equals(MonthDay.of(12, 31))
                       || md.equals(MonthDay.of(1,  5));
        boolean nocheNavidad = nocturna && (md.equals(MonthDay.of(12, 24)) || md.equals(MonthDay.of(12, 31)));

        boolean esSabado     = dow == DayOfWeek.SATURDAY;
        boolean esViernes    = dow == DayOfWeek.FRIDAY;
        boolean esDomingo    = dow == DayOfWeek.SUNDAY;
        boolean esFestivo    = festivos.esFestivo(t.toLocalDate());
        boolean esVispera    = vispera || festivos.esFestivo(t.toLocalDate().plusDays(1));
        boolean esDomFestivo = esDomingo || (esFestivo && !esSabado);

        if (nocturna) {
            if (nocheNavidad)
                return new FranjaUrbana(d("6.95"), d("1.00"), d("20.00"));
            if (esDomFestivo)
                return new FranjaUrbana(d("4.75"), d("1.00"), d("20.00"));
            if (esViernes || esSabado || esVispera)
                return new FranjaUrbana(d("4.30"), d("1.00"), d("20.00"));
            return new FranjaUrbana(d("3.80"), d("0.90"), d("20.00"));
        }

        if (vispera)
            return new FranjaUrbana(d("4.00"), d("0.90"), d("20.00"));
        if (esDomFestivo)
            return new FranjaUrbana(d("4.00"), d("1.00"), d("20.00"));
        if (esSabado)
            return new FranjaUrbana(d("3.25"), d("0.90"), d("18.00"));
        return new FranjaUrbana(d("3.05"), d("0.85"), d("17.00"));
    }

    private static final BigDecimal RADIOTAXI = d("0.60");
    private static final BigDecimal MUELLE    = d("0.70");

    private record Suplemento(BigDecimal total, String detalle) {}

    /** Suplementos de Tarifa 1 (BOC 174/2025, punto 4): solo para carreras
     *  que empiezan Y terminan en zona urbana — el propio BOC lo restringe así. */
    private Suplemento suplementosUrbana(double oLat, double oLng, double dLat, double dLng) {
        BigDecimal total = RADIOTAXI;
        StringBuilder detalle = new StringBuilder("Radiotaxi 0,60€");
        if (tocaMuelle(oLat, oLng) || tocaMuelle(dLat, dLng)) {
            total = total.add(MUELLE);
            detalle.append(" + Muelle 0,70€");
        }
        return new Suplemento(total, detalle.toString());
    }

    private BigDecimal aplicarUrbana(FranjaUrbana f, double km) {
        BigDecimal cobrable = BigDecimal.valueOf(km).subtract(KM_INCLUIDOS_URB).max(BigDecimal.ZERO);
        return f.bandera().add(f.km().multiply(cobrable));
    }

    // ────────────────────────── TARIFA 3 (interurbana) ─────────────────────────

    private record FranjaT3(BigDecimal minimo, BigDecimal km, BigDecimal esperaH) {}

    /**
     * Franja interurbana según BOC núm. 59 (14-mar-2023), Orden que modifica
     * el Decreto 246/2017 — tabla oficial verificada contra el PDF original
     * (ANEXO, https://sede.gobiernodecanarias.org/boc/boc-a-2023-059-868.pdf):
     *
     *   A) Laborable diurno (6-22h)                    → mínimo 3,85 / km 1,35
     *   B) Nocturno (22-6h) + domingo/festivo (0-24h)  → mínimo 4,25 / km 1,55
     *   C) Navideño 24/12, 31/12, 5/1 (22h-24h)        → mínimo 6,54 / km 1,55
     *   Espera: 18,50€/h en todas las franjas.
     *   El "mínimo de percepción" ya incluye los primeros 1.500 m (no hay
     *   "bajada de bandera" separada en esta tarifa).
     */
    private FranjaT3 franjaT3(ZonedDateTime t) {
        int       h        = t.getHour();
        boolean   nocturna = h >= 22 || h < 6;
        MonthDay  md       = MonthDay.of(t.getMonthValue(), t.getDayOfMonth());
        boolean   esNavideno = md.equals(MonthDay.of(12, 24)) || md.equals(MonthDay.of(12, 31)) || md.equals(MonthDay.of(1, 5));
        boolean   esDomFestivo = t.getDayOfWeek() == DayOfWeek.SUNDAY || festivos.esFestivo(t.toLocalDate());

        if (nocturna && esNavideno)
            return new FranjaT3(d("6.54"), d("1.55"), d("18.50"));
        if (nocturna || esDomFestivo)
            return new FranjaT3(d("4.25"), d("1.55"), d("18.50"));
        return new FranjaT3(d("3.85"), d("1.35"), d("18.50"));
    }

    private static final BigDecimal AEROPUERTO_PUERTO_T3 = d("2.10");

    /** Suplementos de Tarifa 3 (BOC 59/2023): radiotaxi siempre (esta app ES
     *  central de radiotaxi), y aeropuerto/puerto si origen o destino caen en
     *  su recinto — mucho mayor que el muelle urbano, y aplica en toda Canarias. */
    private Suplemento suplementosT3(double oLat, double oLng, double dLat, double dLng) {
        BigDecimal total = RADIOTAXI;
        StringBuilder detalle = new StringBuilder("Radiotaxi 0,60€");
        if (tocaAeropuertoOPuerto(oLat, oLng) || tocaAeropuertoOPuerto(dLat, dLng)) {
            total = total.add(AEROPUERTO_PUERTO_T3);
            detalle.append(" + Aeropuerto/Puerto 2,10€");
        }
        return new Suplemento(total, detalle.toString());
    }

    private BigDecimal aplicarT3(FranjaT3 f, double km) {
        BigDecimal cobrable = BigDecimal.valueOf(km).subtract(KM_INCLUIDOS_T3).max(BigDecimal.ZERO);
        return f.minimo().add(f.km().multiply(cobrable));
    }

    private static BigDecimal d(String s) { return new BigDecimal(s); }

    /** Etiqueta legible de la zona tarifaria aplicada al viaje. */
    public String zonaLabel(double oLat, double oLng, double dLat, double dLng) {
        return switch (zonaDe(oLat, oLng, dLat, dLng)) {
            case URBANA      -> "Tarifa 1 · Zona urbana";
            case INTERURBANO -> "Tarifa 3 · Interurbano";
        };
    }

    private Suplemento suplementosDe(Zona zona, double oLat, double oLng, double dLat, double dLng) {
        return zona == Zona.URBANA
            ? suplementosUrbana(oLat, oLng, dLat, dLng)
            : suplementosT3(oLat, oLng, dLat, dLng);
    }

    /**
     * Precio total (taxímetro + suplementos) para una ruta, con la tarifa
     * vigente EN EL MOMENTO DE LA LLAMADA. Única fuente de verdad del precio:
     * la usan por igual estimar(), solicitar() y finalizar(), así el precio
     * que se muestra al pedir y el que se cobra al terminar NUNCA divergen
     * por este motivo (si divergen, es porque cruzó una franja horaria real
     * durante el viaje — ver nota en ViajeService.finalizar).
     */
    public BigDecimal precioPorRuta(double oLat, double oLng, double dLat, double dLng, double km) {
        Zona zona = zonaDe(oLat, oLng, dLat, dLng);
        ZonedDateTime ahora = ZonedDateTime.now(CANARIAS);
        BigDecimal base = zona == Zona.URBANA
            ? aplicarUrbana(franjaUrbana(ahora), km)
            : aplicarT3(franjaT3(ahora), km);
        BigDecimal sup = suplementosDe(zona, oLat, oLng, dLat, dLng).total();
        return base.add(sup).setScale(2, RoundingMode.HALF_UP);
    }

    public EstimacionResponse estimar(double oLat, double oLng, double dLat, double dLng) {
        return estimarVia(oLat, oLng, dLat, dLng, java.util.List.of());
    }

    /** Estimación pasando por paradas intermedias (multiparada). Lista vacía =
     *  ruta directa origen→destino (comportamiento normal). El precio usa la
     *  distancia REAL del recorrido completo; la zona, el tramo origen→destino. */
    public EstimacionResponse estimarVia(double oLat, double oLng, double dLat, double dLng,
                                         java.util.List<double[]> paradas) {
        var puntos = new java.util.ArrayList<double[]>();
        puntos.add(new double[]{oLat, oLng});
        if (paradas != null) puntos.addAll(paradas);
        puntos.add(new double[]{dLat, dLng});
        var ruta = osrm.rutaVia(puntos);
        Zona zona = zonaDe(oLat, oLng, dLat, dLng);
        return new EstimacionResponse(
            BigDecimal.valueOf(ruta.km()),
            BigDecimal.valueOf(Math.ceil(ruta.duracionMin())),
            precioPorRuta(oLat, oLng, dLat, dLng, ruta.km()),
            ruta.puntos(),
            zonaLabel(oLat, oLng, dLat, dLng),
            suplementosDe(zona, oLat, oLng, dLat, dLng).detalle());
    }

    /** Información de la tarifa vigente ahora mismo (para mostrar a usuarios). */
    public java.util.Map<String, Object> infoActual() {
        var t   = ZonedDateTime.now(CANARIAS);
        var fU  = franjaUrbana(t);
        var f3  = franjaT3(t);
        int h   = t.getHour();
        boolean noct = h >= 22 || h < 6;
        boolean fest = t.getDayOfWeek() == DayOfWeek.SUNDAY || festivos.esFestivo(t.toLocalDate());
        boolean sab  = t.getDayOfWeek() == DayOfWeek.SATURDAY;

        String franjaLabel = noct
            ? "Nocturna (22:00–6:00)"
            : fest  ? "Festiva/Domingo"
            : sab   ? "Sábado"
            : "Diurna laborable";

        var m = new java.util.LinkedHashMap<String, Object>();
        m.put("franja",         franjaLabel);
        m.put("esFestivo",      fest);
        // Tarifa 1 · urbana (Las Palmas de Gran Canaria)
        m.put("bajadaBandera",   fU.bandera());
        m.put("metrosIncluidosUrbano", 500);
        m.put("kmUrbano",        fU.km());
        m.put("esperaHoraUrbano", fU.esperaH());
        // Tarifa 3 · interurbana (toda Canarias)
        m.put("minimoPercepcionT3",    f3.minimo());
        m.put("metrosIncluidosT3", 1500);
        m.put("kmT3",             f3.km());
        m.put("esperaHoraT3",     f3.esperaH());
        m.put("suplementoRadiotaxi",         RADIOTAXI);
        m.put("suplementoAeropuertoPuerto",  AEROPUERTO_PUERTO_T3);
        return m;
    }

    public BigDecimal radioBusquedaKm() {
        return repo.findAll().stream().findFirst()
            .map(c -> c.getRadioBusquedaKm()).orElse(new BigDecimal("5"));
    }
}
