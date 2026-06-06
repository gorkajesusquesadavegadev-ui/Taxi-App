package com.taya.service;
import com.taya.model.Viaje;
import com.taya.websocket.TripWsService;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class MatchingService {
    private final UbicacionService ubicacion;
    private final TarifaService tarifa;
    private final TripWsService ws;
    public MatchingService(UbicacionService u, TarifaService t, TripWsService ws) { this.ubicacion=u; this.tarifa=t; this.ws=ws; }

    public void difundirNuevoViaje(Viaje viaje) {
        double radio = tarifa.radioBusquedaKm().doubleValue();
        List<Long> ids = ubicacion.libresEnRadio(viaje.getOrigenLat(), viaje.getOrigenLng(), radio)
            .stream().map(UbicacionService.TaxiCercano::taxistaId).toList();
        if (!ids.isEmpty()) ws.enviarNuevoViaje(ids, viaje);
    }
}
