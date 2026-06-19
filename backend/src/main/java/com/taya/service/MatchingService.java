package com.taya.service;
import com.taya.model.Viaje;
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

    public MatchingService(UbicacionService u, TarifaService t, TripWsService ws, WsSessionRegistry registry) {
        this.ubicacion = u; this.tarifa = t; this.ws = ws; this.registry = registry;
    }

    public void difundirNuevoViaje(Viaje viaje) {
        double radio = tarifa.radioBusquedaKm().doubleValue();

        // Primer intento: taxistas libres en radio configurado
        List<Long> ids = libresConSesion(viaje.getOrigenLat(), viaje.getOrigenLng(), radio);

        // Si nadie tiene WS activo en el radio, ampliar hasta 50 km (toda la isla)
        if (ids.isEmpty()) {
            ids = libresConSesion(viaje.getOrigenLat(), viaje.getOrigenLng(), 50.0);
        }

        // Si aún vacío, enviar a TODOS los taxistas con sesión activa (fallback total)
        if (ids.isEmpty()) {
            ids = ubicacion.libresEnRadio(viaje.getOrigenLat(), viaje.getOrigenLng(), 300.0)
                .stream().map(UbicacionService.TaxiCercano::taxistaId).toList();
        }

        if (!ids.isEmpty()) ws.enviarNuevoViaje(ids, viaje);
    }

    /** Filtra: solo taxistas LIBRES en Redis que además tienen WS abierto ahora mismo */
    private List<Long> libresConSesion(double lat, double lng, double radioKm) {
        return ubicacion.libresEnRadio(lat, lng, radioKm)
            .stream()
            .map(UbicacionService.TaxiCercano::taxistaId)
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
