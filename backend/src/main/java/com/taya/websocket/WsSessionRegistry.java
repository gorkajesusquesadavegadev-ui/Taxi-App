package com.taya.websocket;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WsSessionRegistry {
    private final Map<Long, WebSocketSession> sessions = new ConcurrentHashMap<>();
    public void register(Long userId, WebSocketSession s) { sessions.put(userId, s); }
    /**
     * Remove only if {@code s} is still the registered session. A reconnect (or
     * React StrictMode's dev double-connect) opens a new session before the old
     * one's close arrives; a blind remove-by-key would wipe the live session.
     * ConcurrentHashMap.remove(key, value) deletes only on identity match.
     */
    public void remove(Long userId, WebSocketSession s) { sessions.remove(userId, s); }
    public WebSocketSession get(Long userId) { return sessions.get(userId); }
}
