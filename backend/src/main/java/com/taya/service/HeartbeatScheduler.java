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

    /** Drop free taxistas whose heartbeat expired (no last_ping key). */
    @Scheduled(fixedRate = 15000)
    public void limpiarDesconectados() {
        Set<String> ids = redis.opsForSet().members("taxis:libres:ids");
        if (ids == null) return;
        for (String id : ids) {
            if (!ubicacion.tienePing(Long.valueOf(id))) {
                ubicacion.setDesconectado(Long.valueOf(id)); // also removes from taxis:libres:ids
            }
        }
    }
}
