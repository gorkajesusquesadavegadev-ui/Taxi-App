package com.taya.service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taya.dto.response.MensajeForoResponse;
import com.taya.model.MensajeForo;
import com.taya.repository.MensajeForoRepository;
import com.taya.repository.UsuarioRepository;
import com.taya.websocket.WsRelay;
import org.springframework.stereotype.Service;
import java.util.Collections;
import java.util.List;

/**
 * Foro público de taxistas (chat de grupo). Persiste cada mensaje y lo difunde
 * en tiempo real por WebSocket a todas las sesiones de rol TAXISTA conectadas.
 */
@Service
public class ForoService {
    private final MensajeForoRepository repo;
    private final UsuarioRepository usuarios;
    private final WsRelay relay;

    public ForoService(MensajeForoRepository repo, UsuarioRepository usuarios, WsRelay relay) {
        this.repo = repo; this.usuarios = usuarios; this.relay = relay;
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
        // Difusión cross-instancia a todos los taxistas conectados.
        relay.toRole("TAXISTA", "forum:message", dto);
    }
}
