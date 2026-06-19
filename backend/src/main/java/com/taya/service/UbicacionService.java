package com.taya.service;
import org.springframework.data.geo.*;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class UbicacionService {
    private final StringRedisTemplate redis;
    public UbicacionService(StringRedisTemplate redis) { this.redis = redis; }

    private static final String GEO_LIBRES  = "taxis:libres";
    private static final String IDS_LIBRES  = "taxis:libres:ids";
    private static final String GEO_ONLINE  = "taxis:online";
    private static final String IDS_ONLINE  = "taxis:online:ids";

    public void actualizarUbicacion(Long taxistaId, double lat, double lng) {
        redis.opsForValue().set("taxi:" + taxistaId + ":ubicacion", lat + "," + lng, Duration.ofSeconds(10));
        String estado = redis.opsForValue().get("taxi:" + taxistaId + ":estado");
        if ("LIBRE".equals(estado)) {
            redis.opsForGeo().add(GEO_LIBRES, new Point(lng, lat), String.valueOf(taxistaId));
            redis.opsForSet().add(IDS_LIBRES, String.valueOf(taxistaId));
        }
        if ("LIBRE".equals(estado) || "OCUPADO".equals(estado)) {
            redis.opsForGeo().add(GEO_ONLINE, new Point(lng, lat), String.valueOf(taxistaId));
            redis.opsForSet().add(IDS_ONLINE, String.valueOf(taxistaId));
        }
        heartbeat(taxistaId);
    }

    public void heartbeat(Long taxistaId) {
        redis.opsForValue().set("taxi:" + taxistaId + ":last_ping", Instant.now().toString(), Duration.ofSeconds(30));
    }

    public void setLibre(Long taxistaId, double lat, double lng) {
        redis.opsForValue().set("taxi:" + taxistaId + ":estado", "LIBRE");
        redis.opsForGeo().add(GEO_LIBRES, new Point(lng, lat), String.valueOf(taxistaId));
        redis.opsForSet().add(IDS_LIBRES, String.valueOf(taxistaId));
        redis.opsForGeo().add(GEO_ONLINE, new Point(lng, lat), String.valueOf(taxistaId));
        redis.opsForSet().add(IDS_ONLINE, String.valueOf(taxistaId));
        heartbeat(taxistaId);
    }

    public void setOcupado(Long taxistaId) {
        redis.opsForValue().set("taxi:" + taxistaId + ":estado", "OCUPADO");
        redis.opsForGeo().remove(GEO_LIBRES, String.valueOf(taxistaId));
        redis.opsForSet().remove(IDS_LIBRES, String.valueOf(taxistaId));
        // mantener en GEO_ONLINE: sigue visible como taxi en viaje
    }

    public void setDesconectado(Long taxistaId) {
        redis.opsForValue().set("taxi:" + taxistaId + ":estado", "DESCONECTADO");
        redis.opsForGeo().remove(GEO_LIBRES, String.valueOf(taxistaId));
        redis.opsForSet().remove(IDS_LIBRES, String.valueOf(taxistaId));
        redis.opsForGeo().remove(GEO_ONLINE, String.valueOf(taxistaId));
        redis.opsForSet().remove(IDS_ONLINE, String.valueOf(taxistaId));
    }

    public boolean tienePing(Long taxistaId) {
        return Boolean.TRUE.equals(redis.hasKey("taxi:" + taxistaId + ":last_ping"));
    }

    public String ubicacion(Long taxistaId) {
        return redis.opsForValue().get("taxi:" + taxistaId + ":ubicacion");
    }

    /** Free taxistas within radiusKm of (lat,lng). */
    public List<TaxiCercano> libresEnRadio(double lat, double lng, double radiusKm) {
        var circle = new Circle(new Point(lng, lat), new Distance(radiusKm, Metrics.KILOMETERS));
        var args = RedisGeoCommands.GeoRadiusCommandArgs.newGeoRadiusArgs()
            .includeCoordinates().sortAscending();
        var res = redis.opsForGeo().radius(GEO_LIBRES, circle, args);
        List<TaxiCercano> out = new ArrayList<>();
        if (res != null) {
            for (var loc : res.getContent()) {
                Long id = Long.valueOf(loc.getContent().getName());
                Point p = loc.getContent().getPoint();
                out.add(new TaxiCercano(id, p.getY(), p.getX())); // y=lat, x=lng
            }
        }
        return out;
    }

    /** Todos los taxistas online (libres + ocupados) en el radio dado. */
    public List<TaxiOnline> todosOnline(double lat, double lng, double radiusKm) {
        var circle = new Circle(new Point(lng, lat), new Distance(radiusKm, Metrics.KILOMETERS));
        var args = RedisGeoCommands.GeoRadiusCommandArgs.newGeoRadiusArgs()
            .includeCoordinates().sortAscending();
        var res = redis.opsForGeo().radius(GEO_ONLINE, circle, args);
        List<TaxiOnline> out = new ArrayList<>();
        if (res != null) {
            for (var loc : res.getContent()) {
                Long id = Long.valueOf(loc.getContent().getName());
                Point p = loc.getContent().getPoint();
                boolean enViaje = "OCUPADO".equals(redis.opsForValue().get("taxi:" + id + ":estado"));
                out.add(new TaxiOnline(id, p.getY(), p.getX(), enViaje));
            }
        }
        return out;
    }

    public void limpiarOnline(Long taxistaId) {
        redis.opsForGeo().remove(GEO_ONLINE, String.valueOf(taxistaId));
        redis.opsForSet().remove(IDS_ONLINE, String.valueOf(taxistaId));
    }

    public Set<String> idsOnline() {
        return redis.opsForSet().members(IDS_ONLINE);
    }

    public record TaxiCercano(Long taxistaId, double lat, double lng) {}
    public record TaxiOnline(Long taxistaId, double lat, double lng, boolean enViaje) {}
}
