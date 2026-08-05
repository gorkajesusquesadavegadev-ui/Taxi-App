package com.taya.service;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taya.util.GeoUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Rutas por carretera con OSRM: calcula el camino real sobre el callejero, así
 * que la distancia (y por tanto el precio) sigue las calles y no la línea recta.
 *
 * DEPENDENCIA EXTERNA FRÁGIL: router.project-osrm.org es el servidor PÚBLICO DE
 * DEMOSTRACIÓN del proyecto OSRM; su documentación pide expresamente no
 * depender de él en producción (sin SLA, compartido por miles de proyectos).
 * El daño real no era que a veces fallara, sino que al fallar esta clase
 * inventaba una distancia en silencio y se COBRABA sobre ella: la misma ruta
 * salía más barata o más cara según si el servidor respondía a tiempo.
 *
 * Tres defensas, en este orden:
 *   1. CACHÉ EN REDIS. Un servicio de taxi repite rutas constantemente
 *      (aeropuerto→hoteles, mismas paradas). Cachear el resultado por
 *      coordenadas redondeadas hace que la inmensa mayoría de peticiones ni
 *      lleguen a salir a internet, y que una misma ruta dé SIEMPRE los mismos
 *      km — que es justo lo que fallaba. Las carreteras no cambian a diario,
 *      así que el TTL es largo.
 *   2. REINTENTOS con timeout generoso antes de rendirse.
 *   3. FALLBACK EXPLÍCITO Y REGISTRADO. Si aun así no hay ruta, se estima con
 *      la recta corregida, pero: se marca como estimada (Ruta.estimada), se
 *      escribe un WARN con contador acumulado, y NO se cachea — un valor
 *      inventado no puede quedarse congelado horas para todo el mundo.
 *
 * Arreglo definitivo pendiente: autoalojar OSRM (Docker con el extracto de
 * Canarias) o contratar un proveedor con SLA (Mapbox, GraphHopper,
 * OpenRouteService). Mientras tanto, la caché reduce la exposición en un orden
 * de magnitud y el fallback deja de ser invisible.
 */
@Service
public class OsrmClient {
    private static final Logger log = LoggerFactory.getLogger(OsrmClient.class);

    // Servidor de rutas. Por defecto el público de demostración; en producción
    // se apunta con OSRM_URL a la instancia propia (servicio "osrm" de Railway,
    // ver osrm/Dockerfile), que no tiene límites ni depende de terceros.
    private final String base;
    private static final double FACTOR_CORRECCION_RECTA = 1.35; // recta → aprox. carretera real
    private static final int REINTENTOS = 2;
    // Las carreteras no cambian a diario; con 30 días la caché se mantiene
    // caliente para las rutas habituales entre despliegues.
    private static final Duration TTL_CACHE = Duration.ofDays(30);
    // Precisión de la clave de caché: 4 decimales ≈ 11 m. Dos recogidas a menos
    // de 11 m comparten ruta, que a 1,35 €/km son ~1,5 céntimos: irrelevante en
    // dinero y en cambio garantiza que el mismo trayecto valga siempre igual.
    private static final int DECIMALES_CLAVE = 4;
    // Guarda para no meter en Redis polilíneas enormes de rutas muy largas.
    private static final int MAX_BYTES_CACHE = 200_000;

    private final RestClient http;
    private final StringRedisTemplate redis;
    private final ObjectMapper json = new ObjectMapper();
    private final AtomicLong fallbacks = new AtomicLong();

    public OsrmClient(StringRedisTemplate redis,
                      @org.springframework.beans.factory.annotation.Value("${osrm.url:https://router.project-osrm.org}") String osrmUrl) {
        this.redis = redis;
        String raiz = osrmUrl.endsWith("/") ? osrmUrl.substring(0, osrmUrl.length() - 1) : osrmUrl;
        this.base = raiz + "/route/v1/driving/";
        log.info("Router de rutas: {}", raiz);
        // Timeout algo más generoso: el servidor público a veces tarda más de
        // 4 s sin estar caído, y cortar pronto solo dispara los fallbacks.
        var f = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        f.setConnectTimeout(3000);
        f.setReadTimeout(6000);
        this.http = RestClient.builder().requestFactory(f).build();
    }

    /**
     * Ruta por carretera: km, duración en minutos y polilínea [lat,lng].
     * @param estimada true si NO viene del router real, sino de la recta
     *                 corregida porque el servicio no respondió.
     */
    public record Ruta(double km, double duracionMin, List<double[]> puntos, boolean estimada) {
        public Ruta(double km, double duracionMin, List<double[]> puntos) {
            this(km, duracionMin, puntos, false);
        }
    }

    /** Ruta completa entre dos puntos (geometría + distancia + duración). */
    public Ruta rutaEntre(double oLat, double oLng, double dLat, double dLng) {
        return rutaVia(List.of(new double[]{oLat, oLng}, new double[]{dLat, dLng}));
    }

    /** Ruta por carretera pasando por una lista ordenada de puntos [lat,lng]. */
    public Ruta rutaVia(List<double[]> waypoints) {
        double oLat = waypoints.get(0)[0], oLng = waypoints.get(0)[1];
        double dLat = waypoints.get(waypoints.size() - 1)[0], dLng = waypoints.get(waypoints.size() - 1)[1];

        String clave = claveCache(waypoints);
        Ruta cacheada = leerCache(clave);
        if (cacheada != null) return cacheada;

        StringBuilder coords = new StringBuilder();
        for (double[] p : waypoints) {
            if (coords.length() > 0) coords.append(';');
            coords.append(p[1]).append(',').append(p[0]); // OSRM espera lng,lat
        }
        String url = base + coords + "?overview=full&geometries=geojson";

        for (int intento = 0; intento <= REINTENTOS; intento++) {
            try {
                OsrmResponse r = http.get().uri(url).retrieve().body(OsrmResponse.class);
                if (r != null && r.routes() != null && !r.routes().isEmpty()) {
                    Route ro = r.routes().get(0);
                    List<double[]> pts = new ArrayList<>();
                    if (ro.geometry() != null && ro.geometry().coordinates() != null)
                        for (List<Double> c : ro.geometry().coordinates())
                            pts.add(new double[]{c.get(1), c.get(0)}); // geojson [lng,lat] → [lat,lng]
                    if (!pts.isEmpty()) {
                        Ruta ruta = new Ruta(ro.distance() / 1000.0, ro.duration() / 60.0, pts);
                        guardarCache(clave, ruta);
                        return ruta;
                    }
                }
            } catch (Exception e) {
                if (intento == REINTENTOS) log.debug("OSRM falló tras {} intentos: {}", intento + 1, e.toString());
            }
        }

        // Sin ruta real: se estima, pero NO se cachea (un valor inventado no
        // puede congelarse 30 días) y queda registrado para poder detectarlo.
        double km = GeoUtil.haversineKm(oLat, oLng, dLat, dLng) * FACTOR_CORRECCION_RECTA;
        log.warn("OSRM no respondió: distancia ESTIMADA por recta ({} km) para {} puntos. "
                + "Fallbacks acumulados desde el arranque: {}",
            String.format("%.2f", km), waypoints.size(), fallbacks.incrementAndGet());
        return new Ruta(km, km / 28.0 * 60.0,
            List.of(new double[]{oLat, oLng}, new double[]{dLat, dLng}), true);
    }

    /** Nº de veces que se ha estimado por no responder el router (diagnóstico). */
    public long fallbacksAcumulados() { return fallbacks.get(); }

    // ── Caché ───────────────────────────────────────────────────────────────
    private static String claveCache(List<double[]> waypoints) {
        StringBuilder sb = new StringBuilder("ruta:");
        for (double[] p : waypoints) {
            sb.append(String.format(java.util.Locale.ROOT, "%." + DECIMALES_CLAVE + "f,%." + DECIMALES_CLAVE + "f;",
                p[0], p[1]));
        }
        return sb.toString();
    }

    private Ruta leerCache(String clave) {
        try {
            String v = redis.opsForValue().get(clave);
            if (v == null) return null;
            RutaCache rc = json.readValue(v, RutaCache.class);
            if (rc == null || rc.puntos() == null || rc.puntos().isEmpty()) return null;
            return new Ruta(rc.km(), rc.duracionMin(), rc.puntos(), false);
        } catch (Exception e) {
            return null; // Redis caído o dato corrupto: se calcula como siempre
        }
    }

    private void guardarCache(String clave, Ruta ruta) {
        try {
            String v = json.writeValueAsString(new RutaCache(ruta.km(), ruta.duracionMin(), ruta.puntos()));
            if (v.length() > MAX_BYTES_CACHE) return;
            redis.opsForValue().set(clave, v, TTL_CACHE);
        } catch (Exception ignored) {
            /* que falle la caché nunca debe romper el cálculo */
        }
    }

    private record RutaCache(double km, double duracionMin, List<double[]> puntos) {}

    /** Distancia por carretera en km. */
    public double distanciaKm(double oLat, double oLng, double dLat, double dLng) {
        return rutaEntre(oLat, oLng, dLat, dLng).km();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record OsrmResponse(List<Route> routes) {}
    @JsonIgnoreProperties(ignoreUnknown = true)
    record Route(double distance, double duration, Geometry geometry) {}
    @JsonIgnoreProperties(ignoreUnknown = true)
    record Geometry(List<List<Double>> coordinates) {}
}
