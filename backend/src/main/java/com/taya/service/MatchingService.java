package com.taya.service;
import com.taya.model.Rol;
import com.taya.model.Usuario;
import com.taya.model.Viaje;
import com.taya.repository.UsuarioRepository;
import com.taya.websocket.TripWsService;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class MatchingService {
    private final UbicacionService ubicacion;
    private final TarifaService tarifa;
    private final TripWsService ws;
    private final UsuarioRepository usuarios;
    private final WebPushService push;

    public MatchingService(UbicacionService u, TarifaService t, TripWsService ws,
                           UsuarioRepository usuarios, WebPushService push) {
        this.ubicacion = u; this.tarifa = t; this.ws = ws;
        this.usuarios = usuarios; this.push = push;
    }

    /** Verificado + no bloqueado + (si el viaje requiere taxi adaptado) vehículo accesible. */
    private boolean aptoPara(Long taxistaId, boolean requiereAccesible) {
        return usuarios.findById(taxistaId)
            .map(u -> u.isVerificado() && !u.isBloqueado() && (!requiereAccesible || u.isVehiculoAccesible()))
            .orElse(false);
    }

    public void difundirNuevoViaje(Viaje viaje) {
        double radio = tarifa.radioBusquedaKm().doubleValue();
        double lat = viaje.getOrigenLat(), lng = viaje.getOrigenLng();
        boolean acc = viaje.isRequiereAccesible();

        // === Canal 1: WebSocket (app abierta) — entrega instantánea ===
        List<Long> ids = libresConSesion(lat, lng, radio, acc);
        if (ids.isEmpty()) ids = libresConSesion(lat, lng, 50.0, acc);
        if (ids.isEmpty()) {
            ids = ubicacion.libresEnRadio(lat, lng, 300.0)
                .stream().map(UbicacionService.TaxiCercano::taxistaId).filter(id -> aptoPara(id, acc)).toList();
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
        boolean acc = viaje.isRequiereAccesible();
        String zona = tarifa.zonaLabel(lat, lng, viaje.getDestinoLat(), viaje.getDestinoLng());
        String cuerpo = (viaje.getPrecioEstimado() != null ? viaje.getPrecioEstimado() + " € · " : "")
            + (zona != null ? zona : "Viaje cercano");
        for (Usuario t : usuarios.findByRolAndDisponibleTrue(Rol.TAXISTA)) {
            if (!t.isVerificado() || t.isBloqueado()) continue;
            if (acc && !t.isVehiculoAccesible()) continue;
            if (t.getUltimaLat() == null || t.getUltimaLng() == null) continue;
            if (yaPorWs.contains(t.getId())) continue;                 // ya avisado por WS
            if (ubicacion.tienePing(t.getId())) continue;              // conectado (cualquier instancia): WS/polling lo cubre
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

    /** Taxistas LIBRES en Redis, verificados (y accesibles si procede), conectados.
     *  La presencia se comprueba con el ping global (Redis), no con el registro
     *  local de sesiones: así funciona con varias instancias del backend. La
     *  entrega WS viaja por el relay Redis y llega a la instancia que la aloje. */
    private List<Long> libresConSesion(double lat, double lng, double radioKm, boolean requiereAccesible) {
        return ubicacion.libresEnRadio(lat, lng, radioKm)
            .stream()
            .map(UbicacionService.TaxiCercano::taxistaId)
            .filter(id -> aptoPara(id, requiereAccesible))
            .filter(id -> {
                if (ubicacion.tienePing(id)) return true;
                ubicacion.setDesconectado(id); // sin ping: fantasma, limpiar Redis
                return false;
            })
            .toList();
    }
}
