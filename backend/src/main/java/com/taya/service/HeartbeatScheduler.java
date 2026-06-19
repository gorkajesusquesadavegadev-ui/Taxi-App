package com.taya.service;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.util.Set;

@Component
public class HeartbeatScheduler {
    private final StringRedisTemplate redis;
    private final UbicacionService ubicacion;
    public HeartbeatScheduler(StringRedisTemplate redis, UbicacionService ubicacion) {
        this.redis = redis; this.ubicacion = ubicacion;
    }

    /** Drop taxistas cuyo heartbeat expiró de todos los geo-sets. */
    @Scheduled(fixedRate = 15000)
    public void limpiarDesconectados() {
        Set<String> libres = redis.opsForSet().members("taxis:libres:ids");
        if (libres != null) {
            for (String id : libres) {
                if (!ubicacion.tienePing(Long.valueOf(id)))
                    ubicacion.setDesconectado(Long.valueOf(id));
            }
        }
        Set<String> online = ubicacion.idsOnline();
        if (online != null) {
            for (String id : online) {
                if (!ubicacion.tienePing(Long.valueOf(id)))
                    ubicacion.limpiarOnline(Long.valueOf(id));
            }
        }
    }
}
