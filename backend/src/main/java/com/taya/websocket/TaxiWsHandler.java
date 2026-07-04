package com.taya.websocket;
import com.fasterxml.jackson.databind.*;
import com.taya.security.JwtTokenProvider;
import com.taya.service.UbicacionService;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.net.URI;

@Component
public class TaxiWsHandler extends TextWebSocketHandler {
    private final JwtTokenProvider jwt;
    private final WsSessionRegistry registry;
    private final UbicacionService ubicacion;
    private final com.taya.websocket.TripWsService trips;
    private final com.taya.security.TokenBlacklist blacklist;
    private final ObjectMapper mapper = new ObjectMapper();
    public TaxiWsHandler(JwtTokenProvider jwt, WsSessionRegistry registry, UbicacionService ubicacion,
                         com.taya.websocket.TripWsService trips, com.taya.security.TokenBlacklist blacklist) {
        this.jwt = jwt; this.registry = registry; this.ubicacion = ubicacion; this.trips = trips; this.blacklist = blacklist;
    }

    private Long userIdOf(WebSocketSession s) { return (Long) s.getAttributes().get("userId"); }

    @Override public void afterConnectionEstablished(WebSocketSession session) {
        String token = tokenFromUri(session.getUri());
        if (token == null || !jwt.isValid(token) || blacklist.estaRevocado(jwt.getJti(token))) {
            try { session.close(CloseStatus.POLICY_VIOLATION); } catch (Exception ignored) {} return;
        }
        Long userId = jwt.getUserId(token);
        session.getAttributes().put("userId", userId);
        session.getAttributes().put("rol", jwt.getRol(token));
        registry.register(userId, session);
    }

    @Override protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        Long userId = userIdOf(session);
        JsonNode node = mapper.readTree(message.getPayload());
        String event = node.path("event").asText();
        JsonNode data = node.path("data");
        switch (event) {
            case "location:update" -> {
                double lat = data.get("lat").asDouble(), lng = data.get("lng").asDouble();
                ubicacion.actualizarUbicacion(userId, lat, lng);
                // Reenvía la posición en vivo al cliente del viaje en curso (mapa + ETA).
                Long clienteId = ubicacion.clienteDelViaje(userId);
                if (clienteId != null) trips.enviarUbicacionTaxi(clienteId, lat, lng);
            }
            case "heartbeat" -> ubicacion.heartbeat(userId);
            default -> { /* ignore unknown */ }
        }
    }

    @Override public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Long userId = userIdOf(session);
        if (userId == null) return;
        registry.remove(userId, session);
        // Limpia GEO sets solo si NO hay otra sesión activa (reconexión rápida del mismo usuario)
        WebSocketSession current = registry.get(userId);
        if (current == null || !current.isOpen()) {
            ubicacion.setDesconectado(userId);
        }
    }

    private String tokenFromUri(URI uri) {
        if (uri == null || uri.getQuery() == null) return null;
        for (String kv : uri.getQuery().split("&")) {
            var p = kv.split("=", 2);
            if (p.length == 2 && p[0].equals("token")) return p[1];
        }
        return null;
    }
}
