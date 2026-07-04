package com.taya;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.*;
import org.springframework.web.socket.*;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.testcontainers.containers.*;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import java.net.URI;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class WebSocketIT {
    @Container @ServiceConnection static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16");
    @Container static GenericContainer<?> redis = new GenericContainer<>("redis:7.2-alpine").withExposedPorts(6379);
    @DynamicPropertySource static void props(DynamicPropertyRegistry r) {
        r.add("spring.data.redis.host", redis::getHost);
        r.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
    }
    @LocalServerPort int port;
    @Autowired com.taya.service.AuthService authService;
    @Autowired com.taya.websocket.TripWsService tripWs;
    @Autowired com.taya.repository.UsuarioRepository usuarios;

    @Test void taxistaRecibeTripNew() throws Exception {
        var reg = authService.register(new com.taya.dto.request.RegisterRequest(
            "T","tws@taya.com","secret1", com.taya.model.Rol.TAXISTA, null, null, null, null));
        var token = reg.token();
        var future = new CompletableFuture<String>();
        var client = new StandardWebSocketClient();
        client.execute(new TextWebSocketHandler() {
            @Override protected void handleTextMessage(WebSocketSession s, TextMessage m) { future.complete(m.getPayload()); }
        }, new WebSocketHttpHeaders(), URI.create("ws://localhost:" + port + "/ws?token=" + token)).get(2, TimeUnit.SECONDS);

        Thread.sleep(200); // allow registry to register the session
        var v = new com.taya.model.Viaje(); v.setId(99L); v.setOrigenLat(28.1); v.setOrigenLng(-15.4);
        v.setDestinoLat(28.0); v.setDestinoLng(-15.4);
        tripWs.enviarNuevoViaje(java.util.List.of(reg.id()), v);

        String msg = future.get(2, TimeUnit.SECONDS);
        assertThat(msg).contains("trip:new").contains("\"viajeId\":99");
    }
}
