package com.taya.dto.response;
import com.taya.model.Viaje;
import java.math.BigDecimal;
import java.time.Instant;
public record ViajeResponse(Long id, Long clienteId, Long taxistaId, String estado,
    double origenLat, double origenLng, double destinoLat, double destinoLng,
    BigDecimal distanciaEstimadaKm, BigDecimal precioEstimado,
    BigDecimal distanciaRealKm, BigDecimal precioFinal, String tipo, String detalle,
    String origenTexto, String destinoTexto, Instant solicitadoEn, Instant completadoEn) {
    public static ViajeResponse of(Viaje v) {
        return new ViajeResponse(v.getId(), v.getClienteId(), v.getTaxistaId(), v.getEstado().name(),
            v.getOrigenLat(), v.getOrigenLng(), v.getDestinoLat(), v.getDestinoLng(),
            v.getDistanciaEstimadaKm(), v.getPrecioEstimado(), v.getDistanciaRealKm(), v.getPrecioFinal(),
            v.getTipo() != null ? v.getTipo().name() : "NORMAL", v.getDetalle(),
            v.getOrigenTexto(), v.getDestinoTexto(), v.getSolicitadoEn(), v.getCompletadoEn());
    }
}
