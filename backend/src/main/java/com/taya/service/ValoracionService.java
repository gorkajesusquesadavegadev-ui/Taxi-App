package com.taya.service;
import com.taya.model.EstadoViaje;
import com.taya.model.Valoracion;
import com.taya.model.Viaje;
import com.taya.repository.UsuarioRepository;
import com.taya.repository.ValoracionRepository;
import com.taya.repository.ViajeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ValoracionService {
    private final ValoracionRepository valoraciones;
    private final ViajeRepository viajes;
    private final UsuarioRepository usuarios;

    public ValoracionService(ValoracionRepository valoraciones, ViajeRepository viajes, UsuarioRepository usuarios) {
        this.valoraciones = valoraciones; this.viajes = viajes; this.usuarios = usuarios;
    }

    @Transactional
    public void valorar(Long viajeId, Long autorId, int estrellas, String comentario) {
        if (estrellas < 1 || estrellas > 5)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "estrellas 1-5");
        Viaje v = viajes.findById(viajeId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "viaje no existe"));
        if (v.getEstado() != EstadoViaje.COMPLETADO)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "solo se valoran viajes completados");
        boolean esCliente = autorId.equals(v.getClienteId());
        boolean esTaxista = autorId.equals(v.getTaxistaId());
        if (!esCliente && !esTaxista)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "no participaste en el viaje");
        if (valoraciones.existsByViajeIdAndAutorId(viajeId, autorId))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "ya valoraste este viaje");
        Long destinatarioId = esCliente ? v.getTaxistaId() : v.getClienteId();
        if (destinatarioId == null)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "el viaje no tiene contraparte");

        Valoracion val = new Valoracion();
        val.setViajeId(viajeId);
        val.setAutorId(autorId);
        val.setDestinatarioId(destinatarioId);
        val.setEstrellas(estrellas);
        val.setComentario(comentario != null && !comentario.isBlank() ? comentario.trim() : null);
        valoraciones.save(val);

        // Recalcula el agregado denormalizado del destinatario.
        double media = valoraciones.mediaDe(destinatarioId);
        long count = valoraciones.countDe(destinatarioId);
        usuarios.findById(destinatarioId).ifPresent(u -> {
            u.setRatingMedia(Math.round(media * 100.0) / 100.0);
            u.setRatingCount((int) count);
            usuarios.save(u);
        });
    }

    /** ¿Puede este usuario valorar este viaje todavía? (completado + no valorado). */
    public boolean pendienteDeValorar(Long viajeId, Long autorId) {
        Viaje v = viajes.findById(viajeId).orElse(null);
        if (v == null || v.getEstado() != EstadoViaje.COMPLETADO) return false;
        boolean participa = autorId.equals(v.getClienteId()) || autorId.equals(v.getTaxistaId());
        return participa && !valoraciones.existsByViajeIdAndAutorId(viajeId, autorId);
    }
}
