package com.taya.config;
import com.taya.websocket.TaxiWsHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.*;

@Configuration @EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    private final TaxiWsHandler handler;
    public WebSocketConfig(TaxiWsHandler handler) { this.handler = handler; }
    @Override public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(handler, "/ws").setAllowedOrigins("*");
    }
}
