package com.taya.service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taya.dto.response.MensajeForoResponse;
import com.taya.model.MensajeForo;
import com.taya.repository.MensajeForoRepository;
import com.taya.repository.UsuarioRepository;
import com.taya.websocket.WsSessionRegistry;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Foro público de taxistas (chat de grupo). Persiste cada mensaje y lo difunde
 * en tiempo real por WebSocket a todas las sesiones de rol TAXISTA conectadas.
 */
@Service
public class ForoService {
    private final MensajeForoRepository repo;
    private final UsuarioRepository usuarios;
    private final WsSessionRegistry registry;
    private final ObjectMapper mapper = new ObjectMapper();

    public ForoService(MensajeForoRepository repo, UsuarioRepository usuarios, WsSessionRegistry registry) {
        this.repo = repo; this.usuarios = usuarios; this.registry = registry;
    }

    /** Historial (orden cronológico ascendente para pintar de arriba a abajo). */
    public List<MensajeForoResponse> historial() {
        var lista = repo.findTop100ByOrderByCreadoEnDesc();
        Collections.reverse(lista);
        return lista.stream().map(MensajeForoResponse::of).toList();
    }

    /** Guarda y difunde. Solo taxistas pueden publicar. */
    public MensajeForoResponse publicar(Long autorId, String texto) {
        if (texto == null || texto.isBlank()) return null;
        var u = usuarios.findById(autorId).orElseThrow();
        var m = new MensajeForo();
        m.setAutorId(autorId);
        m.setAutorNombre(u.getNombre());
        m.setTexto(texto.strip().substring(0, Math.min(texto.strip().length(), 1000)));
        m = repo.save(m);
        var dto = MensajeForoResponse.of(m);
        difundir(dto);
        return dto;
    }

    private void difundir(MensajeForoResponse dto) {
        String json;
        try {
            json = mapper.writeValueAsString(Map.of("event", "forum:message", "data", dto));
        } catch (Exception e) { return; }
        for (WebSocketSession s : registry.all()) {
            if (!"TAXISTA".equals(s.getAttributes().get("rol")) || !s.isOpen()) continue;
            try { s.sendMessage(new TextMessage(json)); } catch (Exception ignored) {}
        }
    }
}
