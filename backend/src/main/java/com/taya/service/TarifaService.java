package com.taya.service;
import com.taya.dto.response.EstimacionResponse;
import com.taya.repository.ConfiguracionTarifaRepository;
import com.taya.util.GeoUtil;
import org.springframework.stereotype.Service;
import java.math.*;
import java.time.*;

/**
 * Tarifas oficiales del taxi urbano de Las Palmas de Gran Canaria según el
 * BOC núm. 174 (3 de septiembre de 2025), Resolución de 14 de agosto de 2025
 * de la Viceconsejería de Industria, Comercio y Consumo — fuente primaria:
 * https://www.gobiernodecanarias.org/boc/2025/174/3151.html
 * La bajada de bandera incluye los primeros 500 m; el taxímetro salta de 5
 * en 5 céntimos. Suplementos (punto 4 de la resolución): bultos 0,35€
 * (>50/60kg, no aplicado — caso raro), radiotaxi 0,60€, entrada/salida de
 * muelle 0,70€. Mínimo de percepción: 0,00€ (no existe tarifa mínima aparte
 * del taxímetro).
 *
 * Tarifa 3 (barrios periféricos del municipio) y Tarifa Interurbano no están
 * publicadas en el mismo BOC; se estiman aplicando los recargos históricos
 * proporcionales sobre la base urbana vigente.
 */
@Service
public class TarifaService {
    private final ConfiguracionTarifaRepository repo;
    private final OsrmClient osrm;
    private final FestivoService festivos;
    public TarifaService(ConfiguracionTarifaRepository repo, OsrmClient osrm, FestivoService festivos) {
        this.repo = repo; this.osrm = osrm; this.festivos = festivos;
    }

    private static final ZoneId     CANARIAS     = ZoneId.of("Atlantic/Canary");
    private static final BigDecimal KM_INCLUIDOS = new BigDecimal("0.500");

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

    // [lat, lng, radioKm] capitales/núcleos urbanos de cada isla
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
    private static final double MUELLE_LAT = 28.1450, MUELLE_LNG = -15.4280;
    private static final double MUELLE_RADIO_KM = 0.4;

    private static boolean tocaMuelle(double lat, double lng) {
        return GeoUtil.haversineKm(lat, lng, MUELLE_LAT, MUELLE_LNG) <= MUELLE_RADIO_KM;
    }

    private enum Zona { URBANA, PERIFERIA, INTERURBANO }

    private static Zona zonaDe(double oLat, double oLng, double dLat, double dLng) {
        Isla oIsla = islaDeL(oLat, oLng), dIsla = islaDeL(dLat, dLng);
        if (oIsla == Isla.UNKNOWN || dIsla == Isla.UNKNOWN || oIsla != dIsla) return Zona.INTERURBANO;
        if (esUrbano(oLat, oLng) && esUrbano(dLat, dLng)) return Zona.URBANA;
        return Zona.PERIFERIA;
    }

    /**
     * Franja tarifaria con precios por zona.
     * kmPer ≈ kmUrb × 1,35 (Tarifa 3, estimado proporcional histórico)
     * kmInter ≈ kmUrb × 1,60 (Interurbano, estimado)
     * esperaH: precio de la hora de espera.
     */
    private record Franja(
        BigDecimal bandera,
        BigDecimal kmUrb,
        BigDecimal kmPer,
        BigDecimal kmInter,
        BigDecimal esperaH
    ) {}

    /**
     * Franja aplicable según día y hora (horario canario). Tabla oficial BOC
     * núm. 174 (14-ago-2025), página "1) Bajada de bandera" / "2) Kilómetro
     * recorrido" — verificada contra el PDF original, no un resumen de prensa:
     *
     *   Diurno laborable         → 3,05 / 0,85 km / espera 17 €/h
     *   Diurno sábado            → 3,25 / 0,90 km / espera 18 €/h
     *   Diurno dom/festivo       → 4,00 / 1,00 km / espera 20 €/h  (incluye 25/12, 1/1, 6/1: son festivos)
     *   Diurno vísperas 24/12,31/12,5/1 → 4,00 / 0,90 km / espera 20 €/h
     *   Nocturno lun-jue ordinario→ 3,80 / 0,90 km / espera 20 €/h
     *   Nocturno vie/sáb/víspera → 4,30 / 1,00 km / espera 20 €/h
     *   Nocturno dom/festivo     → 4,75 / 1,00 km / espera 20 €/h  ★ antes NO existía esta franja:
     *                              toda noche de domingo o festivo se cobraba como lun-jue (3,80),
     *                              cobrando de menos al taxista 0,95€ de bandera + 0,10€/km.
     *   Nocturno 24/12 y 31/12   → 6,95 / 1,00 km / espera 20 €/h
     *
     *   ★ El código anterior tenía además un bug: cobraba 4,75€ como tarifa
     *   DIURNA de 25/12, 1/1 y 6/1 (el BOC solo publica ese 4,75€ para la
     *   franja NOCTURNA de esas fechas). De día, esas fechas son festivos
     *   normales → 4,00€, no 4,75€. Eso era un SOBRECOBRO real al cliente.
     */
    private Franja franja(ZonedDateTime t) {
        int         h        = t.getHour();
        boolean     nocturna = h >= 22 || h < 6;
        DayOfWeek   dow      = t.getDayOfWeek();
        MonthDay    md       = MonthDay.of(t.getMonthValue(), t.getDayOfMonth());

        boolean vispera = md.equals(MonthDay.of(12, 24))
                       || md.equals(MonthDay.of(12, 31))
                       || md.equals(MonthDay.of(1,  5));   // 24/12, 31/12, 5/1
        // Nochebuena y Nochevieja noche (22-6h) → tarifa especial más alta
        boolean nocheNavidad = nocturna && (md.equals(MonthDay.of(12, 24)) || md.equals(MonthDay.of(12, 31)));

        boolean esSabado     = dow == DayOfWeek.SATURDAY;
        boolean esViernes    = dow == DayOfWeek.FRIDAY;
        boolean esDomingo    = dow == DayOfWeek.SUNDAY;
        boolean esFestivo    = festivos.esFestivo(t.toLocalDate());
        // víspera de festivo: el día siguiente es festivo o se cayó en víspera explícita
        boolean esVispera    = vispera || festivos.esFestivo(t.toLocalDate().plusDays(1));
        boolean esDomFestivo = esDomingo || (esFestivo && !esSabado);

        if (nocturna) {
            if (nocheNavidad)
                return new Franja(d("6.95"), d("1.00"), d("1.35"), d("1.60"), d("20.00"));
            if (esDomFestivo) // incluye 25/12, 1/1, 6/1 noche (son festivos)
                return new Franja(d("4.75"), d("1.00"), d("1.35"), d("1.60"), d("20.00"));
            // viernes y sábados noche, y vísperas de festivo
            if (esViernes || esSabado || esVispera)
                return new Franja(d("4.30"), d("1.00"), d("1.35"), d("1.60"), d("20.00"));
            // lunes-jueves noche ordinaria
            return new Franja(d("3.80"), d("0.90"), d("1.22"), d("1.44"), d("20.00"));
        }

        // Diurno (6-22h)
        if (vispera)  // 24/12, 31/12, 5/1 diurno
            return new Franja(d("4.00"), d("0.90"), d("1.22"), d("1.44"), d("20.00"));
        if (esDomFestivo) // incluye 25/12, 1/1, 6/1 día (son festivos, no 4,75 — eso es solo de noche)
            return new Franja(d("4.00"), d("1.00"), d("1.35"), d("1.60"), d("20.00"));
        if (esSabado)
            return new Franja(d("3.25"), d("0.90"), d("1.22"), d("1.44"), d("18.00"));
        // laborable diurno — tarifa base
        return new Franja(d("3.05"), d("0.85"), d("1.15"), d("1.36"), d("17.00"));
    }

    private static BigDecimal d(String s) { return new BigDecimal(s); }

    // Suplementos oficiales (BOC, punto 4). Solo se publican para zona urbana
    // (el propio BOC lo restringe así: "las tarifas, incluidos los
    // suplementos, son de aplicación para... la zona urbana"); Tarifa 3 e
    // Interurbano son estimaciones no oficiales, no se les añaden suplementos
    // que no están publicados para ellas.
    private static final BigDecimal RADIOTAXI = d("0.60");
    private static final BigDecimal MUELLE    = d("0.70");

    private record Suplemento(BigDecimal total, String detalle) {}

    /** Todo pedido por esta app es un servicio de central/radiotaxo (art. 4 BOC):
     *  el cliente no para el taxi en la calle, lo pide por app. Ese 0,60€ es
     *  ingreso real del taxista que antes no se estaba cobrando NUNCA. */
    private Suplemento suplementos(double oLat, double oLng, double dLat, double dLng, Zona zona) {
        if (zona != Zona.URBANA) return new Suplemento(BigDecimal.ZERO, null);
        BigDecimal total = RADIOTAXI;
        StringBuilder detalle = new StringBuilder("Radiotaxi 0,60€");
        if (tocaMuelle(oLat, oLng) || tocaMuelle(dLat, dLng)) {
            total = total.add(MUELLE);
            detalle.append(" + Muelle 0,70€");
        }
        return new Suplemento(total, detalle.toString());
    }

    private BigDecimal aplicar(Franja f, double km, Zona zona) {
        BigDecimal precioKm = switch (zona) {
            case URBANA      -> f.kmUrb();
            case PERIFERIA   -> f.kmPer();
            case INTERURBANO -> f.kmInter();
        };
        BigDecimal cobrable = BigDecimal.valueOf(km).subtract(KM_INCLUIDOS).max(BigDecimal.ZERO);
        return f.bandera().add(precioKm.multiply(cobrable));
    }

    /** Etiqueta legible de la zona tarifaria aplicada al viaje. */
    public String zonaLabel(double oLat, double oLng, double dLat, double dLng) {
        return switch (zonaDe(oLat, oLng, dLat, dLng)) {
            case URBANA      -> "Tarifa 1 · Zona urbana";
            case PERIFERIA   -> "Tarifa 3 · Zona periférica";
            case INTERURBANO -> "Interinsular · Fuera del municipio";
        };
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
        BigDecimal base = aplicar(franja(ZonedDateTime.now(CANARIAS)), km, zona);
        BigDecimal sup = suplementos(oLat, oLng, dLat, dLng, zona).total();
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
            suplementos(oLat, oLng, dLat, dLng, zona).detalle());
    }

    /** Información de la tarifa vigente ahora mismo (para mostrar a usuarios). */
    public java.util.Map<String, Object> infoActual() {
        var t  = ZonedDateTime.now(CANARIAS);
        var f  = franja(t);
        int h  = t.getHour();
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
        m.put("bajadaBandera",  f.bandera());
        m.put("metrosIncluidos", 500);
        m.put("kmUrbano",       f.kmUrb());
        m.put("kmTarifa3",      f.kmPer());
        m.put("kmInterurbano",  f.kmInter());
        m.put("esperaHora",     f.esperaH());
        return m;
    }

    public BigDecimal radioBusquedaKm() {
        return repo.findAll().stream().findFirst()
            .map(c -> c.getRadioBusquedaKm()).orElse(new BigDecimal("5"));
    }
}
