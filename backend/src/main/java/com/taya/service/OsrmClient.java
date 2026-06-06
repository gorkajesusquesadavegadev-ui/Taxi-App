package com.taya.service;
import com.taya.util.GeoUtil;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class OsrmClient {
    private final RestClient http = RestClient.create();
    private static final String BASE = "https://router.project-osrm.org/route/v1/driving/";

    /** Driving distance in km; falls back to Haversine on any error. */
    public double distanciaKm(double oLat, double oLng, double dLat, double dLng) {
        try {
            String url = BASE + oLng + "," + oLat + ";" + dLng + "," + dLat + "?overview=false";
            OsrmResponse r = http.get().uri(url).retrieve().body(OsrmResponse.class);
            if (r != null && r.routes() != null && !r.routes().isEmpty())
                return r.routes().get(0).distance() / 1000.0;
        } catch (Exception ignored) { }
        return GeoUtil.haversineKm(oLat, oLng, dLat, dLng);
    }

    record OsrmResponse(java.util.List<Route> routes) {}
    record Route(double distance) {}
}
