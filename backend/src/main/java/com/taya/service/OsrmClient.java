package com.taya.service;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.taya.util.GeoUtil;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.util.ArrayList;
import java.util.List;

/**
 * Road routing via OSRM (router.project-osrm.org). OSRM computes the shortest
 * path on the real street graph with a bidirectional Dijkstra (contraction
 * hierarchies / multi-level Dijkstra), so distance and geometry follow actual
 * roads — not a straight line. Falls back to Haversine if the service is down.
 *
 * AVISO: router.project-osrm.org es el servidor PÚBLICO DE DEMOSTRACIÓN del
 * proyecto OSRM — su propia documentación pide explícitamente no depender de
 * él en producción (sin SLA, sin garantía de disponibilidad, compartido por
 * miles de proyectos). Cuando se satura o tarda, ANTES esta clase caía en
 * silencio a una recta (Haversine) sin avisar a nadie: la MISMA ruta podía
 * salir más barata unas veces que otras según si el servidor público
 * respondía a tiempo o no — la causa más probable de que "a unos les salga
 * un precio y a otros otro" para el mismo trayecto. Mitigado con: 2
 * reintentos antes de rendirse, y un factor de corrección 1.35× sobre la
 * recta (una carretera real casi nunca es una línea recta) para que el
 * fallback, si llega a activarse, se parezca más a la distancia real y la
 * discrepancia sea menor. Arreglo definitivo: autoalojar OSRM (Docker, solo
 * necesita el extracto de Canarias, es barato) o pagar un proveedor con SLA
 * (Mapbox Directions, GraphHopper, OpenRouteService).
 */
@Service
public class OsrmClient {
    private final RestClient http;
    private static final String BASE = "https://router.project-osrm.org/route/v1/driving/";
    private static final double FACTOR_CORRECCION_RECTA = 1.35; // recta → aprox. carretera real
    private static final int REINTENTOS = 2;

    public OsrmClient() {
        // Timeout algo más generoso que antes: el servidor público a veces
        // tarda más de 4s sin estar realmente caído; cortar demasiado pronto
        // solo aumenta cuántas veces cae al fallback (recta) sin necesidad.
        var f = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        f.setConnectTimeout(3000);
        f.setReadTimeout(6000);
        this.http = RestClient.builder().requestFactory(f).build();
    }

    /** A road route: driving distance in km, duration in minutes, polyline as [lat,lng]. */
    public record Ruta(double km, double duracionMin, List<double[]> puntos) {}

    /** Full road route between two points (geometry + distance + duration). */
    public Ruta rutaEntre(double oLat, double oLng, double dLat, double dLng) {
        return rutaVia(List.of(new double[]{oLat, oLng}, new double[]{dLat, dLng}));
    }

    /** Road route through an ordered list of [lat,lng] waypoints (2+ points). */
    public Ruta rutaVia(List<double[]> waypoints) {
        double oLat = waypoints.get(0)[0], oLng = waypoints.get(0)[1];
        double dLat = waypoints.get(waypoints.size() - 1)[0], dLng = waypoints.get(waypoints.size() - 1)[1];

        StringBuilder coords = new StringBuilder();
        for (double[] p : waypoints) {
            if (coords.length() > 0) coords.append(';');
            coords.append(p[1]).append(',').append(p[0]); // OSRM espera lng,lat
        }
        String url = BASE + coords + "?overview=full&geometries=geojson";

        for (int intento = 0; intento <= REINTENTOS; intento++) {
            try {
                OsrmResponse r = http.get().uri(url).retrieve().body(OsrmResponse.class);
                if (r != null && r.routes() != null && !r.routes().isEmpty()) {
                    Route ro = r.routes().get(0);
                    List<double[]> pts = new ArrayList<>();
                    if (ro.geometry() != null && ro.geometry().coordinates() != null)
                        for (List<Double> c : ro.geometry().coordinates())
                            pts.add(new double[]{c.get(1), c.get(0)}); // geojson is [lng,lat] -> [lat,lng]
                    if (!pts.isEmpty()) return new Ruta(ro.distance() / 1000.0, ro.duration() / 60.0, pts);
                }
            } catch (Exception ignored) { /* reintenta o cae al fallback */ }
        }
        // Fallback (servidor de demo caído/saturado tras reintentar): recta
        // corregida con un factor típico calle-vs-línea-recta, no la recta
        // desnuda — reduce cuánto se aleja del precio real cuando esto salta.
        double km = GeoUtil.haversineKm(oLat, oLng, dLat, dLng) * FACTOR_CORRECCION_RECTA;
        return new Ruta(km, km / 28.0 * 60.0,
            List.of(new double[]{oLat, oLng}, new double[]{dLat, dLng}));
    }

    /** Driving distance in km; falls back to Haversine on any error. */
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
