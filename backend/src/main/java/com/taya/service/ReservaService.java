package com.taya.service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taya.dto.request.CrearReservaRequest;
import com.taya.dto.response.ReservaResponse;
import com.taya.model.*;
import com.taya.repository.ReservaRepository;
import com.taya.repository.UsuarioRepository;
import com.taya.websocket.WsSessionRegistry;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Reservas programadas. El cliente crea una reserva PENDIENTE; se difunde a los
 * taxistas conectados; un taxista la acepta y queda ACEPTADA con su nombre y
 * teléfono visibles para que el cliente lo contacte por WhatsApp (y viceversa).
 */
@Service
public class ReservaService {
    private final ReservaRepository reservas;
    private final UsuarioRepository usuarios;
    private final CatalogoService catalogo;
    private final OsrmClient osrm;
    private final TarifaService tarifa;
    private final WsSessionRegistry registry;
    private final ObjectMapper mapper = new ObjectMapper();

    public ReservaService(ReservaRepository r, UsuarioRepository u, CatalogoService c,
                          OsrmClient o, TarifaService t, WsSessionRegistry reg) {
        this.reservas = r; this.usuarios = u; this.catalogo = c; this.osrm = o; this.tarifa = t; this.registry = reg;
    }

    @Transactional
    public ReservaResponse crear(Long clienteId, CrearReservaRequest req) {
        if (req.programadaPara().isBefore(Instant.now()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La fecha debe ser futura");
        TipoViaje tipo;
        try { tipo = TipoViaje.valueOf(req.tipo()); }
        catch (Exception e) { throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "tipo inválido"); }

        Reserva v = new Reserva();
        v.setClienteId(clienteId);
        v.setTipo(tipo);
        v.setProgramadaPara(req.programadaPara());
        v.setNotas(req.notas());

        if (tipo == TipoViaje.NORMAL) {
            if (req.origenLat() == null || req.destinoLat() == null)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "faltan origen o destino");
            v.setOrigenLat(req.origenLat()); v.setOrigenLng(req.origenLng());
            v.setDestinoLat(req.destinoLat()); v.setDestinoLng(req.destinoLng());
            v.setOrigenTexto(req.origenTexto()); v.setDestinoTexto(req.destinoTexto());
            var est = tarifa.estimar(req.origenLat(), req.origenLng(), req.destinoLat(), req.destinoLng());
            v.setDistanciaKm(est.distanciaKm());
            v.setPrecioEstimado(est.precioEstimado());
        } else {
            var of = catalogo.porId(req.ofertaId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "oferta no existe"));
            double oLat = req.origenLat() != null ? req.origenLat() : of.origenLat();
            double oLng = req.origenLng() != null ? req.origenLng() : of.origenLng();
            var pts = new java.util.ArrayList<double[]>();
            pts.add(new double[]{oLat, oLng});
            pts.addAll(of.paradas());
            pts.add(new double[]{of.destinoLat(), of.destinoLng()});
            var ruta = osrm.rutaVia(pts);
            v.setOrigenLat(oLat); v.setOrigenLng(oLng);
            v.setDestinoLat(of.destinoLat()); v.setDestinoLng(of.destinoLng());
            v.setOrigenTexto(req.origenTexto());
            v.setDestinoTexto(of.nombre());
            v.setOfertaId(of.id());
            v.setDetalle(of.nombre());
            v.setDistanciaKm(BigDecimal.valueOf(ruta.km()));
            v.setPrecioEstimado(of.precio());
        }
        v = reservas.save(v);
        var dto = aResponse(v);
        difundir("reserva:new", dto, null); // a todos los taxistas conectados
        return dto;
    }

    public List<ReservaResponse> misCliente(Long clienteId) {
        return reservas.findByClienteIdOrderByProgramadaParaDesc(clienteId).stream().map(this::aResponse).toList();
    }

    public List<ReservaResponse> disponibles() {
        return reservas.findByEstadoAndProgramadaParaAfterOrderByProgramadaParaAsc(
            EstadoReserva.PENDIENTE, Instant.now()).stream().map(this::aResponse).toList();
    }

    public List<ReservaResponse> misTaxista(Long taxistaId) {
        return reservas.findByTaxistaIdOrderByProgramadaParaAsc(taxistaId).stream().map(this::aResponse).toList();
    }

    @Transactional
    public ReservaResponse aceptar(Long reservaId, Long taxistaId) {
        Reserva v = reservas.findById(reservaId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "reserva no existe"));
        if (v.getEstado() != EstadoReserva.PENDIENTE)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "la reserva ya no está disponible");
        v.setTaxistaId(taxistaId);
        v.setEstado(EstadoReserva.ACEPTADA);
        v = reservas.save(v);
        var dto = aResponse(v);
        difundir("reserva:accepted", dto, v.getClienteId()); // avisa al cliente
        difundir("reserva:taken", dto, null);                // a los taxistas: ya no disponible
        return dto;
    }

    /** Marca como CADUCADA una reserva pendiente cuya hora ya pasó y avisa a los
     *  taxistas para que su aviso de la campana refleje "ha caducado". */
    @org.springframework.transaction.annotation.Transactional
    public void caducar(Reserva v) {
        v.setEstado(EstadoReserva.CADUCADA);
        reservas.save(v);
        difundir("reserva:expired", aResponse(v), null);
    }

    @Transactional
    public ReservaResponse cancelar(Long reservaId, Long usuarioId) {
        Reserva v = reservas.findById(reservaId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "reserva no existe"));
        if (!usuarioId.equals(v.getClienteId()) && !usuarioId.equals(v.getTaxistaId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "no participas en la reserva");
        if (v.getEstado() == EstadoReserva.CANCELADA || v.getEstado() == EstadoReserva.COMPLETADA)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "reserva ya cerrada");

        // Política de cancelación: una vez ACEPTADA, no se puede cancelar a última
        // hora para no dejar tirada a la otra parte. El taxista que se comprometió
        // tiene un margen mayor (no puede soltarla a <2h); el cliente, hasta 30 min.
        if (v.getEstado() == EstadoReserva.ACEPTADA) {
            long minutos = java.time.Duration.between(Instant.now(), v.getProgramadaPara()).toMinutes();
            boolean esTaxista = usuarioId.equals(v.getTaxistaId());
            long limite = esTaxista ? 120 : 30;
            if (minutos < limite)
                throw new ResponseStatusException(HttpStatus.CONFLICT, esTaxista
                    ? "No puedes cancelar una reserva aceptada con menos de 2 h de antelación. Contacta al cliente por WhatsApp."
                    : "No puedes cancelar con menos de 30 min. Contacta al taxista por WhatsApp.");
        }
        v.setEstado(EstadoReserva.CANCELADA);
        v = reservas.save(v);
        var dto = aResponse(v);
        // avisa a la otra parte
        Long otro = usuarioId.equals(v.getClienteId()) ? v.getTaxistaId() : v.getClienteId();
        if (otro != null) difundir("reserva:cancelled", dto, otro);
        return dto;
    }

    private ReservaResponse aResponse(Reserva v) {
        var cliente = usuarios.findById(v.getClienteId()).orElse(null);
        var taxista = v.getTaxistaId() != null ? usuarios.findById(v.getTaxistaId()).orElse(null) : null;
        return new ReservaResponse(
            v.getId(), v.getTipo().name(), v.getDetalle(), v.getEstado().name(),
            v.getOrigenLat(), v.getOrigenLng(), v.getDestinoLat(), v.getDestinoLng(),
            v.getOrigenTexto(), v.getDestinoTexto(),
            v.getProgramadaPara(), v.getPrecioEstimado(), v.getDistanciaKm(), v.getNotas(),
            v.getClienteId(), cliente != null ? cliente.getNombre() : null,
            cliente != null ? cliente.getTelefono() : null,
            v.getTaxistaId(), taxista != null ? taxista.getNombre() : null,
            taxista != null ? taxista.getTelefono() : null);
    }

    /** destinatario null = difundir a todos los taxistas; si no, a ese usuario. */
    private void difundir(String event, ReservaResponse dto, Long destinatario) {
        String json;
        try { json = mapper.writeValueAsString(Map.of("event", event, "data", dto)); }
        catch (Exception e) { return; }
        for (WebSocketSession s : registry.all()) {
            if (!s.isOpen()) continue;
            boolean enviar = destinatario != null
                ? destinatario.equals(s.getAttributes().get("userId"))
                : "TAXISTA".equals(s.getAttributes().get("rol"));
            if (!enviar) continue;
            try { s.sendMessage(new TextMessage(json)); } catch (Exception ignored) {}
        }
    }
}
