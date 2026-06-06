package com.taya.websocket;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taya.model.Viaje;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class TripWsServiceImpl implements TripWsService {
    private final WsSessionRegistry registry;
    private final ObjectMapper mapper = new ObjectMapper();
    public TripWsServiceImpl(WsSessionRegistry registry) { this.registry = registry; }

    private void send(Long userId, String event, Object data) {
        WebSocketSession s = registry.get(userId);
        if (s == null || !s.isOpen()) return;
        try { s.sendMessage(new TextMessage(mapper.writeValueAsString(Map.of("event", event, "data", data)))); }
        catch (Exception ignored) {}
    }

    @Override public void enviarNuevoViaje(List<Long> taxistaIds, Viaje v) {
        // HashMap tolerates a null precioEstimado (Map.of would throw).
        Map<String, Object> payload = new HashMap<>();
        payload.put("viajeId", v.getId());
        payload.put("origenLat", v.getOrigenLat());
        payload.put("origenLng", v.getOrigenLng());
        payload.put("destinoLat", v.getDestinoLat());
        payload.put("destinoLng", v.getDestinoLng());
        payload.put("precioEstimado", v.getPrecioEstimado());
        taxistaIds.forEach(id -> send(id, "trip:new", payload));
    }
    @Override public void enviarAceptado(Long clienteId, Viaje v) {
        send(clienteId, "trip:accepted", Map.of("viajeId", v.getId(), "taxistaId", v.getTaxistaId()));
    }
    @Override public void enviarTomado(List<Long> taxistaIds, Long viajeId) {
        taxistaIds.forEach(id -> send(id, "trip:taken", Map.of("viajeId", viajeId)));
    }
    @Override public void enviarUbicacionTaxi(Long clienteId, double lat, double lng) {
        send(clienteId, "trip:location", Map.of("lat", lat, "lng", lng));
    }
    @Override public void enviarLlegada(Long clienteId, Long viajeId) {
        send(clienteId, "trip:arrived", Map.of("viajeId", viajeId));
    }
    @Override public void enviarEstado(Long clienteId, String status) {
        send(clienteId, "trip:status", Map.of("status", status));
    }
    @Override public void enviarCancelado(Long clienteId, Long taxistaId, Long viajeId) {
        if (clienteId != null) send(clienteId, "trip:cancelled", Map.of("viajeId", viajeId));
        if (taxistaId != null) send(taxistaId, "trip:cancelled", Map.of("viajeId", viajeId));
    }
}
