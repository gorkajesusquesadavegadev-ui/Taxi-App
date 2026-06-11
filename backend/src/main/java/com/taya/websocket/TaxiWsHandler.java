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
    private final ObjectMapper mapper = new ObjectMapper();
    public TaxiWsHandler(JwtTokenProvider jwt, WsSessionRegistry registry, UbicacionService ubicacion) {
        this.jwt = jwt; this.registry = registry; this.ubicacion = ubicacion;
    }

    private Long userIdOf(WebSocketSession s) { return (Long) s.getAttributes().get("userId"); }

    @Override public void afterConnectionEstablished(WebSocketSession session) {
        String token = tokenFromUri(session.getUri());
        if (token == null || !jwt.isValid(token)) {
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
            case "location:update" -> ubicacion.actualizarUbicacion(userId, data.get("lat").asDouble(), data.get("lng").asDouble());
            case "heartbeat" -> ubicacion.heartbeat(userId);
            default -> { /* ignore unknown */ }
        }
    }

    @Override public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Long userId = userIdOf(session);
        if (userId != null) registry.remove(userId, session);
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
