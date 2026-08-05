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
 * Antes las rutas se pedían a router.project-osrm.org, el servidor PÚBLICO DE
 * DEMOSTRACIÓN de OSRM (su documentación pide no depender de él en
 * producción). El daño real no era que fallara de vez en cuando, sino que al
 * fallar esta clase inventaba una distancia en silencio y se COBRABA sobre
 * ella: la misma ruta salía a distinto precio según si respondía a tiempo.
 *
 * Cuatro defensas, en este orden:
 *   1. CACHÉ EN REDIS. Un taxi repite rutas constantemente (aeropuerto→hoteles,
 *      mismas paradas): la mayoría de peticiones no salen a la red, y una misma
 *      ruta da SIEMPRE los mismos km — que es justo lo que fallaba.
 *   2. ROUTER PROPIO (OSRM_URL → servicio "osrm" de Railway, ver
 *      osrm/Dockerfile): el callejero de Canarias en nuestra red privada, sin
 *      límites de uso ni terceros de por medio.
 *   3. ROUTER DE RESPALDO: si el propio no contesta (reinicio, despliegue), se
 *      intenta el público antes de rendirse. Sin esta cadena, cualquier
 *      reinicio del contenedor propio mandaba directo a estimar por recta.
 *   4. ESTIMACIÓN EXPLÍCITA, solo si fallan los dos: recta corregida, marcada
 *      en Ruta.estimada, con WARN y contador, y SIN cachear — un valor
 *      inventado no puede congelarse 30 días para todo el mundo.
 */
@Service
public class OsrmClient {
    private static final Logger log = LoggerFactory.getLogger(OsrmClient.class);

    // Routers en orden de preferencia. El primero es el propio (OSRM_URL →
    // servicio "osrm" de Railway, ver osrm/Dockerfile): sin límites, por red
    // privada. El segundo es el público de demostración, que se usa SOLO si el
    // propio no contesta — sin esta cadena, un reinicio del contenedor propio
    // mandaba directo a estimar por línea recta, que es justo lo que se quería
    // evitar. Solo cuando fallan los dos se estima.
    private final List<String> routers;
    private static final String PUBLICO = "https://router.project-osrm.org";

    private static String normalizar(String u) {
        return u.endsWith("/") ? u.substring(0, u.length() - 1) : u;
    }

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
        String propio = normalizar(osrmUrl);
        var lista = new ArrayList<String>();
        lista.add(propio);
        if (!propio.equals(PUBLICO)) lista.add(PUBLICO); // respaldo si el propio cae
        this.routers = List.copyOf(lista);
        log.info("Routers de rutas, por orden: {}", routers);
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
        String sufijo = coords + "?overview=full&geometries=geojson";

        for (String router : routers) {
            for (int intento = 0; intento <= REINTENTOS; intento++) {
                try {
                    OsrmResponse r = http.get().uri(router + "/route/v1/driving/" + sufijo)
                        .retrieve().body(OsrmResponse.class);
                    if (r != null && r.routes() != null && !r.routes().isEmpty()) {
                        Route ro = r.routes().get(0);
                        List<double[]> pts = new ArrayList<>();
                        if (ro.geometry() != null && ro.geometry().coordinates() != null)
                            for (List<Double> c : ro.geometry().coordinates())
                                pts.add(new double[]{c.get(1), c.get(0)}); // geojson [lng,lat] → [lat,lng]
                        if (!pts.isEmpty()) {
                            if (!router.equals(routers.get(0)))
                                log.warn("El router propio no respondió; ruta resuelta con el de respaldo ({})", router);
                            Ruta ruta = new Ruta(ro.distance() / 1000.0, ro.duration() / 60.0, pts);
                            guardarCache(clave, ruta);
                            return ruta;
                        }
                    }
                } catch (Exception e) {
                    if (intento == REINTENTOS)
                        log.debug("Router {} falló tras {} intentos: {}", router, intento + 1, e.toString());
                }
            }
        }

        // Sin ruta real: se estima, pero NO se cachea (un valor inventado no
        // puede congelarse 30 días) y queda registrado para poder detectarlo.
        double km = GeoUtil.haversineKm(oLat, oLng, dLat, dLng) * FACTOR_CORRECCION_RECTA;
        log.warn("NINGÚN router respondió: distancia ESTIMADA por recta ({} km) para {} puntos. "
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
