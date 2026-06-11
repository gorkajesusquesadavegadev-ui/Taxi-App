package com.taya.service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.util.Optional;

/**
 * Reverse geocoding en servidor: convierte coordenadas en "Calle X, Barrio".
 * Photon primero y Nominatim de respaldo. Los nombres se persisten en el
 * viaje, así el historial y las estadísticas no dependen de servicios
 * externos al consultarse.
 */
@Service
public class GeocodingService {
    // timeouts cortos: un geocoder caído no puede congelar la petición
    private final RestClient http;
    private final ObjectMapper json = new ObjectMapper();

    public GeocodingService() {
        var f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(2000);
        f.setReadTimeout(2500);
        this.http = RestClient.builder().requestFactory(f).build();
    }

    public Optional<String> nombreDe(double lat, double lng) {
        Optional<String> r = photon(lat, lng);
        if (r.isPresent()) return r;
        return nominatim(lat, lng);
    }

    private Optional<String> photon(double lat, double lng) {
        try {
            String body = http.get()
                .uri("https://photon.komoot.io/reverse?lat=" + lat + "&lon=" + lng)
                .retrieve().body(String.class);
            JsonNode p = json.readTree(body).path("features").path(0).path("properties");
            String calle = p.path("name").asText("");
            if (calle.isBlank()) {
                calle = (p.path("street").asText("") + " " + p.path("housenumber").asText("")).trim();
            }
            String zona = first(p, "district", "city", "county");
            return etiqueta(calle, zona);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private Optional<String> nominatim(double lat, double lng) {
        try {
            String body = http.get()
                .uri("https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" + lat
                    + "&lon=" + lng + "&accept-language=es&zoom=17")
                .header("User-Agent", "TAYA-taxi-app/0.1 (demo)")
                .retrieve().body(String.class);
            JsonNode d = json.readTree(body);
            JsonNode a = d.path("address");
            String calle = (first(a, "road", "pedestrian", "square") + " "
                + a.path("house_number").asText("")).trim();
            if (calle.isBlank()) calle = d.path("name").asText("");
            String zona = first(a, "suburb", "neighbourhood", "city", "town", "village");
            return etiqueta(calle, zona);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private static String first(JsonNode n, String... keys) {
        for (String k : keys) {
            String v = n.path(k).asText("");
            if (!v.isBlank()) return v;
        }
        return "";
    }

    private static Optional<String> etiqueta(String calle, String zona) {
        String s = calle.isBlank() ? zona
            : (zona.isBlank() || zona.equals(calle)) ? calle : calle + ", " + zona;
        return s.isBlank() ? Optional.empty() : Optional.of(s);
    }
}
