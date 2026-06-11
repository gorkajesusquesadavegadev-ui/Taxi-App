package com.taya.service;
import com.taya.dto.request.*;
import com.taya.dto.response.*;
import com.taya.model.*;
import com.taya.repository.ViajeRepository;
import com.taya.websocket.TripWsService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
public class ViajeService {
    private final ViajeRepository viajes;
    private final TarifaService tarifa;
    private final UbicacionService ubicacion;
    private final MatchingService matching;
    private final TripWsService ws;
    private final CatalogoService catalogo;
    private final OsrmClient osrm;

    public ViajeService(ViajeRepository v, TarifaService t, UbicacionService u, MatchingService m,
                        TripWsService ws, CatalogoService c, OsrmClient osrm) {
        this.viajes = v; this.tarifa = t; this.ubicacion = u; this.matching = m; this.ws = ws;
        this.catalogo = c; this.osrm = osrm;
    }

    /** Recorrido completo de una oferta: recogida → paradas → destino. */
    private static java.util.List<double[]> puntosDeOferta(CatalogoService.Oferta of, double oLat, double oLng) {
        var pts = new java.util.ArrayList<double[]>();
        pts.add(new double[]{oLat, oLng});
        pts.addAll(of.paradas());
        pts.add(new double[]{of.destinoLat(), of.destinoLng()});
        return pts;
    }

    public EstimacionResponse estimar(EstimarRequest r) {
        return tarifa.estimar(r.origenLat(), r.origenLng(), r.destinoLat(), r.destinoLng());
    }

    @Transactional
    public ViajeResponse solicitar(Long clienteId, SolicitarViajeRequest r) {
        var est = tarifa.estimar(r.origenLat(), r.origenLng(), r.destinoLat(), r.destinoLng());
        Viaje v = new Viaje();
        v.setClienteId(clienteId);
        v.setOrigenLat(r.origenLat()); v.setOrigenLng(r.origenLng());
        v.setDestinoLat(r.destinoLat()); v.setDestinoLng(r.destinoLng());
        v.setOrigenTexto(r.origenTexto()); v.setDestinoTexto(r.destinoTexto());
        v.setDistanciaEstimadaKm(est.distanciaKm()); v.setPrecioEstimado(est.precioEstimado());
        v.setEstado(EstadoViaje.SOLICITADO);
        v = viajes.save(v);
        matching.difundirNuevoViaje(v);
        return ViajeResponse.of(v);
    }

    /** Transfer o excursión del catálogo: precio cerrado, mismo flujo de matching. */
    @Transactional
    public ViajeResponse solicitarOferta(Long clienteId, SolicitarOfertaRequest r) {
        var of = catalogo.porId(r.ofertaId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "oferta no existe"));
        double oLat = r.recogidaLat() != null ? r.recogidaLat() : of.origenLat();
        double oLng = r.recogidaLng() != null ? r.recogidaLng() : of.origenLng();
        // distancia del recorrido REAL (con paradas), no de la línea origen→destino
        var ruta = osrm.rutaVia(puntosDeOferta(of, oLat, oLng));
        Viaje v = new Viaje();
        v.setClienteId(clienteId);
        v.setOrigenLat(oLat); v.setOrigenLng(oLng);
        v.setDestinoLat(of.destinoLat()); v.setDestinoLng(of.destinoLng());
        v.setDestinoTexto(of.nombre());
        v.setDistanciaEstimadaKm(BigDecimal.valueOf(ruta.km()));
        v.setPrecioEstimado(of.precio()); // precio cerrado del catálogo, no taxímetro
        v.setTipo(of.tipo());
        v.setDetalle(of.nombre());
        v.setOfertaId(of.id());
        v.setEstado(EstadoViaje.SOLICITADO);
        v = viajes.save(v);
        matching.difundirNuevoViaje(v);
        return ViajeResponse.of(v);
    }

    @Transactional
    public ViajeResponse aceptar(Long viajeId, Long taxistaId) {
        int updated = viajes.aceptarSiDisponible(viajeId, taxistaId, Instant.now());
        if (updated == 0)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "viaje ya no disponible");
        ubicacion.setOcupado(taxistaId);
        Viaje v = viajes.findById(viajeId).orElseThrow();
        // Notify the client their trip was accepted. The losing taxistas learn via the 409
        // they receive when calling /aceptar, so trip:taken push is optional for MVP.
        ws.enviarAceptado(v.getClienteId(), v);
        return ViajeResponse.of(v);
    }

    private Viaje cargarDelTaxista(Long viajeId, Long taxistaId, EstadoViaje requerido) {
        Viaje v = viajes.findById(viajeId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "viaje no existe"));
        if (!taxistaId.equals(v.getTaxistaId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "no es tu viaje");
        if (v.getEstado() != requerido)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "estado inválido: " + v.getEstado());
        return v;
    }

    @Transactional
    public ViajeResponse llegada(Long viajeId, Long taxistaId) {
        Viaje v = cargarDelTaxista(viajeId, taxistaId, EstadoViaje.ACEPTADO);
        v.setEstado(EstadoViaje.LLEGADO); v.setLlegadaEn(Instant.now());
        v = viajes.save(v);
        ws.enviarLlegada(v.getClienteId(), v.getId());
        ws.enviarEstado(v.getClienteId(), "ARRIVED");
        return ViajeResponse.of(v);
    }

    @Transactional
    public ViajeResponse iniciar(Long viajeId, Long taxistaId) {
        Viaje v = cargarDelTaxista(viajeId, taxistaId, EstadoViaje.LLEGADO);
        v.setEstado(EstadoViaje.EN_CURSO); v.setIniciadoEn(Instant.now());
        v = viajes.save(v);
        ws.enviarEstado(v.getClienteId(), "IN_PROGRESS");
        return ViajeResponse.of(v);
    }

    @Transactional
    public ViajeResponse finalizar(Long viajeId, Long taxistaId) {
        Viaje v = cargarDelTaxista(viajeId, taxistaId, EstadoViaje.EN_CURSO);
        if (v.getTipo() != null && v.getTipo() != TipoViaje.NORMAL) {
            // transfers/excursiones: precio cerrado pactado al solicitar
            v.setDistanciaRealKm(v.getDistanciaEstimadaKm());
            v.setPrecioFinal(v.getPrecioEstimado());
        } else {
            // Sin GPS real, la distancia OSRM por calles del viaje es el taxímetro
            // más objetivo: el servidor calcula el precio, no el cliente.
            double kmRuta = v.getDistanciaEstimadaKm() != null
                ? v.getDistanciaEstimadaKm().doubleValue()
                : tarifa.estimar(v.getOrigenLat(), v.getOrigenLng(),
                    v.getDestinoLat(), v.getDestinoLng()).distanciaKm().doubleValue();
            v.setDistanciaRealKm(BigDecimal.valueOf(kmRuta));
            v.setPrecioFinal(tarifa.precioFinal(kmRuta));
        }
        v.setEstado(EstadoViaje.COMPLETADO); v.setCompletadoEn(Instant.now());
        ubicacion.setLibre(taxistaId, v.getDestinoLat(), v.getDestinoLng());
        v = viajes.save(v);
        ws.enviarEstado(v.getClienteId(), "COMPLETED");
        return ViajeResponse.of(v);
    }

    @Transactional
    public ViajeResponse cancelar(Long viajeId, Long usuarioId) {
        Viaje v = viajes.findById(viajeId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "viaje no existe"));
        if (!usuarioId.equals(v.getClienteId()) && !usuarioId.equals(v.getTaxistaId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "no participas en el viaje");
        if (v.getEstado() == EstadoViaje.COMPLETADO || v.getEstado() == EstadoViaje.CANCELADO)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "viaje ya cerrado");
        if (v.getTaxistaId() != null) ubicacion.setLibre(v.getTaxistaId(),
            v.getOrigenLat(), v.getOrigenLng());
        v.setEstado(EstadoViaje.CANCELADO); v.setCanceladoEn(Instant.now());
        v = viajes.save(v);
        ws.enviarCancelado(v.getClienteId(), v.getTaxistaId(), v.getId());
        return ViajeResponse.of(v);
    }

    /** One trip by id, restricted to its participants. The client polls this to
     *  observe terminal states (COMPLETADO/CANCELADO) that /activo can't return. */
    public ViajeResponse uno(Long viajeId, Long usuarioId) {
        Viaje v = viajes.findById(viajeId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "viaje no existe"));
        if (!usuarioId.equals(v.getClienteId()) && !usuarioId.equals(v.getTaxistaId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "no participas en el viaje");
        return ViajeResponse.of(v);
    }

    /** Ruta por calles del viaje. Para ofertas reconstruye las paradas del
     *  catálogo, así la excursión dibuja su recorrido completo en el mapa. */
    public RutaResponse rutaDe(Long viajeId, Long usuarioId) {
        Viaje v = viajes.findById(viajeId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "viaje no existe"));
        if (!usuarioId.equals(v.getClienteId()) && !usuarioId.equals(v.getTaxistaId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "no participas en el viaje");
        var ruta = (v.getOfertaId() != null)
            ? catalogo.porId(v.getOfertaId())
                .map(of -> osrm.rutaVia(puntosDeOferta(of, v.getOrigenLat(), v.getOrigenLng())))
                .orElseGet(() -> osrm.rutaEntre(v.getOrigenLat(), v.getOrigenLng(), v.getDestinoLat(), v.getDestinoLng()))
            : osrm.rutaEntre(v.getOrigenLat(), v.getOrigenLng(), v.getDestinoLat(), v.getDestinoLng());
        return new RutaResponse(ruta.puntos(), BigDecimal.valueOf(ruta.km()),
            BigDecimal.valueOf(Math.ceil(ruta.duracionMin())));
    }

    /** The client's current non-terminal trip, or null. Used by the client to
     *  resync its UI on load/poll so a missed WebSocket event never strands it. */
    public ViajeResponse activoCliente(Long clienteId) {
        return viajes.findFirstByClienteIdAndEstadoInOrderBySolicitadoEnDesc(clienteId,
            List.of(EstadoViaje.SOLICITADO, EstadoViaje.ACEPTADO, EstadoViaje.LLEGADO, EstadoViaje.EN_CURSO))
            .map(ViajeResponse::of).orElse(null);
    }

    public List<ViajeResponse> historialCliente(Long clienteId) {
        return viajes.findByClienteIdOrderBySolicitadoEnDesc(clienteId).stream().map(ViajeResponse::of).toList();
    }
    public List<ViajeResponse> historialTaxista(Long taxistaId) {
        return viajes.findByTaxistaIdOrderBySolicitadoEnDesc(taxistaId).stream().map(ViajeResponse::of).toList();
    }
}
