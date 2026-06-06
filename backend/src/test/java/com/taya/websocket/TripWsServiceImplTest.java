package com.taya.websocket;
import com.taya.model.Viaje;
import org.junit.jupiter.api.Test;
import org.springframework.web.socket.*;
import static org.mockito.Mockito.*;

class TripWsServiceImplTest {
    @Test void enviarNuevoViaje_escribeMensajeATaxistaConectado() throws Exception {
        WsSessionRegistry reg = new WsSessionRegistry();
        WebSocketSession s = mock(WebSocketSession.class);
        when(s.isOpen()).thenReturn(true);
        reg.register(7L, s);
        TripWsServiceImpl ws = new TripWsServiceImpl(reg);
        Viaje v = new Viaje(); v.setId(1L); v.setOrigenLat(28.1); v.setOrigenLng(-15.4);
        v.setDestinoLat(28.0); v.setDestinoLng(-15.4);

        ws.enviarNuevoViaje(java.util.List.of(7L), v);

        verify(s).sendMessage(any(TextMessage.class));
    }
}
