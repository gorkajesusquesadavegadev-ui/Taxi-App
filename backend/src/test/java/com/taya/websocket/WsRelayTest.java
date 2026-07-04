package com.taya.websocket;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.connection.DefaultMessage;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import java.util.Map;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class WsRelayTest {

    @Test void toUser_publica_en_el_canal_redis() {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        WsSessionRegistry reg = new WsSessionRegistry();
        WsRelay relay = new WsRelay(redis, reg);

        relay.toUser(7L, "trip:new", Map.of("viajeId", 99));

        verify(redis).convertAndSend(eq(WsRelay.CHANNEL), contains("trip:new"));
    }

    @Test void onMessage_entrega_a_sesion_local_del_usuario() throws Exception {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        WsSessionRegistry reg = new WsSessionRegistry();
        WebSocketSession s = mock(WebSocketSession.class);
        when(s.isOpen()).thenReturn(true);
        reg.register(7L, s);
        WsRelay relay = new WsRelay(redis, reg);

        String envelope = new ObjectMapper().writeValueAsString(Map.of(
            "t", "u", "id", 7, "event", "trip:new", "data", Map.of("viajeId", 99)));
        relay.onMessage(new DefaultMessage("taya:ws".getBytes(), envelope.getBytes()), null);

        verify(s).sendMessage(any(TextMessage.class));
    }

    @Test void onMessage_no_entrega_si_el_usuario_no_esta_en_esta_instancia() throws Exception {
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        WsSessionRegistry reg = new WsSessionRegistry(); // vacío: usuario en otra instancia
        WsRelay relay = new WsRelay(redis, reg);

        String envelope = new ObjectMapper().writeValueAsString(Map.of(
            "t", "u", "id", 7, "event", "trip:new", "data", Map.of("viajeId", 99)));
        // no debe lanzar ni entregar nada (no hay sesión local)
        relay.onMessage(new DefaultMessage("taya:ws".getBytes(), envelope.getBytes()), null);
    }
}
