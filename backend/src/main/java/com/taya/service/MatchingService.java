package com.taya.service;
import com.taya.model.Rol;
import com.taya.model.Usuario;
import com.taya.model.Viaje;
import com.taya.repository.UsuarioRepository;
import com.taya.websocket.TripWsService;
import com.taya.websocket.WsSessionRegistry;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class MatchingService {
    private final UbicacionService ubicacion;
    private final TarifaService tarifa;
    private final TripWsService ws;
    private final WsSessionRegistry registry;
    private final UsuarioRepository usuarios;
    private final WebPushService push;

    public MatchingService(UbicacionService u, TarifaService t, TripWsService ws,
                           WsSessionRegistry registry, UsuarioRepository usuarios, WebPushService push) {
        this.ubicacion = u; this.tarifa = t; this.ws = ws;
        this.registry = registry; this.usuarios = usuarios; this.push = push;
    }

    /** Solo se despachan viajes a taxistas verificados (no bloqueados) por el admin. */
    private boolean apto(Long taxistaId) {
        return usuarios.findById(taxistaId)
            .map(u -> u.isVerificado() && !u.isBloqueado())
            .orElse(false);
    }

    public void difundirNuevoViaje(Viaje viaje) {
        double radio = tarifa.radioBusquedaKm().doubleValue();
        double lat = viaje.getOrigenLat(), lng = viaje.getOrigenLng();

        // === Canal 1: WebSocket (app abierta) — entrega instantánea ===
        List<Long> ids = libresConSesion(lat, lng, radio);
        if (ids.isEmpty()) ids = libresConSesion(lat, lng, 50.0);
        if (ids.isEmpty()) {
            ids = ubicacion.libresEnRadio(lat, lng, 300.0)
                .stream().map(UbicacionService.TaxiCercano::taxistaId).filter(this::apto).toList();
        }
        if (!ids.isEmpty()) ws.enviarNuevoViaje(ids, viaje);

        // === Canal 2: Web Push (app cerrada) — disponibilidad persistente en BD ===
        // El Redis GEO caduca al cerrar la app, así que para alcanzar a taxistas
        // con la app cerrada usamos la disponibilidad persistente + su última
        // posición conocida. No re-notificamos a los que ya tienen WS abierto.
        notificarPush(viaje, lat, lng, ids);
    }

    private void notificarPush(Viaje viaje, double lat, double lng, List<Long> yaPorWs) {
        double radioPush = Math.max(tarifa.radioBusquedaKm().doubleValue(), 15.0); // algo más amplio
        String zona = tarifa.zonaLabel(lat, lng, viaje.getDestinoLat(), viaje.getDestinoLng());
        String cuerpo = (viaje.getPrecioEstimado() != null ? viaje.getPrecioEstimado() + " € · " : "")
            + (zona != null ? zona : "Viaje cercano");
        for (Usuario t : usuarios.findByRolAndDisponibleTrue(Rol.TAXISTA)) {
            if (!t.isVerificado() || t.isBloqueado()) continue;
            if (t.getUltimaLat() == null || t.getUltimaLng() == null) continue;
            if (yaPorWs.contains(t.getId())) continue;                 // ya avisado por WS
            var s = registry.get(t.getId());
            if (s != null && s.isOpen()) continue;                     // app abierta: WS/polling lo cubre
            if (haversineKm(lat, lng, t.getUltimaLat(), t.getUltimaLng()) > radioPush) continue;
            push.enviar(t.getId(), "🚖 Nueva solicitud de viaje", cuerpo, "/", "trip:new");
        }
    }

    private static double haversineKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1), dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    /** Filtra: taxistas LIBRES en Redis, verificados, y con WS abierto ahora mismo */
    private List<Long> libresConSesion(double lat, double lng, double radioKm) {
        return ubicacion.libresEnRadio(lat, lng, radioKm)
            .stream()
            .map(UbicacionService.TaxiCercano::taxistaId)
            .filter(this::apto)
            .filter(id -> {
                var s = registry.get(id);
                if (s != null && s.isOpen()) return true;
                // Sesión muerta: limpiar entrada fantasma de Redis
                ubicacion.setDesconectado(id);
                return false;
            })
            .toList();
    }
}
