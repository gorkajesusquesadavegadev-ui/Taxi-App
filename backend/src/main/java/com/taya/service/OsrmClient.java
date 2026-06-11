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
 */
@Service
public class OsrmClient {
    private final RestClient http = RestClient.create();
    private static final String BASE = "https://router.project-osrm.org/route/v1/driving/";

    /** A road route: driving distance in km, duration in minutes, polyline as [lat,lng]. */
    public record Ruta(double km, double duracionMin, List<double[]> puntos) {}

    /** Full road route between two points (geometry + distance + duration). */
    public Ruta rutaEntre(double oLat, double oLng, double dLat, double dLng) {
        try {
            String url = BASE + oLng + "," + oLat + ";" + dLng + "," + dLat
                + "?overview=full&geometries=geojson";
            OsrmResponse r = http.get().uri(url).retrieve().body(OsrmResponse.class);
            if (r != null && r.routes() != null && !r.routes().isEmpty()) {
                Route ro = r.routes().get(0);
                List<double[]> pts = new ArrayList<>();
                if (ro.geometry() != null && ro.geometry().coordinates() != null)
                    for (List<Double> c : ro.geometry().coordinates())
                        pts.add(new double[]{c.get(1), c.get(0)}); // geojson is [lng,lat] -> [lat,lng]
                if (!pts.isEmpty()) return new Ruta(ro.distance() / 1000.0, ro.duration() / 60.0, pts);
            }
        } catch (Exception ignored) { }
        // Fallback: straight segment + Haversine distance at ~28 km/h urban speed.
        double km = GeoUtil.haversineKm(oLat, oLng, dLat, dLng);
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
