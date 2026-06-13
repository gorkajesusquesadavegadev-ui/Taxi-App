package com.taya.dto.response;
import com.taya.model.MensajeForo;
import java.time.Instant;

public record MensajeForoResponse(Long id, Long autorId, String autorNombre, String texto, Instant creadoEn) {
    public static MensajeForoResponse of(MensajeForo m) {
        return new MensajeForoResponse(m.getId(), m.getAutorId(), m.getAutorNombre(), m.getTexto(), m.getCreadoEn());
    }
}
