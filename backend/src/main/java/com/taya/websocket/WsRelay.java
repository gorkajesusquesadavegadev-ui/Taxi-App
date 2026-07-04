package com.taya.websocket;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import java.util.Map;

/**
 * Entrega de mensajes WebSocket entre instancias mediante Redis pub/sub.
 *
 * El registro de sesiones vive en memoria de cada instancia. Para que un
 * evento generado en la instancia A llegue a un usuario conectado en la
 * instancia B, se publica en un canal Redis; TODAS las instancias están
 * suscritas y solo aquella que tiene la sesión local la entrega. Así no hay
 * duplicados y el sistema escala horizontalmente (varias réplicas).
 */
@Component
public class WsRelay implements MessageListener {
    public static final String CHANNEL = "taya:ws";

    private final StringRedisTemplate redis;
    private final WsSessionRegistry registry;
    private final ObjectMapper mapper = new ObjectMapper();

    public WsRelay(StringRedisTemplate redis, WsSessionRegistry registry) {
        this.redis = redis; this.registry = registry;
    }

    /** Envía {event,data} a un usuario concreto, esté en la instancia que esté. */
    public void toUser(Long userId, String event, Object data) {
        publish(Map.of("t", "u", "id", userId, "event", event, "data", data));
    }

    /** Difunde {event,data} a todas las sesiones de un rol (o a todas si rol=null). */
    public void toRole(String rol, String event, Object data) {
        Map<String, Object> env = new java.util.HashMap<>();
        env.put("t", "r"); env.put("event", event); env.put("data", data);
        if (rol != null) env.put("rol", rol);
        publish(env);
    }

    private void publish(Map<String, Object> envelope) {
        try { redis.convertAndSend(CHANNEL, mapper.writeValueAsString(envelope)); }
        catch (Exception ignored) {}
    }

    // ---- recepción: entrega a las sesiones LOCALES de esta instancia ----
    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            JsonNode env = mapper.readTree(message.getBody());
            String tipo = env.path("t").asText();
            String clientMsg = mapper.writeValueAsString(Map.of(
                "event", env.path("event").asText(),
                "data", env.get("data")));
            if ("u".equals(tipo)) {
                Long userId = env.path("id").asLong();
                enviarLocal(registry.get(userId), clientMsg);
            } else if ("r".equals(tipo)) {
                String rol = env.has("rol") ? env.get("rol").asText() : null;
                for (WebSocketSession s : registry.all()) {
                    if (rol != null && !rol.equals(s.getAttributes().get("rol"))) continue;
                    enviarLocal(s, clientMsg);
                }
            }
        } catch (Exception ignored) {}
    }

    private void enviarLocal(WebSocketSession s, String json) {
        if (s == null || !s.isOpen()) return;
        try { s.sendMessage(new TextMessage(json)); } catch (Exception ignored) {}
    }
}
