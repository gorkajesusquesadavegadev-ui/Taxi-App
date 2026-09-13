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

    /** Verificado + no bloqueado + (si el viaje requiere taxi adaptado) vehículo
     *  accesible + del municipio del que sale el viaje. */
    private boolean aptoPara(Long taxistaId, boolean requiereAccesible, com.taya.model.Municipio muniViaje) {
        return usuarios.findById(taxistaId)
            .map(u -> u.isVerificado() && !u.isBloqueado()
                && (!requiereAccesible || u.isVehiculoAccesible())
                && atiende(u, muniViaje))
            .orElse(false);
    }

    /**
     * ¿Puede este taxista atender un viaje que empieza en muniViaje?
     *
     * La licencia es municipal: un taxista solo puede recoger en su municipio.
     * Un taxista de Las Palmas NO puede coger un servicio que arranca en San
     * Bartolomé de Tirajana, ni al revés. Esto es obligatorio, no una
     * preferencia: un taxi recogiendo fuera de su municipio es ilegal.
     *
     * Regla:
     *   - Si el viaje SALE de un municipio que el sistema conoce (Las Palmas o
     *     San Bartolomé), SOLO lo reciben los taxistas de ESE municipio. Uno de
     *     otro municipio queda fuera, y uno SIN municipio asignado también
     *     (antes pasaba: un taxista sin asignar recibía todo, incluidos los
     *     viajes del sur — justo el fallo que reportó un taxista de Las Palmas
     *     al que le llegó un viaje de Maspalomas).
     *   - Si el viaje sale de una zona que el sistema no modela como municipio
     *     propio (aeropuerto, centro/norte de la isla, otro municipio sin
     *     taxistas aquí), lo puede coger cualquiera: no hay a quién
     *     restringirlo y así no se quedan esos viajes sin taxi.
     *
     * Con esto el filtro es correcto AUNQUE el taxista esté sin municipio
     * asignado: un DESCONOCIDO ya no recibe viajes de Las Palmas ni del sur.
     */
    static boolean atiende(Usuario t, com.taya.model.Municipio muniViaje) {
        // Origen sin municipio modelado: cualquiera puede cogerlo.
        if (muniViaje == com.taya.model.Municipio.DESCONOCIDO) return true;
        // Origen en un municipio conocido: solo taxistas de ese mismo municipio.
        return t.getMunicipioLicencia() == muniViaje;
    }

    public void difundirNuevoViaje(Viaje viaje) {
        double radio = tarifa.radioBusquedaKm().doubleValue();
        double lat = viaje.getOrigenLat(), lng = viaje.getOrigenLng();
        boolean acc = viaje.isRequiereAccesible();
        // Municipio del que sale el viaje: solo recibirán los taxistas de ese
        // municipio (o los de municipio aún sin asignar).
        com.taya.model.Municipio muni = com.taya.util.Municipios.dePunto(lat, lng);

        // === Canal 1: WebSocket (app abierta) — entrega instantánea ===
        List<Long> ids = libresConSesion(lat, lng, radio, acc, muni);
        if (ids.isEmpty()) ids = libresConSesion(lat, lng, 50.0, acc, muni);
        if (ids.isEmpty()) {
            ids = ubicacion.libresEnRadio(lat, lng, 300.0)
                .stream().map(UbicacionService.TaxiCercano::taxistaId).filter(id -> aptoPara(id, acc, muni)).toList();
        }
        if (!ids.isEmpty()) ws.enviarNuevoViaje(ids, viaje);

        // === Canal 2: Web Push (app cerrada) — disponibilidad persistente en BD ===
        // El Redis GEO caduca al cerrar la app, así que para alcanzar a taxistas
        // con la app cerrada usamos la disponibilidad persistente + su última
        // posición conocida. No re-notificamos a los que ya tienen WS abierto.
        notificarPush(viaje, lat, lng, ids, muni);
    }

    private void notificarPush(Viaje viaje, double lat, double lng, List<Long> yaPorWs, com.taya.model.Municipio muni) {
        double radioPush = Math.max(tarifa.radioBusquedaKm().doubleValue(), 15.0); // algo más amplio
        boolean acc = viaje.isRequiereAccesible();
        String zona = tarifa.zonaLabel(lat, lng, viaje.getDestinoLat(), viaje.getDestinoLng());
        String cuerpo = (viaje.getPrecioEstimado() != null ? viaje.getPrecioEstimado() + " € · " : "")
            + (zona != null ? zona : "Viaje cercano");
        for (Usuario t : usuarios.findByRolAndDisponibleTrue(Rol.TAXISTA)) {
            if (!t.isVerificado() || t.isBloqueado()) continue;
            if (acc && !t.isVehiculoAccesible()) continue;
            if (!atiende(t, muni)) continue;                           // licencia de otro municipio
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
    private List<Long> libresConSesion(double lat, double lng, double radioKm, boolean requiereAccesible, com.taya.model.Municipio muni) {
        return ubicacion.libresEnRadio(lat, lng, radioKm)
            .stream()
            .map(UbicacionService.TaxiCercano::taxistaId)
            .filter(id -> aptoPara(id, requiereAccesible, muni))
            .filter(id -> {
                if (ubicacion.tienePing(id)) return true;
                ubicacion.setDesconectado(id); // sin ping: fantasma, limpiar Redis
                return false;
            })
            .toList();
    }
}
