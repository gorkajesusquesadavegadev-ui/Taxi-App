package com.taya.service;
import com.taya.dto.request.*;
import com.taya.dto.response.*;
import com.taya.model.*;
import com.taya.repository.ViajeRepository;
// Reserva está en com.taya.model (cubierto por el import *)
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
    private final GeocodingService geo;
    private final com.taya.repository.UsuarioRepository usuarios;
    private final com.taya.repository.ValoracionRepository valoraciones;

    public ViajeService(ViajeRepository v, TarifaService t, UbicacionService u, MatchingService m,
                        TripWsService ws, CatalogoService c, OsrmClient osrm, GeocodingService geo,
                        com.taya.repository.UsuarioRepository usuarios,
                        com.taya.repository.ValoracionRepository valoraciones) {
        this.viajes = v; this.tarifa = t; this.ubicacion = u; this.matching = m; this.ws = ws;
        this.catalogo = c; this.osrm = osrm; this.geo = geo; this.usuarios = usuarios;
        this.valoraciones = valoraciones;
    }

    /** ViajeResponse con datos de contacto del taxista y del cliente. */
    private ViajeResponse conContacto(Viaje v) {
        var tax = v.getTaxistaId() != null ? usuarios.findById(v.getTaxistaId()).orElse(null) : null;
        var cli = v.getClienteId() != null ? usuarios.findById(v.getClienteId()).orElse(null) : null;
        return ViajeResponse.of(v,
            tax != null ? tax.getNombre() : null, tax != null ? tax.getTelefono() : null,
            cli != null ? cli.getNombre() : null, cli != null ? cli.getTelefono() : null,
            tax != null ? tax.getVehiculoMatricula() : null,
            tax != null ? tax.getVehiculoModelo() : null,
            tax != null ? tax.getLicencia() : null,
            tax != null ? tax.getRatingMedia() : null,
            tax != null ? tax.getRatingCount() : null,
            tax != null ? tax.isVerificado() : null);
    }

    /** Recorrido completo de una oferta: recogida → paradas → destino. */
    private static java.util.List<double[]> puntosDeOferta(CatalogoService.Oferta of, double oLat, double oLng) {
        var pts = new java.util.ArrayList<double[]>();
        pts.add(new double[]{oLat, oLng});
        pts.addAll(of.paradas());
        pts.add(new double[]{of.destinoLat(), of.destinoLng()});
        return pts;
    }

    // Multiparada: parseo/serialización "lat,lng;lat,lng".
    static java.util.List<double[]> listaParadas(double[][] arr) {
        var out = new java.util.ArrayList<double[]>();
        if (arr != null) for (double[] p : arr) if (p != null && p.length == 2) out.add(new double[]{p[0], p[1]});
        return out;
    }
    static String formatParadas(double[][] arr) {
        var l = listaParadas(arr);
        if (l.isEmpty()) return null;
        var sb = new StringBuilder();
        for (double[] p : l) { if (sb.length() > 0) sb.append(';'); sb.append(p[0]).append(',').append(p[1]); }
        return sb.toString();
    }
    static java.util.List<double[]> parseParadas(String s) {
        var out = new java.util.ArrayList<double[]>();
        if (s == null || s.isBlank()) return out;
        for (String par : s.split(";")) {
            var xy = par.split(",");
            if (xy.length == 2) out.add(new double[]{Double.parseDouble(xy[0]), Double.parseDouble(xy[1])});
        }
        return out;
    }

    public EstimacionResponse estimar(EstimarRequest r) {
        return tarifa.estimarVia(r.origenLat(), r.origenLng(), r.destinoLat(), r.destinoLng(),
            listaParadas(r.paradas()));
    }

    @Transactional
    public ViajeResponse solicitar(Long clienteId, SolicitarViajeRequest r) {
        var est = tarifa.estimarVia(r.origenLat(), r.origenLng(), r.destinoLat(), r.destinoLng(),
            listaParadas(r.paradas()));
        Viaje v = new Viaje();
        v.setClienteId(clienteId);
        v.setOrigenLat(r.origenLat()); v.setOrigenLng(r.origenLng());
        v.setDestinoLat(r.destinoLat()); v.setDestinoLng(r.destinoLng());
        // nombre del cliente si llega; si falta, el backfill async lo resuelve
        // después (pedir taxi nunca espera a un geocoder externo)
        v.setOrigenTexto(sinTexto(r.origenTexto()) ? null : r.origenTexto());
        v.setDestinoTexto(sinTexto(r.destinoTexto()) ? null : r.destinoTexto());
        v.setRequiereAccesible(Boolean.TRUE.equals(r.requiereAccesible()));
        v.setParadas(formatParadas(r.paradas()));
        v.setDistanciaEstimadaKm(est.distanciaKm()); v.setPrecioEstimado(est.precioEstimado());
        v.setEstado(EstadoViaje.SOLICITADO);
        v = viajes.save(v);
        matching.difundirNuevoViaje(v);
        backfillTextosAsync(List.of(v));
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
        v.setDestinoTexto(of.nombre()); // origenTexto lo resuelve el backfill async
        v.setDistanciaEstimadaKm(BigDecimal.valueOf(ruta.km()));
        // TRANSFER: tarifa vigente sobre la ruta REAL desde la recogida elegida
        // (no es lo mismo salir de Jamat que de Santa Catalina).
        // EXCURSIÓN: precio por duración del catálogo, independiente de la recogida.
        if (of.tipo() == com.taya.model.TipoViaje.TRANSFER) {
            java.math.BigDecimal p;
            try {
                p = tarifa.precioPorRuta(oLat, oLng, of.destinoLat(), of.destinoLng(), ruta.km());
            } catch (Exception e) { p = of.precio(); }
            v.setPrecioEstimado(p != null ? p : of.precio());
        } else {
            v.setPrecioEstimado(of.precio());
        }
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
        // Solo taxistas verificados (y no bloqueados) pueden aceptar viajes:
        // el matching ya los filtra, pero el endpoint debe imponerlo igualmente.
        usuarios.findById(taxistaId).ifPresent(u -> {
            if (!u.isVerificado() || u.isBloqueado())
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Cuenta pendiente de verificación por el administrador");
        });
        int updated = viajes.aceptarSiDisponible(viajeId, taxistaId, Instant.now());
        if (updated == 0)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "viaje ya no disponible");
        ubicacion.setOcupado(taxistaId);
        // Ocupado: deja de ser elegible para PUSH de nuevos viajes.
        usuarios.findById(taxistaId).ifPresent(u -> { u.setDisponible(false); usuarios.save(u); });
        Viaje v = viajes.findById(viajeId).orElseThrow();
        ubicacion.vincularViaje(taxistaId, v.getClienteId()); // posición en vivo al cliente
        // Notify the client their trip was accepted. The losing taxistas learn via the 409
        // they receive when calling /aceptar, so trip:taken push is optional for MVP.
        ws.enviarAceptado(v.getClienteId(), v);
        return conContacto(v);
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
        // Precio cerrado pactado al solicitar, para TODOS los tipos de viaje.
        // Antes, un viaje NORMAL recalculaba el precio aquí con tarifa.precioPorRuta()
        // usando la hora de ESTE momento (finalizar), no la hora en que se pidió.
        // Un viaje pedido a las 21:55 (tarifa diurna) que el taxista termina a
        // las 22:10 pasaba a cobrarse TODO el trayecto a tarifa nocturna — un
        // precio distinto al que se le mostró al cliente al pedirlo. Como esta
        // app no tiene un taxímetro con GPS continuo (la distancia es una
        // estimación OSRM tomada una sola vez), recalcular con la hora de
        // cierre no mide nada más real: solo cambia qué franja horaria le
        // toca en la lotería de cuándo exactamente termina el trayecto. Se
        // bloquea el precio mostrado al pedir, igual que ya hacían
        // transfers/excursiones — mismo criterio para todo, sin sorpresas.
        v.setDistanciaRealKm(v.getDistanciaEstimadaKm());
        v.setPrecioFinal(v.getPrecioEstimado());
        v.setEstado(EstadoViaje.COMPLETADO); v.setCompletadoEn(Instant.now());
        final double finLat = v.getDestinoLat(), finLng = v.getDestinoLng();
        ubicacion.setLibre(taxistaId, finLat, finLng);
        ubicacion.desvincularViaje(taxistaId);
        // Vuelve a estar disponible para PUSH de nuevos viajes.
        usuarios.findById(taxistaId).ifPresent(u -> {
            u.setDisponible(true);
            u.setUltimaLat(finLat); u.setUltimaLng(finLng);
            usuarios.save(u);
        });
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
        if (v.getTaxistaId() != null) {
            ubicacion.setLibre(v.getTaxistaId(), v.getOrigenLat(), v.getOrigenLng());
            ubicacion.desvincularViaje(v.getTaxistaId());
            usuarios.findById(v.getTaxistaId()).ifPresent(u -> { u.setDisponible(true); usuarios.save(u); });
        }
        v.setEstado(EstadoViaje.CANCELADO); v.setCanceladoEn(Instant.now());
        v = viajes.save(v);
        ws.enviarCancelado(v.getClienteId(), v.getTaxistaId(), v.getId());
        return ViajeResponse.of(v);
    }

    /** One trip by id, restricted to its participants. The client polls this to
     *  observe terminal states (COMPLETADO/CANCELADO) that /activo can't return. */
    /** Genera (o reutiliza) un token público para seguir el viaje en vivo. */
    @Transactional
    public String compartir(Long viajeId, Long clienteId) {
        Viaje v = viajes.findById(viajeId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "viaje no existe"));
        if (!clienteId.equals(v.getClienteId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "no es tu viaje");
        if (v.getShareToken() == null) {
            v.setShareToken(java.util.UUID.randomUUID().toString().replace("-", ""));
            viajes.save(v);
        }
        return v.getShareToken();
    }

    public record SeguimientoResponse(String estado, Double taxiLat, Double taxiLng,
        double origenLat, double origenLng, double destinoLat, double destinoLng,
        String origenTexto, String destinoTexto, String taxistaNombre, String matricula,
        String modelo, Integer etaMin) {}

    /** Datos públicos (sin login) para la página de seguimiento por token. */
    public SeguimientoResponse seguir(String token) {
        Viaje v = viajes.findByShareToken(token)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "enlace no válido"));
        Double tLat = null, tLng = null;
        if (v.getTaxistaId() != null) {
            String ubic = ubicacion.ubicacion(v.getTaxistaId());
            if (ubic != null) {
                String[] p = ubic.split(",");
                tLat = Double.parseDouble(p[0]); tLng = Double.parseDouble(p[1]);
            }
        }
        var tax = v.getTaxistaId() != null ? usuarios.findById(v.getTaxistaId()).orElse(null) : null;
        Integer eta = null;
        if (tLat != null && "ACEPTADO".equals(v.getEstado().name())) {
            double km = haversineKm(tLat, tLng, v.getOrigenLat(), v.getOrigenLng());
            eta = Math.max(1, (int) Math.round(km / 22.0 * 60));
        }
        return new SeguimientoResponse(v.getEstado().name(), tLat, tLng,
            v.getOrigenLat(), v.getOrigenLng(), v.getDestinoLat(), v.getDestinoLng(),
            v.getOrigenTexto(), v.getDestinoTexto(),
            tax != null ? tax.getNombre() : null,
            tax != null ? tax.getVehiculoMatricula() : null,
            tax != null ? tax.getVehiculoModelo() : null, eta);
    }

    private static double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1), dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(Math.toRadians(lat1))*Math.cos(Math.toRadians(lat2))*Math.sin(dLng/2)*Math.sin(dLng/2);
        return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    /** Puntos del recorrido del viaje con paradas: origen → paradas → destino. */
    private static java.util.List<double[]> puntosViaje(Viaje v, java.util.List<double[]> paradas) {
        var pts = new java.util.ArrayList<double[]>();
        pts.add(new double[]{v.getOrigenLat(), v.getOrigenLng()});
        pts.addAll(paradas);
        pts.add(new double[]{v.getDestinoLat(), v.getDestinoLng()});
        return pts;
    }

    public ViajeResponse uno(Long viajeId, Long usuarioId) {
        Viaje v = viajes.findById(viajeId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "viaje no existe"));
        if (!usuarioId.equals(v.getClienteId()) && !usuarioId.equals(v.getTaxistaId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "no participas en el viaje");
        return conContacto(v);
    }

    /** Ruta por calles del viaje. Para ofertas reconstruye las paradas del
     *  catálogo, así la excursión dibuja su recorrido completo en el mapa. */
    public RutaResponse rutaDe(Long viajeId, Long usuarioId) {
        Viaje v = viajes.findById(viajeId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "viaje no existe"));
        if (!usuarioId.equals(v.getClienteId()) && !usuarioId.equals(v.getTaxistaId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "no participas en el viaje");
        var paradas = parseParadas(v.getParadas());
        var ruta = (v.getOfertaId() != null)
            ? catalogo.porId(v.getOfertaId())
                .map(of -> osrm.rutaVia(puntosDeOferta(of, v.getOrigenLat(), v.getOrigenLng())))
                .orElseGet(() -> osrm.rutaEntre(v.getOrigenLat(), v.getOrigenLng(), v.getDestinoLat(), v.getDestinoLng()))
            : paradas.isEmpty()
                ? osrm.rutaEntre(v.getOrigenLat(), v.getOrigenLng(), v.getDestinoLat(), v.getDestinoLng())
                : osrm.rutaVia(puntosViaje(v, paradas));
        return new RutaResponse(ruta.puntos(), BigDecimal.valueOf(ruta.km()),
            BigDecimal.valueOf(Math.ceil(ruta.duracionMin())));
    }

    /** The client's current non-terminal trip, or null. Used by the client to
     *  resync its UI on load/poll so a missed WebSocket event never strands it. */
    public ViajeResponse activoCliente(Long clienteId) {
        return viajes.findFirstByClienteIdAndEstadoInOrderBySolicitadoEnDesc(clienteId,
            List.of(EstadoViaje.SOLICITADO, EstadoViaje.ACEPTADO, EstadoViaje.LLEGADO, EstadoViaje.EN_CURSO))
            .map(this::conContacto).orElse(null);
    }

    /**
     * Último viaje COMPLETADO del cliente en las últimas 24 h que aún no ha
     * valorado, o null.
     *
     * Existe porque activoCliente() solo devuelve estados no terminales: en
     * cuanto el viaje terminaba y el cliente recargaba o volvía a abrir la app,
     * el viaje quedaba fuera de alcance y ya no había forma de valorarlo. La
     * tarjeta de valoración solo sobrevivía si dejabas la pestaña abierta.
     */
    public ViajeResponse ultimoValorableCliente(Long clienteId) {
        return viajes.findFirstByClienteIdAndEstadoAndCompletadoEnAfterOrderByCompletadoEnDesc(
                clienteId, EstadoViaje.COMPLETADO, Instant.now().minus(24, java.time.temporal.ChronoUnit.HOURS))
            .filter(v -> !valoraciones.existsByViajeIdAndAutorId(v.getId(), clienteId))
            .map(this::conContacto).orElse(null);
    }

    /** Viaje activo asignado al taxista (p.ej. reserva activada a su hora). */
    public ViajeResponse activoTaxista(Long taxistaId) {
        return viajes.findFirstByTaxistaIdAndEstadoInOrderBySolicitadoEnDesc(taxistaId,
            List.of(EstadoViaje.ACEPTADO, EstadoViaje.LLEGADO, EstadoViaje.EN_CURSO))
            .map(ViajeResponse::of).orElse(null);
    }

    /** Convierte una reserva (a su hora) en un viaje ACEPTADO ya asignado al
     *  taxista, y avisa a ambos. El cliente entra en el flujo normal de viaje. */
    @Transactional
    public Viaje activarDesdeReserva(Reserva r) {
        Viaje v = new Viaje();
        v.setClienteId(r.getClienteId());
        v.setTaxistaId(r.getTaxistaId());
        v.setOrigenLat(r.getOrigenLat()); v.setOrigenLng(r.getOrigenLng());
        v.setDestinoLat(r.getDestinoLat()); v.setDestinoLng(r.getDestinoLng());
        v.setOrigenTexto(r.getOrigenTexto()); v.setDestinoTexto(r.getDestinoTexto());
        v.setDistanciaEstimadaKm(r.getDistanciaKm());
        v.setPrecioEstimado(r.getPrecioEstimado());
        v.setTipo(r.getTipo()); v.setDetalle(r.getDetalle()); v.setOfertaId(r.getOfertaId());
        v.setEstado(EstadoViaje.ACEPTADO);
        v.setAceptadoEn(Instant.now());
        v = viajes.save(v);
        if (r.getTaxistaId() != null) {
            ubicacion.setOcupado(r.getTaxistaId());
            ubicacion.vincularViaje(r.getTaxistaId(), v.getClienteId());
        }
        ws.enviarAceptado(v.getClienteId(), v);   // cliente: "Taxista en camino"
        ws.enviarAsignado(v.getTaxistaId(), v);   // taxista: viaje para conducir
        return v;
    }

    /**
     * Polling fallback: returns nearest SOLICITADO trip within search radius.
     * Used by taxista frontend every 5s to catch any WS-missed dispatch.
     */
    public ViajeResponse pendienteCercanoParaTaxista(Long taxistaId) {
        // Mismo filtro que el matching: los no verificados/bloqueados no ven
        // viajes pendientes (este endpoint es el canal de sondeo del taxista).
        var taxista = usuarios.findById(taxistaId).orElse(null);
        if (taxista == null || !taxista.isVerificado() || taxista.isBloqueado()) return null;
        String ubic = ubicacion.ubicacion(taxistaId);
        if (ubic == null) return null;
        String[] parts = ubic.split(",");
        double tLat = Double.parseDouble(parts[0]);
        double tLng = Double.parseDouble(parts[1]);
        double radio = tarifa.radioBusquedaKm().doubleValue();

        // Only consider trips requested in the last 5 minutes
        Instant ventana = Instant.now().minusSeconds(300);
        List<Viaje> candidatos = viajes.findByEstadoAndSolicitadoEnBefore(
            EstadoViaje.SOLICITADO, Instant.now().plusSeconds(1));

        return candidatos.stream()
            .filter(v -> v.getSolicitadoEn().isAfter(ventana))
            .filter(v -> {
                double dlat = Math.toRadians(v.getOrigenLat() - tLat);
                double dlng = Math.toRadians(v.getOrigenLng() - tLng);
                double a = Math.sin(dlat / 2) * Math.sin(dlat / 2)
                    + Math.cos(Math.toRadians(tLat)) * Math.cos(Math.toRadians(v.getOrigenLat()))
                    * Math.sin(dlng / 2) * Math.sin(dlng / 2);
                double km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                return km <= radio * 2; // double radius for poll fallback
            })
            .min(java.util.Comparator.comparing(Viaje::getSolicitadoEn))
            .map(ViajeResponse::of)
            .orElse(null);
    }

    /**
     * Historial SIN teléfonos (minimización de datos, RGPD art. 5.1.c).
     *
     * El teléfono del otro se necesita mientras dura el viaje —para avisar de
     * dónde estás o de que te dejaste algo—, no para siempre. Antes el
     * historial devolvía el número de cada taxista con el que habías viajado y
     * el de cada cliente que habías llevado: una agenda permanente que nadie
     * pidió y que agrava cualquier filtración. Se conserva el nombre, que sí
     * da contexto al viaje.
     */
    private ViajeResponse sinTelefonos(Viaje v) {
        var tax = v.getTaxistaId() != null ? usuarios.findById(v.getTaxistaId()).orElse(null) : null;
        var cli = v.getClienteId() != null ? usuarios.findById(v.getClienteId()).orElse(null) : null;
        return ViajeResponse.of(v,
            tax != null ? tax.getNombre() : null, null,
            cli != null ? cli.getNombre() : null, null,
            tax != null ? tax.getVehiculoMatricula() : null,
            tax != null ? tax.getVehiculoModelo() : null,
            tax != null ? tax.getLicencia() : null,
            tax != null ? tax.getRatingMedia() : null,
            tax != null ? tax.getRatingCount() : null,
            tax != null ? tax.isVerificado() : null);
    }

    public List<ViajeResponse> historialCliente(Long clienteId) {
        var lista = viajes.findByClienteIdOrderBySolicitadoEnDesc(clienteId);
        backfillTextosAsync(lista);
        return lista.stream().map(this::sinTelefonos).toList();
    }
    public List<ViajeResponse> historialTaxista(Long taxistaId) {
        var lista = viajes.findByTaxistaIdOrderBySolicitadoEnDesc(taxistaId);
        backfillTextosAsync(lista);
        return lista.stream().map(this::sinTelefonos).toList();
    }

    private static boolean sinTexto(String s) { return s == null || s.isBlank(); }

    // Backfill de nombres en segundo plano: la respuesta del historial nunca
    // espera a geocoders externos. Un solo hilo serializa las llamadas
    // (respeta rate limits) y el set evita re-encolar el mismo viaje.
    private final java.util.concurrent.ExecutorService geoPool =
        java.util.concurrent.Executors.newSingleThreadExecutor(r -> {
            Thread t = new Thread(r, "geo-backfill");
            t.setDaemon(true);
            return t;
        });
    private final java.util.Set<Long> geoPendientes =
        java.util.concurrent.ConcurrentHashMap.newKeySet();

    private void backfillTextosAsync(List<Viaje> lista) {
        for (Viaje v : lista) {
            if (!sinTexto(v.getOrigenTexto()) && !sinTexto(v.getDestinoTexto())) continue;
            final Long id = v.getId();
            if (!geoPendientes.add(id)) continue;
            geoPool.submit(() -> {
                try {
                    viajes.findById(id).ifPresent(x -> {
                        boolean cambiado = false;
                        if (sinTexto(x.getOrigenTexto())) {
                            var n = geo.nombreDe(x.getOrigenLat(), x.getOrigenLng());
                            if (n.isPresent()) { x.setOrigenTexto(n.get()); cambiado = true; }
                        }
                        if (sinTexto(x.getDestinoTexto())) {
                            var n = geo.nombreDe(x.getDestinoLat(), x.getDestinoLng());
                            if (n.isPresent()) { x.setDestinoTexto(n.get()); cambiado = true; }
                        }
                        if (cambiado) viajes.save(x);
                    });
                } finally {
                    geoPendientes.remove(id);
                }
            });
        }
    }
}
