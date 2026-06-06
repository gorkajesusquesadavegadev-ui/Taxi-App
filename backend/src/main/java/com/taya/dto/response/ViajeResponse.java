package com.taya.dto.response;
import com.taya.model.Viaje;
import java.math.BigDecimal;
public record ViajeResponse(Long id, Long clienteId, Long taxistaId, String estado,
    double origenLat, double origenLng, double destinoLat, double destinoLng,
    BigDecimal distanciaEstimadaKm, BigDecimal precioEstimado,
    BigDecimal distanciaRealKm, BigDecimal precioFinal) {
    public static ViajeResponse of(Viaje v) {
        return new ViajeResponse(v.getId(), v.getClienteId(), v.getTaxistaId(), v.getEstado().name(),
            v.getOrigenLat(), v.getOrigenLng(), v.getDestinoLat(), v.getDestinoLng(),
            v.getDistanciaEstimadaKm(), v.getPrecioEstimado(), v.getDistanciaRealKm(), v.getPrecioFinal());
    }
}
