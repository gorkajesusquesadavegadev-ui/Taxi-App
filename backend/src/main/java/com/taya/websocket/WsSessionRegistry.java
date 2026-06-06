package com.taya.websocket;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WsSessionRegistry {
    private final Map<Long, WebSocketSession> sessions = new ConcurrentHashMap<>();
    public void register(Long userId, WebSocketSession s) { sessions.put(userId, s); }
    public void remove(Long userId) { sessions.remove(userId); }
    public WebSocketSession get(Long userId) { return sessions.get(userId); }
}
